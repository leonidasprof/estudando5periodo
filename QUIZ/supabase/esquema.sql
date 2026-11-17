-- Ranking do Quiz GTI · Supabase (Postgres)
--
-- Como o site é estático, quem calcula os créditos do ranking é o BANCO, não o navegador:
-- o app envia só "questão X, resposta Y"; a função confere o gabarito e soma os créditos
-- com as mesmas regras do jogo. Assim ninguém consegue mandar "XP = 999999" pelo console.
--
-- Segurança
--  - As tabelas têm RLS ligado e NENHUMA política: a chave pública (publishable/anon) não lê nem grava nada direto.
--  - Tudo passa pelas funções abaixo (SECURITY DEFINER), que só expõem o necessário.
--  - Cada jogador recebe um token secreto (fica só no navegador dele); o banco guarda apenas o hash SHA-256.
--  - Participar é opcional; "Sair do ranking" apaga o jogador e todo o progresso dele (LGPD).
--
-- Este arquivo é idempotente: pode rodar de novo sem perder dados.
-- O gabarito fica em gabarito.sql (gerado por app/gerar_gabarito_sql.py).

create table if not exists public.ranking_jogador (
  id              uuid primary key default gen_random_uuid(),
  token_hash      text not null unique,
  apelido         text not null check (char_length(apelido) between 2 and 24),
  xp              integer not null default 0,
  dominadas       integer not null default 0,
  combo           integer not null default 0,
  ultima_resposta timestamptz,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create table if not exists public.ranking_gabarito (
  questao_id       text primary key,
  corretas         jsonb not null,
  tem_alternativas boolean not null,
  dificil          boolean not null
);

create table if not exists public.ranking_progresso (
  jogador_id uuid not null references public.ranking_jogador(id) on delete cascade,
  questao_id text not null references public.ranking_gabarito(questao_id) on delete cascade,
  tentativas integer not null default 0,
  acertos    integer not null default 0,
  ultima_ok  boolean not null default false,
  primary key (jogador_id, questao_id)
);

create index if not exists ranking_jogador_ordem on public.ranking_jogador (xp desc, dominadas desc, atualizado_em asc);

alter table public.ranking_jogador   enable row level security;
alter table public.ranking_gabarito  enable row level security;
alter table public.ranking_progresso enable row level security;
revoke all on public.ranking_jogador, public.ranking_gabarito, public.ranking_progresso from anon, authenticated;

-- ---------- utilidades internas ----------
create or replace function public._ranking_hash(p_token uuid) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(p_token::text, 'UTF8')), 'hex')
$$;

create or replace function public._ranking_apelido(p_apelido text) returns text
language plpgsql immutable set search_path = '' as $$
declare a text := regexp_replace(trim(coalesce(p_apelido, '')), '\s+', ' ', 'g');
begin
  -- só caracteres "normais" (letras, números, espaço, . _ - ') para evitar bagunça visual
  a := regexp_replace(a, '[^[:alnum:] ._''-]', '', 'g');
  if char_length(a) < 2 or char_length(a) > 24 then
    raise exception 'apelido_invalido' using hint = 'Use de 2 a 24 caracteres.';
  end if;
  return a;
end $$;

-- ---------- API pública ----------

-- Entrar no ranking: devolve o id público e o token secreto (guardado no navegador).
create or replace function public.ranking_entrar(p_apelido text)
returns table (id uuid, token uuid)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare t uuid := gen_random_uuid(); novo uuid;
begin
  insert into public.ranking_jogador (token_hash, apelido)
  values (public._ranking_hash(t), public._ranking_apelido(p_apelido))
  returning ranking_jogador.id into novo;
  return query select novo, t;
end $$;

-- Registrar uma resposta. O servidor corrige e calcula os créditos (mesmas regras do app).
--   p_resposta: lista de letras (questões com alternativas) ou lista de valores (lacunas/associação), na ordem.
create or replace function public.ranking_responder(p_token uuid, p_questao text, p_resposta jsonb)
returns table (ok boolean, xp_ganho integer, xp_total integer, dominadas integer)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  j public.ranking_jogador%rowtype;
  g public.ranking_gabarito%rowtype;
  p public.ranking_progresso%rowtype;
  certo boolean; ganho integer := 0; resp jsonb;
begin
  select * into j from public.ranking_jogador where token_hash = public._ranking_hash(p_token) for update;
  if not found then raise exception 'jogador_nao_encontrado'; end if;
  -- anti-robô: no máximo 1 resposta por segundo
  if j.ultima_resposta is not null and now() - j.ultima_resposta < interval '1 second' then
    raise exception 'muito_rapido';
  end if;
  select * into g from public.ranking_gabarito where questao_id = p_questao;
  if not found then raise exception 'questao_desconhecida'; end if;
  if jsonb_typeof(p_resposta) is distinct from 'array' or jsonb_array_length(p_resposta) > 20 then
    raise exception 'resposta_invalida';
  end if;

  if g.tem_alternativas then  -- múltipla resposta: ordem não importa
    select coalesce(jsonb_agg(v order by v), '[]'::jsonb) into resp from (select distinct v from jsonb_array_elements(p_resposta) v) s;
  else
    resp := p_resposta;
  end if;
  certo := resp = g.corretas;

  select * into p from public.ranking_progresso where jogador_id = j.id and questao_id = p_questao;
  if certo then
    j.combo := j.combo + 1;
    if coalesce(p.acertos, 0) = 0 then ganho := 10 + case when g.dificil then 5 else 0 end;
    else ganho := 2; end if;
    if coalesce(p.tentativas, 0) > 0 and not p.ultima_ok then ganho := ganho + 5; end if;  -- segunda chamada
    if j.combo >= 3 then ganho := ganho + 5; end if;
  else
    j.combo := 0;
  end if;

  insert into public.ranking_progresso as rp (jogador_id, questao_id, tentativas, acertos, ultima_ok)
  values (j.id, p_questao, 1, case when certo then 1 else 0 end, certo)
  on conflict (jogador_id, questao_id) do update
    set tentativas = rp.tentativas + 1, acertos = rp.acertos + excluded.acertos, ultima_ok = excluded.ultima_ok;

  update public.ranking_jogador r set
    xp = r.xp + ganho,
    combo = j.combo,
    dominadas = (select count(*) from public.ranking_progresso x where x.jogador_id = j.id and x.ultima_ok),
    ultima_resposta = now(),
    atualizado_em = case when ganho > 0 then now() else r.atualizado_em end
  where r.id = j.id
  returning r.xp, r.dominadas into j.xp, j.dominadas;

  return query select certo, ganho, j.xp, j.dominadas;
end $$;

-- Ranking público (só quem já pontuou). Não expõe token nem progresso.
create or replace function public.ranking_top(p_limite integer default 50)
returns table (posicao bigint, id uuid, apelido text, xp integer, dominadas integer)
language sql stable security definer set search_path = '' as $$
  select rank() over (order by r.xp desc, r.dominadas desc), r.id, r.apelido, r.xp, r.dominadas
  from public.ranking_jogador r
  where r.xp > 0
  order by r.xp desc, r.dominadas desc, r.atualizado_em asc
  limit least(greatest(coalesce(p_limite, 50), 1), 100)
$$;

-- Minha posição (mesmo fora do top).
create or replace function public.ranking_eu(p_token uuid)
returns table (posicao bigint, id uuid, apelido text, xp integer, dominadas integer, total bigint)
language sql stable security definer set search_path = '' as $$
  select
    (select count(*) + 1 from public.ranking_jogador o where o.xp > r.xp or (o.xp = r.xp and o.dominadas > r.dominadas)),
    r.id, r.apelido, r.xp, r.dominadas,
    (select count(*) from public.ranking_jogador o where o.xp > 0)
  from public.ranking_jogador r
  where r.token_hash = public._ranking_hash(p_token)
$$;

create or replace function public.ranking_apelido(p_token uuid, p_apelido text)
returns text
language plpgsql security definer set search_path = '' as $$
declare a text := public._ranking_apelido(p_apelido);
begin
  update public.ranking_jogador set apelido = a where token_hash = public._ranking_hash(p_token);
  if not found then raise exception 'jogador_nao_encontrado'; end if;
  return a;
end $$;

-- Sair do ranking: apaga o jogador e o progresso dele de verdade.
create or replace function public.ranking_sair(p_token uuid)
returns boolean
language sql security definer set search_path = '' as $$
  with d as (delete from public.ranking_jogador where token_hash = public._ranking_hash(p_token) returning 1)
  select exists (select 1 from d)
$$;

-- Só as funções da API ficam acessíveis pela chave pública.
revoke all on function public._ranking_hash(uuid), public._ranking_apelido(text) from public, anon, authenticated;
revoke all on function public.ranking_entrar(text), public.ranking_responder(uuid, text, jsonb), public.ranking_top(integer),
  public.ranking_eu(uuid), public.ranking_apelido(uuid, text), public.ranking_sair(uuid) from public;
grant execute on function public.ranking_entrar(text), public.ranking_responder(uuid, text, jsonb), public.ranking_top(integer),
  public.ranking_eu(uuid), public.ranking_apelido(uuid, text), public.ranking_sair(uuid) to anon, authenticated;
