"""Gera QUIZ/supabase/gabarito.sql a partir de QUIZ/banco_questoes.json.

O ranking corrige as respostas no servidor, então o Supabase precisa do gabarito.
Rode sempre que editar o banco (junto com atualizar_banco.py):  python gerar_gabarito_sql.py
Depois cole o gabarito.sql no SQL Editor do Supabase e clique em Run.
"""
import json, pathlib

aqui = pathlib.Path(__file__).parent
banco = json.loads((aqui.parent / "banco_questoes.json").read_text(encoding="utf-8"))
sql = lambda s: "'" + s.replace("'", "''") + "'"

linhas = []
for q in banco["questoes"]:
    tem_alt = bool(q.get("alternativas"))
    corretas = sorted(set(q["corretas"])) if tem_alt else q["corretas"]
    dificil = bool(q.get("multipla_resposta")) or q["tipo"] in ("lacunas", "associacao")
    linhas.append(f"  ({sql(q['id'])}, {sql(json.dumps(corretas, ensure_ascii=False))}::jsonb, {str(tem_alt).lower()}, {str(dificil).lower()})")

saida = aqui.parent / "supabase" / "gabarito.sql"
saida.write_text(
    "-- Gerado por app/gerar_gabarito_sql.py: não edite à mão.\n"
    "insert into public.ranking_gabarito (questao_id, corretas, tem_alternativas, dificil) values\n"
    + ",\n".join(linhas)
    + "\non conflict (questao_id) do update set corretas = excluded.corretas,"
      " tem_alternativas = excluded.tem_alternativas, dificil = excluded.dificil;\n"
    f"-- {len(linhas)} questões\n",
    encoding="utf-8",
)
# instalar.sql = esquema + gabarito num arquivo só (primeira instalação: cole tudo de uma vez)
pasta = aqui.parent / "supabase"
(pasta / "instalar.sql").write_text(
    (pasta / "esquema.sql").read_text(encoding="utf-8") + "\n" + saida.read_text(encoding="utf-8"), encoding="utf-8")
print(f"gabarito.sql e instalar.sql gerados com {len(linhas)} questões")
