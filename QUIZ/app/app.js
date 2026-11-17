/* Quiz GTI · @prof.tenebroso · edição Formatura 🎓
 *
 * REGRAS DE NEGÓCIO
 *  Estudo
 *   - Corrige na hora e explica o porquê (correta + motivo da alternativa marcada estar errada).
 *   - Histórico salvo no navegador (localStorage): tentativas, acertos e se a ÚLTIMA resposta foi certa.
 *   - "Revisar erros" = questões cuja última resposta foi errada. Acertou na revisão? Sai da lista.
 *   - Múltipla resposta só conta como acerto se marcar TODAS as certas e NENHUMA errada.
 *  Gamificação (créditos = XP)
 *   - 1º acerto de uma questão: +10 créditos (+5 se for lacunas, associação ou múltipla resposta).
 *   - Acertar de novo uma questão já dominada: +2 (evita "farmar" sempre a mesma).
 *   - Recuperar um erro (errou antes, acertou agora): +5 de bônus "Segunda chamada".
 *   - Combo: a partir de 3 acertos seguidos, +5 por questão. Errar zera o combo. Erro não tira créditos.
 *   - Níveis de Calouro a Laureado; ao chegar em "Formando(a)" acontece a Colação de Grau (diploma).
 *  Pode cair (Ímã de siglas)
 *   - Arrastar (ou tocar) a sigla até o conceito: par certo gruda, par errado é repelido e a pessoa tenta de novo.
 *   - +3 créditos no 1º acerto de primeira de um termo; +1 nos demais. Rodada perfeita = conquista "Ímã humano".
 *  Ranking (opcional, Supabase)
 *   - Quem entra escolhe um apelido público. Cada resposta vai para o servidor, que CONFERE o gabarito e calcula
 *     os créditos do ranking com as mesmas regras (o navegador nunca envia a pontuação pronta).
 *   - Só contam as respostas dadas depois de entrar. Sem internet, as respostas ficam numa fila e sobem depois.
 *   - "Sair do ranking" apaga o jogador e o progresso dele no servidor.
 */
(() => {
  "use strict";
  const B = window.BANCO;
  const Q = B.questoes;
  const DISC = Object.fromEntries(B.disciplinas.map(d => [d.id, d]));
  /* Ícones SVG do sprite do index.html. Emojis ficam só na parte "festa" (níveis, conquistas, celebrações). */
  const ic = (nome, cls = "") => `<svg class="i ${cls}" aria-hidden="true" focusable="false"><use href="#i-${nome}"/></svg>`;
  /* Professores de cada disciplina.
   * foco = centro do rosto na foto (x, y em %); zoom = aproximação. O rosto é levado ao centro do avatar redondo.
   * Para não sobrar borda vazia: zoom >= 50 / menor distância do foco até a borda. */
  const PROF = {
    gsc: { nome: "Humberto Caetano", foto: "assets/Humberto_Caetano.webp", foco: [45, 22], zoom: 2.6 },
    gov: { nome: "Ricardo Baudel", foto: "assets/Ricardo_Baudel.webp", foco: [51, 38], zoom: 1.4 },
    eag: { nome: "Hayanna Oliveira", foto: "assets/Hayanna_Oliveira.webp", foco: [53, 41], zoom: 1.35 },
  };
  /* Carca: o carcará tech, mascote da #TurmaGTI. Uma pose para cada momento do app. */
  const CARCA = {
    hero: { src: "assets/carca-hero.webp?v=5", avif: "assets/carca-hero.avif?v=5", w: 606, h: 1254, alt: "Carca, o mascote carcará da turma de GTI, de moletom laranja do CESAR, fazendo joinha" },
    estudando: { src: "assets/carca-estudando.webp?v=4", w: 274, h: 372, alt: "Carca estudando no notebook, com a mão no queixo" },
    comemorando: { src: "assets/carca-comemorando.webp?v=4", w: 334, h: 420, alt: "Carca comemorando com os punhos para o alto" },
    pensando: { src: "assets/carca-pensando.webp?v=4", w: 282, h: 432, alt: "Carca sorrindo de olhos fechados, incentivando a seguir em frente" },
    vr: { src: "assets/carca-vr.webp?v=4", w: 357, h: 362, alt: "Carca apontando para um tablet holográfico com o globo" },
  };
  /* O hero é a imagem principal da tela inicial (o LCP): carrega já, com prioridade e em AVIF (WebP de reserva).
   * As outras poses carregam sob demanda. */
  const carca = (pose, cls = "") => {
    const c = CARCA[pose];
    const carga = pose === "hero" ? `loading="eager" fetchpriority="high"` : `loading="lazy" decoding="async"`;
    const img = `<img class="carca ${cls}" src="${c.src}" width="${c.w}" height="${c.h}" alt="${c.alt}" ${carga}>`;
    return c.avif ? `<picture><source srcset="${c.avif}" type="image/avif">${img}</picture>` : img;
  };
  const fala = (txt, cls = "") => `<p class="fala ${cls}">${txt}</p>`;
  const avatar = (disc, tam = "md") => {
    const p = PROF[disc], [fx, fy] = p.foco;
    return `<span class="avatar avatar-${tam}"><span class="avatar-in"><img src="${p.foto}" alt="Prof. ${esc(p.nome)}" width="400" height="400" loading="lazy" decoding="async"
      style="transform-origin:${fx}% ${fy}%;transform:translate(${50 - fx}%, ${50 - fy}%) scale(${p.zoom})"></span></span>`;
  };
  const STORE = "quizgti:v1";
  const app = document.getElementById("app");
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Níveis e conquistas ---------- */
  const NIVEIS = [
    { xp: 0, nome: "Calouro(a)", ic: "🎒" },
    { xp: 100, nome: "Veterano(a)", ic: "📚" },
    { xp: 250, nome: "Estagiário(a)", ic: "💼" },
    { xp: 450, nome: "Monitor(a)", ic: "🧑‍🏫" },
    { xp: 700, nome: "Concluinte", ic: "📝" },
    { xp: 1000, nome: "Formando(a)", ic: "🎓" },
    { xp: 1400, nome: "Orador(a) da Turma", ic: "🎤" },
    { xp: 1900, nome: "Laureado(a)", ic: "🏅" },
  ];
  const XP_COLACAO = 1000;
  const CONQ = [
    { id: "matricula", ic: "📝", nome: "Matrícula feita", desc: "Respondeu a primeira questão." },
    { id: "combo5", ic: "🔥", nome: "Em chamas", desc: "5 acertos seguidos." },
    { id: "combo10", ic: "⚡", nome: "Imparável", desc: "10 acertos seguidos." },
    { id: "gabarito", ic: "💯", nome: "Gabaritou!", desc: "100% numa rodada de 5+ questões." },
    { id: "segunda10", ic: "♻️", nome: "Segunda chamada", desc: "Recuperou 10 questões que tinha errado." },
    { id: "cem", ic: "📖", nome: "Rato de biblioteca", desc: "Respondeu 100 questões diferentes." },
    { id: "coruja", ic: "🦉", nome: "Coruja de véspera", desc: "Estudou depois das 23h." },
    { id: "dom_gsc", ic: "🛡️", nome: "Hacker do bem", desc: "80% de domínio em Segurança Cibernética." },
    { id: "dom_gov", ic: "🏛️", nome: "Conselho de Governança", desc: "80% de domínio em Governança em TI." },
    { id: "dom_eag", ic: "🚀", nome: "Pronto pro ENADE", desc: "80% de domínio em Estudos Avançados." },
    { id: "colacao", ic: "🎓", nome: "Colação de grau", desc: `Chegou a ${XP_COLACAO} créditos: Formando(a)!` },
    { id: "laureado", ic: "🏅", nome: "Laureado(a)", desc: "Chegou ao nível máximo." },
    { id: "ima", ic: "🧲", nome: "Ímã humano", desc: "Ligou todas as siglas de uma rodada de primeira." },
  ];
  const nivelDe = xp => { let n = 0; NIVEIS.forEach((l, i) => { if (xp >= l.xp) n = i; }); return n; };

  /* ---------- Persistência ---------- */
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
  let db = load();
  db.stats = db.stats || {}; db.xp = db.xp || 0; db.conq = db.conq || {}; db.recup = db.recup || 0; db.melhorCombo = db.melhorCombo || 0;
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(db)); } catch { /* modo privado */ } };

  /* ---------- Utilidades ---------- */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (a, t) => t ? Math.round(100 * a / t) : 0;
  const unidadeLabel = u => u === "simulado" ? "Simulado ENADE" : `Unidade ${u}`;
  const unidadesDe = d => [...new Set(Q.filter(q => q.disciplina === d).map(q => q.unidade))];
  const questionariosDe = (d, us) => [...new Set(Q.filter(q => q.disciplina === d && us.includes(q.unidade)).map(q => q.origem.questionario))];
  const tipoLabel = { multipla_escolha: "Múltipla escolha", verdadeiro_falso: "Verdadeiro ou falso", lacunas: "Complete as lacunas", associacao: "Associação" };
  const dificil = q => q.multipla_resposta || q.tipo === "lacunas" || q.tipo === "associacao";

  function resumo(lista) {
    let resp = 0, acertos = 0, tent = 0, erradas = 0;
    lista.forEach(q => { const s = db.stats[q.id]; if (s) { resp++; tent += s.t; acertos += s.a; if (!s.ult) erradas++; } });
    return { total: lista.length, resp, erradas, taxa: pct(acertos, tent), dominio: pct(lista.filter(q => db.stats[q.id]?.ult).length, lista.length) };
  }

  /* ---------- Motor de gamificação ---------- */
  function registrar(q, ok) {
    const s = db.stats[q.id] || { t: 0, a: 0 };
    const jaAcertou = s.a > 0, estavaErrada = s.t > 0 && !s.ult;
    s.t++; if (ok) s.a++; s.ult = ok; s.em = Date.now();
    db.stats[q.id] = s;

    const ev = { xp: 0, partes: [], conquistas: [], nivelAntes: nivelDe(db.xp) };
    if (ok) {
      quiz.combo++;
      db.melhorCombo = Math.max(db.melhorCombo, quiz.combo);
      if (!jaAcertou) { ev.xp += 10; ev.partes.push("acerto +10"); if (dificil(q)) { ev.xp += 5; ev.partes.push("difícil +5"); } }
      else { ev.xp += 2; ev.partes.push("revisão +2"); }
      if (estavaErrada) { ev.xp += 5; ev.partes.push("segunda chamada +5"); db.recup++; }
      if (quiz.combo >= 3) { ev.xp += 5; ev.partes.push(`combo x${quiz.combo} +5`); }
    } else quiz.combo = 0;
    db.xp += ev.xp;
    quiz.xpRodada += ev.xp;
    ev.nivelDepois = nivelDe(db.xp);

    const ganha = id => { if (!db.conq[id]) { db.conq[id] = Date.now(); ev.conquistas.push(CONQ.find(c => c.id === id)); } };
    ganha("matricula");
    if (quiz.combo >= 5) ganha("combo5");
    if (quiz.combo >= 10) ganha("combo10");
    if (db.recup >= 10) ganha("segunda10");
    if (Object.keys(db.stats).length >= 100) ganha("cem");
    if (new Date().getHours() >= 23) ganha("coruja");
    B.disciplinas.forEach(d => { if (resumo(Q.filter(x => x.disciplina === d.id)).dominio >= 80) ganha("dom_" + d.id); });
    if (db.xp >= XP_COLACAO) ganha("colacao");
    if (ev.nivelDepois === NIVEIS.length - 1) ganha("laureado");
    save();
    return ev;
  }

  /* ---------- Motions ---------- */
  const CORES = ["#A855F7", "#6366F1", "#22D3EE", "#F37421", "#FBBF24", "#2DD4BF", "#FFFFFF"];
  function confete(n = 60, origem) {
    if (reduz) return;
    const box = document.createElement("div"); box.className = "fx-layer"; document.body.appendChild(box);
    const ox = origem ? origem.x : innerWidth / 2, oy = origem ? origem.y : innerHeight / 3;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i"); p.className = "confete";
      const ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 260;
      p.style.cssText = `left:${ox}px;top:${oy}px;background:${CORES[i % CORES.length]};--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist - 120}px;--r:${Math.random() * 720 - 360}deg;--d:${0.9 + Math.random() * 0.8}s;${Math.random() > .5 ? "border-radius:50%;" : ""}`;
      box.appendChild(p);
    }
    setTimeout(() => box.remove(), 2000);
  }
  function chuvaDeCapelos(n = 18) {
    if (reduz) return;
    const box = document.createElement("div"); box.className = "fx-layer"; document.body.appendChild(box);
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span"); c.className = "capelo"; c.textContent = "🎓";
      c.style.cssText = `left:${Math.random() * 100}vw;--d:${2.2 + Math.random() * 1.8}s;--delay:${Math.random() * 0.8}s;--r:${Math.random() * 540 - 270}deg;font-size:${22 + Math.random() * 22}px`;
      box.appendChild(c);
    }
    setTimeout(() => box.remove(), 5000);
  }
  function xpFlutuante(el, xp) {
    if (!xp) return;
    const r = el.getBoundingClientRect();
    const f = document.createElement("span"); f.className = "xp-float"; f.textContent = `+${xp} créditos`;
    f.style.left = r.left + r.width / 2 + "px"; f.style.top = r.top + scrollY + "px";
    document.body.appendChild(f); setTimeout(() => f.remove(), 1400);
  }
  function toast(html, tipo = "") {
    let pilha = document.querySelector(".toasts");
    if (!pilha) { pilha = document.createElement("div"); pilha.className = "toasts"; pilha.setAttribute("aria-live", "polite"); document.body.appendChild(pilha); }
    const t = document.createElement("div"); t.className = "toast " + tipo; t.innerHTML = html; pilha.appendChild(t);
    setTimeout(() => { t.classList.add("sai"); setTimeout(() => t.remove(), 400); }, 3800);
  }
  function modal(html, aoFechar) {
    const m = document.createElement("div"); m.className = "modal-bg";
    m.innerHTML = `<div class="modal card" role="dialog" aria-modal="true">${html}<button class="btn btn-primary" type="button" data-fechar style="margin-top:18px">Bora continuar! 🎉</button></div>`;
    const titulo = m.querySelector("h2");
    if (titulo) { titulo.id = "modal-titulo"; m.firstElementChild.setAttribute("aria-labelledby", "modal-titulo"); }
    const voltarFoco = document.activeElement;
    document.body.appendChild(m);
    let fechado = false;
    const fechar = () => {
      if (fechado) return; fechado = true;
      document.removeEventListener("keydown", teclado);
      m.classList.add("sai"); setTimeout(() => m.remove(), 250);
      if (voltarFoco && document.contains(voltarFoco)) voltarFoco.focus();
      aoFechar && aoFechar();
    };
    /* Escape fecha; Tab fica preso dentro do modal enquanto ele estiver aberto */
    const teclado = e => {
      if (e.key === "Escape") { e.preventDefault(); fechar(); }
      else if (e.key === "Tab") {
        const foco = [...m.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])")];
        const [primeiro, ultimo] = [foco[0], foco[foco.length - 1]];
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
      }
    };
    document.addEventListener("keydown", teclado);
    m.querySelector("[data-fechar]").onclick = fechar;
    m.onclick = e => { if (e.target === m) fechar(); };
    m.querySelector("[data-fechar]").focus();
  }
  function celebrarEventos(ev, alvo) {
    if (ev.xp) xpFlutuante(alvo, ev.xp);
    ev.conquistas.filter(c => c.id !== "colacao").forEach((c, i) =>
      setTimeout(() => toast(`<span class="toast-ic">${c.ic}</span><div><b>Conquista desbloqueada!</b><br>${esc(c.nome)}</div>`, "gold"), 400 + i * 500));
    if (ev.nivelDepois > ev.nivelAntes) {
      const n = NIVEIS[ev.nivelDepois];
      const colacao = n.xp === XP_COLACAO;
      setTimeout(() => {
        colacao ? chuvaDeCapelos(28) : confete(90);
        modal(colacao
          ? `<div class="modal-carca">${carca("comemorando", "carca-modal")}<span class="capelo-big">🎓</span></div><p class="eyebrow">Colação de grau</p><h2>Parabéns, <span class="grad">${esc(nomeJogador())}</span>!</h2>
             <p>Você chegou a <b>${XP_COLACAO} créditos</b> e virou <b>Formando(a)</b>. Seu diploma (não oficial 😄) já está em Desempenho.</p>`
          : `<div class="modal-carca">${carca("comemorando", "carca-modal")}<span class="nivel-big">${n.ic}</span></div><p class="eyebrow">Subiu de nível</p><h2>Agora você é <span class="grad">${n.nome}</span></h2>
             <p class="muted">${proximoNivelTexto()}</p>`);
      }, 700);
    }
  }
  const nomeJogador = () => db.nome || "Formando(a)";
  function proximoNivelTexto() {
    const i = nivelDe(db.xp);
    return i < NIVEIS.length - 1 ? `Faltam ${NIVEIS[i + 1].xp - db.xp} créditos para ${NIVEIS[i + 1].ic} ${NIVEIS[i + 1].nome}.` : "Nível máximo! Você é lenda da turma. 🏅";
  }

  /* ---------- Tema ---------- */
  const btnTema = document.getElementById("btn-tema");
  const temaAtual = () => document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  const aplicarTema = t => {
    if (t) document.documentElement.dataset.theme = t;
    const escuro = temaAtual() === "dark";
    btnTema.innerHTML = ic(escuro ? "sun" : "moon");
    btnTema.setAttribute("aria-label", escuro ? "Mudar para tema claro" : "Mudar para tema escuro");
    document.querySelector('meta[name="theme-color"]').content = escuro ? "#0A0A24" : "#F5F3FF";
  };
  aplicarTema(db.tema);
  btnTema.addEventListener("click", () => { db.tema = temaAtual() === "dark" ? "light" : "dark"; save(); aplicarTema(db.tema); });

  /* ---------- HUD (nível no menu) ---------- */
  const hud = document.getElementById("hud");
  function atualizarHud() {
    const n = NIVEIS[nivelDe(db.xp)];
    hud.innerHTML = `<span class="hud-ic" aria-hidden="true">${n.ic}</span><b>${db.xp}</b><span class="muted small hud-lbl">créditos</span>`;
    hud.setAttribute("aria-label", `${n.nome}: ${db.xp} créditos. Ver desempenho`);
    hud.title = `${n.nome} · ${proximoNivelTexto()}`;
  }

  /* ---------- Roteamento ---------- */
  /* Rodada em andamento e configurações também ficam salvas: fechar a janela não perde nada. */
  let setup = Object.assign({ disc: "gsc", unidades: null, questionario: "", modo: "todas", qtd: 10, embaralhar: false }, db.setup || {});
  const salvarSetup = () => { db.setup = { ...setup }; save(); };
  const POR_ID = Object.fromEntries(Q.map(q => [q.id, q]));
  function salvarRodada() {
    if (!quiz) return;
    db.rodada = { titulo: quiz.titulo, i: quiz.i, respostas: quiz.respostas, combo: quiz.combo, xpRodada: quiz.xpRodada,
                  itens: quiz.itens.map(it => ({ id: it.q.id, ordem: it.ordem })), em: Date.now() };
    save();
  }
  function restaurarRodada(r) {
    if (!r || !Array.isArray(r.itens)) return null;
    const itens = r.itens.filter(it => POR_ID[it.id]).map(it => ({ q: POR_ID[it.id], ordem: it.ordem }));
    if (!itens.length) return null;
    return { titulo: r.titulo, i: Math.min(r.i || 0, itens.length - 1), respostas: r.respostas || [], combo: r.combo || 0, xpRodada: r.xpRodada || 0, itens };
  }
  function encerrarRodada() { quiz = null; delete db.rodada; save(); }
  let quiz = restaurarRodada(db.rodada);
  // Pede ao navegador para não apagar os dados por falta de espaço (quando suportado).
  try { navigator.storage?.persist?.(); } catch { /* ignora */ }

  let jaAbriu = false;
  function rota() {
    const h = (location.hash || "#inicio").slice(1);
    document.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("ativo", a.dataset.nav === h));
    atualizarHud();
    /* Animação de entrada só ao trocar de tela: na abertura o conteúdo aparece direto (melhora o LCP) */
    if (jaAbriu) { app.classList.remove("entra"); void app.offsetWidth; app.classList.add("entra"); }
    jaAbriu = true;
    if (h === "quiz" && quiz) return telaQuestao();
    if (h === "resultado" && quiz) return telaResultado();
    if (h === "estudar") return telaSetup();
    if (h === "desempenho") return telaDesempenho();
    if (h === "ranking") return telaRanking();
    if (h === "podecair") return telaPodeCair();
    return telaInicio();
  }
  const ir = h => { if (location.hash === "#" + h) rota(); else location.hash = h; app.focus({ preventScroll: true }); scrollTo({ top: 0 }); };
  addEventListener("hashchange", rota);

  /* ---------- Tela: Início ---------- */
  function telaInicio() {
    const g = resumo(Q);
    const ni = nivelDe(db.xp), n = NIVEIS[ni];
    const rumo = Math.min(100, pct(db.xp, XP_COLACAO));
    app.innerHTML = `
      <section class="hero">
        <div class="hero-txt stagger">
          <div class="badges">
            <span class="badge">${ic("cap")} Edição Formatura</span>
            <a class="badge badge-link" href="https://instagram.com/prof.tenebroso" target="_blank" rel="noopener">${ic("insta")} @prof.tenebroso</a>
          </div>
          <h1>Rumo à <span class="grad">formatura</span></h1>
          <p class="lead">${Q.length} questões comentadas de ${B.disciplinas.length} disciplinas do 5º período de GTI. Acerte, junte créditos, desbloqueie conquistas e chegue à <b>colação de grau</b> antes da prova.</p>
          <div class="btn-row">
            <button class="btn btn-primary btn-lg pulse" type="button" data-acao="estudar">${ic("play")} Começar quiz</button>
            <button class="btn btn-ghost btn-lg" type="button" data-acao="erradas" ${g.erradas ? "" : "disabled"}>${ic("redo")} Refazer erradas${g.erradas ? ` <span class="count">${g.erradas}</span>` : ""}</button>
          </div>
          <div class="nome-box">
            <label for="nome">${ic("pen")} Seu nome no diploma</label>
            <input id="nome" maxlength="40" autocomplete="name" placeholder="Ex.: Ana Souza" value="${esc(db.nome || "")}">
          </div>
        </div>
        <div class="poster">
          ${fala(db.nome ? `Bora pra formatura, <b>${esc(db.nome.split(" ")[0])}</b>? 🎓` : `E aí! Eu sou o <b>Carca</b>. Bora pra formatura? 🎓`, "fala-hero")}
          <div class="poster-frame">
            ${carca("hero", "poster-img")}
          </div>
          <div class="nivel-card" role="img" aria-label="Seu nível: ${n.nome}, ${db.xp} de ${XP_COLACAO} créditos para a colação de grau">
            <span class="nivel-ic" aria-hidden="true">${n.ic}</span>
            <div class="nivel-txt">
              <span class="eyebrow" style="margin:0">Seu nível</span>
              <strong>${n.nome}</strong>
              <div class="bar-row"><div class="bar"><i style="--w:${rumo}%"></i></div><span class="small"><b>${db.xp}</b>/${XP_COLACAO}</span></div>
              <span class="muted small">créditos para colar grau</span>
            </div>
          </div>
          ${B.disciplinas.map((d, i) => `<span class="float f${i + 1}" aria-hidden="true">${avatar(d.id, "sm")}</span>`).join("")}
        </div>
      </section>

      ${quiz ? (() => {
        const feitas = quiz.respostas.filter(Boolean).length, total = quiz.itens.length, acabou = feitas === total;
        return `<section class="section">
          <div class="card continuar">
            <span class="continuar-ic">${ic(acabou ? "flag" : "pause")}</span>
            <div style="flex:1;min-width:200px">
              <p class="eyebrow" style="margin:0">${acabou ? "Rodada concluída" : "Rodada em andamento"}</p>
              <b>${esc(quiz.titulo)}</b>
              <div class="bar-row" style="margin-top:6px"><div class="bar"><i style="--w:${pct(feitas, total)}%"></i></div><span class="small">${feitas}/${total}</span></div>
            </div>
            <div class="btn-row">
              <button class="btn btn-primary" type="button" data-acao="continuar">${acabou ? "Ver resultado" : `${ic("play")} Continuar de onde parei`}</button>
              <button class="btn" type="button" data-acao="descartar" title="Descarta só a rodada; créditos e histórico ficam">Descartar</button>
            </div>
          </div></section>`;
      })() : ""}

      <section class="section">
        <div class="grid grid-stats stagger">
          ${[["layers", Q.length, "Questões no banco"], ["check", g.resp, "Já respondidas"], ["target", g.taxa + "%", "Taxa de acerto"], ["flame", db.melhorCombo, "Melhor combo"]]
            .map(([i, v, l]) => `<div class="card stat"><span class="stat-ic">${ic(i)}</span><strong>${v}</strong><span>${l}</span></div>`).join("")}
        </div>
      </section>

      <section class="section">
        <p class="eyebrow">Disciplinas</p>
        <h2>Escolha a matéria e <span class="grad">bora estudar</span></h2>
        <div class="grid grid-3 stagger">${B.disciplinas.map(cardDisciplina).join("")}</div>
      </section>`;
    app.querySelector("#nome").onchange = e => { db.nome = e.target.value.trim(); save(); toast(`<span class="toast-ic">✍️</span><div>Nome salvo no diploma: <b>${esc(nomeJogador())}</b></div>`); };
    app.querySelector('[data-acao="estudar"]').onclick = () => ir("estudar");
    const cont = app.querySelector('[data-acao="continuar"]');
    if (cont) {
      cont.onclick = () => { const acabou = quiz.respostas.filter(Boolean).length === quiz.itens.length; ir(acabou ? "resultado" : "quiz"); };
      app.querySelector('[data-acao="descartar"]').onclick = () => { if (confirm("Descartar a rodada em andamento? Créditos e respostas já confirmadas continuam salvos.")) { encerrarRodada(); telaInicio(); } };
    }
    app.querySelector('[data-acao="erradas"]').onclick = () => iniciar(Q.filter(q => db.stats[q.id] && !db.stats[q.id].ult), "Segunda chamada: todas as disciplinas");
    app.querySelectorAll("[data-disc]").forEach(b => b.onclick = e => { e.preventDefault(); setup.disc = b.dataset.disc; setup.unidades = null; setup.questionario = ""; ir("estudar"); });
  }

  function cardDisciplina(d) {
    const lista = Q.filter(q => q.disciplina === d.id), r = resumo(lista);
    return `<a class="card disc-card" href="#estudar" data-disc="${d.id}">
      <div class="disc-head">
        ${avatar(d.id, "lg")}
        <div class="disc-info">
          <h3>${esc(d.nome)}</h3>
          <span class="prof">Prof. ${esc(PROF[d.id].nome)}</span>
          <span class="muted small">${d.codigo} · ${lista.length} questões</span>
        </div>
      </div>
      <div class="bar-row" aria-label="Domínio ${r.dominio}%"><div class="bar"><i style="--w:${r.dominio}%"></i></div><b>${r.dominio}%</b></div>
      <div class="disc-foot"><span class="muted small">${r.resp} respondidas · ${r.erradas} para revisar</span><span class="disc-go">Estudar ${ic("right")}</span></div>
    </a>`;
  }

  /* ---------- Tela: Configurar rodada ---------- */
  function telaSetup() {
    const us = unidadesDe(setup.disc);
    if (!setup.unidades || !setup.unidades.every(u => us.includes(u))) setup.unidades = [...us];
    const qs = questionariosDe(setup.disc, setup.unidades);
    if (!qs.includes(setup.questionario)) setup.questionario = "";
    salvarSetup();
    const pool = filtrar();

    app.innerHTML = `
      <p class="eyebrow">Montar rodada</p>
      <h2>Configure seu <span class="grad">quiz</span></h2>
      <div class="grid stagger" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));align-items:start">
        <div class="card">
          <div class="form-block"><span class="lbl">Disciplina</span>
            <div class="chips">${B.disciplinas.map(d => `<button class="chip chip-prof" type="button" data-set-disc="${d.id}" aria-pressed="${d.id === setup.disc}">${avatar(d.id, "xs")} ${esc(d.nome)}</button>`).join("")}</div></div>
          <div class="form-block"><span class="lbl">Unidades</span>
            <div class="chips">${us.map(u => `<button class="chip" data-set-uni="${u}" aria-pressed="${setup.unidades.includes(u)}">${unidadeLabel(u)}</button>`).join("")}</div></div>
          <div class="form-block"><label for="sel-q">Questionário de origem</label>
            <select id="sel-q"><option value="">Todos</option>${qs.map(n => `<option ${n === setup.questionario ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
          <div class="form-block"><span class="lbl">Modo</span>
            <div class="chips">${[["todas", `${ic("layers")} Todas`], ["erradas", `${ic("redo")} Só as que errei`], ["novas", `${ic("sparkles")} Ainda não respondidas`]]
              .map(([v, l]) => `<button class="chip" data-set-modo="${v}" aria-pressed="${setup.modo === v}">${l}</button>`).join("")}</div></div>
          <div class="form-block"><span class="lbl">Quantidade</span>
            <div class="chips">${[5, 10, 20, 0].map(n => `<button class="chip" data-set-qtd="${n}" aria-pressed="${setup.qtd === n}">${n || "Todas"}</button>`).join("")}</div></div>
          <label class="switch"><input type="checkbox" id="emb" ${setup.embaralhar ? "checked" : ""}> Embaralhar alternativas
            <span class="muted small">(as letras citadas nas explicações podem mudar)</span></label>
        </div>
        <div class="card resumo">
          <div class="carca-dica">${carca("estudando", "carca-sm")}${fala(pool.length ? "Escolhe aí que eu estudo junto com você!" : "Hmm, nada por aqui com esses filtros…")}</div>
          <p class="eyebrow">Resumo</p>
          <div class="resumo-head">${avatar(setup.disc, "md")}<div><h3>${esc(DISC[setup.disc].nome)}</h3><span class="prof">Prof. ${esc(PROF[setup.disc].nome)}</span></div></div>
          <p class="muted">${setup.unidades.map(unidadeLabel).join(", ") || "Nenhuma unidade"}${setup.questionario ? " · " + esc(setup.questionario) : ""}</p>
          <div class="grid grid-stats" style="margin:14px 0">
            <div class="stat"><strong>${pool.length}</strong><span>disponíveis</span></div>
            <div class="stat"><strong>${setup.qtd ? Math.min(setup.qtd, pool.length) : pool.length}</strong><span>nesta rodada</span></div>
          </div>
          <button class="btn btn-primary" id="go" ${pool.length ? "" : "disabled"} style="width:100%;justify-content:center">${ic("play")} Iniciar</button>
          ${pool.length ? `<p class="muted small" style="margin-top:10px">Dica: 3 acertos seguidos ativam o combo (+5 créditos por questão).</p>`
            : `<p class="muted small" style="margin-top:10px">Nenhuma questão com esses filtros${setup.modo === "erradas" ? ": nenhum erro pendente aqui 🎉" : "."}</p>`}
        </div>
      </div>`;

    app.querySelectorAll("[data-set-disc]").forEach(b => b.onclick = () => { setup.disc = b.dataset.setDisc; setup.unidades = null; telaSetup(); });
    app.querySelectorAll("[data-set-uni]").forEach(b => b.onclick = () => {
      const u = isNaN(b.dataset.setUni) ? b.dataset.setUni : +b.dataset.setUni;
      setup.unidades = setup.unidades.includes(u) ? setup.unidades.filter(x => x !== u) : [...setup.unidades, u];
      telaSetup();
    });
    app.querySelectorAll("[data-set-modo]").forEach(b => b.onclick = () => { setup.modo = b.dataset.setModo; telaSetup(); });
    app.querySelectorAll("[data-set-qtd]").forEach(b => b.onclick = () => { setup.qtd = +b.dataset.setQtd; telaSetup(); });
    app.querySelector("#sel-q").onchange = e => { setup.questionario = e.target.value; telaSetup(); };
    app.querySelector("#emb").onchange = e => { setup.embaralhar = e.target.checked; salvarSetup(); };
    app.querySelector("#go").onclick = () => {
      let lista = shuffle(filtrar());
      if (setup.qtd) lista = lista.slice(0, setup.qtd);
      iniciar(lista, DISC[setup.disc].nome);
    };
  }

  function filtrar() {
    return Q.filter(q => q.disciplina === setup.disc && setup.unidades.includes(q.unidade)
      && (!setup.questionario || q.origem.questionario === setup.questionario)
      && (setup.modo === "todas" || (setup.modo === "erradas" ? db.stats[q.id] && !db.stats[q.id].ult : !db.stats[q.id])));
  }

  /* ---------- Rodada ---------- */
  function iniciar(lista, titulo) {
    if (!lista.length) return;
    quiz = {
      titulo, i: 0, respostas: [], combo: 0, xpRodada: 0,
      itens: lista.map(q => ({ q, ordem: q.alternativas ? (setup.embaralhar ? shuffle(Object.keys(q.alternativas)) : Object.keys(q.alternativas)) : null })),
    };
    ir("quiz");
  }

  function telaQuestao(animar = true) {
    salvarRodada();
    const { q, ordem } = quiz.itens[quiz.i];
    const total = quiz.itens.length, resp = quiz.respostas[quiz.i];
    const fonte = q.fonte_gabarito === "oficial"
      ? `<span class="seal seal-ok" title="Gabarito confirmado pelo Moodle">${ic("check")} Oficial</span>`
      : `<span class="seal seal-warn" title="Respondida pelo especialista; o Moodle ainda não liberou o gabarito">Especialista</span>`;
    const feitas = quiz.respostas.filter(Boolean).length;

    app.innerHTML = `
      <div class="quiz-top">
        <button class="btn btn-icon" type="button" id="sair" aria-label="Encerrar rodada">${ic("x")}</button>
        <div class="bar" role="progressbar" aria-valuenow="${feitas}" aria-valuemax="${total}"><i style="--w:${pct(feitas, total)}%"></i></div>
        <b>${quiz.i + 1}/${total}</b>
      </div>
      <div class="quiz-hud">
        <span class="hud-pill ${quiz.combo >= 3 ? "on-fire" : ""}" title="Acertos seguidos">${ic("flame")} combo <b>${quiz.combo}</b></span>
        <span class="hud-pill" title="Créditos ganhos nesta rodada">${ic("cap")} <b>+${quiz.xpRodada}</b> nesta rodada</span>
      </div>
      <article class="card q-card ${animar ? "q-entra" : ""}" id="qcard">
        <div class="q-meta">
          <span class="tag tag-prof">${avatar(q.disciplina, "xs")} ${esc(DISC[q.disciplina].nome)}</span>
          <span class="tag">${unidadeLabel(q.unidade)}</span>
          <span class="tag">${esc(q.origem.questionario)}</span>
          ${fonte}
          ${dificil(q) ? `<span class="tag" title="Vale +5 créditos">${ic("star")} Difícil</span>` : ""}
        </div>
        <p class="eyebrow">${esc(q.tema || tipoLabel[q.tipo])}</p>
        <p class="q-enun">${esc(q.enunciado)}</p>
        ${q.multipla_resposta ? `<p class="q-hint">Mais de uma alternativa correta: marque todas.</p>` : ""}
        <div id="corpo"></div>
        <div id="fb"></div>
        <div class="q-acoes">
          <button class="btn" type="button" id="ant" ${quiz.i ? "" : "disabled"}>${ic("left")} Anterior</button>
          <button class="btn btn-primary" type="button" id="acao"></button>
        </div>
      </article>`;

    const corpo = app.querySelector("#corpo");
    const sel = new Set(resp?.marcadas || []);
    const valores = resp?.valores ? [...resp.valores] : [];

    if (q.tipo === "multipla_escolha" || q.tipo === "verdadeiro_falso") {
      corpo.innerHTML = `<div class="alts" role="${q.multipla_resposta ? "group" : "radiogroup"}">${ordem.map((k, idx) =>
        `<button class="alt" style="--i:${idx}" data-k="${k}" role="${q.multipla_resposta ? "checkbox" : "radio"}"><span class="letra">${"abcdefgh"[idx]}</span><span class="txt">${esc(q.alternativas[k])}</span></button>`).join("")}</div>`;
      const pintar = () => corpo.querySelectorAll(".alt").forEach(b => { b.classList.toggle("sel", sel.has(b.dataset.k)); b.setAttribute("aria-checked", sel.has(b.dataset.k)); });
      corpo.querySelectorAll(".alt").forEach(b => b.onclick = () => {
        if (resp) return;
        const k = b.dataset.k;
        if (q.multipla_resposta) sel.has(k) ? sel.delete(k) : sel.add(k); else { sel.clear(); sel.add(k); }
        pintar(); atualizarAcao();
      });
      pintar();
    } else if (q.tipo === "lacunas") {
      const opts = q.opcoes_lacunas;
      const html = esc(q.texto_lacunas).replace(/\{\{(\d+)\}\}/g, (_, n) =>
        `<select data-i="${n - 1}" aria-label="Lacuna ${n}"><option value="">— lacuna ${n} —</option>${opts.map(o => `<option>${esc(o)}</option>`).join("")}</select>`);
      corpo.innerHTML = `<p class="lacunas-texto">${html}</p>`;
      corpo.querySelectorAll("select").forEach(s => { s.value = valores[+s.dataset.i] || ""; s.onchange = () => { valores[+s.dataset.i] = s.value; atualizarAcao(); }; });
    } else if (q.tipo === "associacao") {
      corpo.innerHTML = `<div class="alts">${q.pares.map((p, i) => `<div class="par" style="--i:${i}" data-i="${i}"><span>${esc(p.item)}</span>
        <select data-i="${i}" aria-label="Resposta do item ${i + 1}"><option value="">Escolha…</option>${q.opcoes_associacao.map(o => `<option>${esc(o)}</option>`).join("")}</select></div>`).join("")}</div>`;
      corpo.querySelectorAll("select").forEach(s => { s.value = valores[+s.dataset.i] || ""; s.onchange = () => { valores[+s.dataset.i] = s.value; atualizarAcao(); }; });
    }

    const btn = app.querySelector("#acao");
    const respondida = () => q.alternativas ? sel.size > 0 : valores.filter(Boolean).length === q.corretas.length;
    function atualizarAcao() {
      if (resp) { btn.innerHTML = quiz.i + 1 < total ? `Próxima ${ic("right")}` : `${ic("cap")} Ver resultado`; btn.disabled = false; return; }
      btn.innerHTML = `${ic("check")} Confirmar`; btn.disabled = !respondida();
    }
    btn.onclick = () => {
      if (resp) { if (quiz.i + 1 < total) { quiz.i++; telaQuestao(); scrollTo({ top: 0, behavior: "smooth" }); } else ir("resultado"); return; }
      const ok = corrigir(q, sel, valores);
      quiz.respostas[quiz.i] = { ok, marcadas: [...sel], valores };
      const ev = registrar(q, ok);
      quiz.respostas[quiz.i].ev = ev;
      rankingRegistrar(q, sel, valores);
      telaQuestao(false);
      atualizarHud();
      const card = app.querySelector("#qcard"), b2 = app.querySelector("#acao");
      if (ok) {
        card.classList.add("acertou");
        const r = b2.getBoundingClientRect();
        confete(quiz.combo >= 5 ? 70 : 34, { x: r.left + r.width / 2, y: r.top });
      } else card.classList.add("errou");
      celebrarEventos(ev, b2);
      app.querySelector("#fb").scrollIntoView({ behavior: reduz ? "auto" : "smooth", block: "nearest" });
    };
    app.querySelector("#ant").onclick = () => { quiz.i--; telaQuestao(); };
    app.querySelector("#sair").onclick = () => { if (confirm("Encerrar esta rodada? Respostas e créditos já confirmados ficam salvos.\n(Dica: se só quiser pausar, feche o app ou vá para Início; a rodada continua de onde parou.)")) { encerrarRodada(); ir("inicio"); } };
    atualizarAcao();
    if (resp) mostrarFeedback(q, resp);
  }

  function corrigir(q, sel, valores) {
    if (q.alternativas) {
      const c = new Set(q.corretas);
      return sel.size === c.size && [...sel].every(k => c.has(k));
    }
    return q.corretas.every((c, i) => valores[i] === c);
  }

  function mostrarFeedback(q, resp) {
    const corpo = app.querySelector("#corpo");
    corpo.querySelectorAll(".alt").forEach(b => {
      b.disabled = true;
      const k = b.dataset.k;
      if (q.corretas.includes(k)) b.classList.add("certa");
      else if (resp.marcadas.includes(k)) b.classList.add("errada");
      b.classList.remove("sel");
    });
    corpo.querySelectorAll("select").forEach(s => {
      s.disabled = true;
      const certo = s.value === q.corretas[+s.dataset.i];
      s.classList.add(certo ? "certa" : "errada");
      s.closest(".par")?.classList.add(certo ? "certa" : "errada");
    });

    const letraVis = k => {
      const idx = quiz.itens[quiz.i].ordem?.indexOf(k);
      return idx >= 0 ? "abcdefgh"[idx].toUpperCase() : k.toUpperCase();
    };
    let gabarito;
    if (q.alternativas) gabarito = q.corretas.map(k => `<b>${letraVis(k)})</b> ${esc(q.alternativas[k])}`).join("<br>");
    else if (q.tipo === "lacunas") gabarito = q.corretas.map((c, i) => `<b>Lacuna ${i + 1}:</b> ${esc(c)}`).join("<br>");
    else gabarito = q.pares.map((p, i) => `<b>${i + 1}.</b> ${esc(p.item.slice(0, 90))}${p.item.length > 90 ? "…" : ""} → <b>${esc(q.corretas[i])}</b>`).join("<br>");

    const erros = (resp.marcadas || []).filter(k => !q.corretas.includes(k) && q.por_que_erradas?.[k])
      .map(k => `<p><b class="nok-txt">Por que a ${letraVis(k)} está errada:</b> ${esc(q.por_que_erradas[k])}</p>`).join("");
    const faltou = q.alternativas && q.multipla_resposta ? q.corretas.filter(k => !resp.marcadas.includes(k)) : [];
    const ev = resp.ev;
    const frasesOk = ["Mandou bem! 🎉", "Isso aí, formando(a)! 🎓", "Gabaritou essa! 💯", "Tá com o diploma na mão! 📜"];
    const frasesNok = ["Quase! Bora entender o porquê 👇", "Calma, a segunda chamada existe ♻️", "Errar faz parte do TCC da vida 📚"];
    const titulo = resp.ok ? frasesOk[q.id.length % frasesOk.length] : frasesNok[q.id.length % frasesNok.length];

    app.querySelector("#fb").innerHTML = `
      <div class="feedback ${resp.ok ? "ok" : "nok"}" role="status">
        <div class="fb-carca">${carca(resp.ok ? "comemorando" : "pensando", "carca-sm")}</div>
        <div class="fb-corpo">
        <div class="fb-topo">
          <h3 class="${resp.ok ? "ok-txt" : "nok-txt"}">${ic(resp.ok ? "check" : "x")} ${titulo}</h3>
          ${ev && ev.xp ? `<span class="xp-chip" title="${esc(ev.partes.join(" · "))}">+${ev.xp} créditos</span>` : ""}
        </div>
        ${ev && ev.partes.length ? `<p class="muted small">${esc(ev.partes.join(" · "))}</p>` : ""}
        ${resp.ok ? "" : `<p><b>Resposta correta:</b><br>${gabarito}</p>`}
        ${faltou.length && !resp.ok ? `<p class="muted small">Faltou marcar: ${faltou.map(letraVis).join(", ")}</p>` : ""}
        ${erros ? `<div class="fb-bloco">${erros}</div>` : ""}
        <div class="fb-bloco"><p class="eyebrow">Por quê?</p><p>${esc(q.explicacao)}</p></div>
        ${q.observacao ? `<div class="obs">${ic("alert")} <span>${esc(q.observacao)}</span></div>` : ""}
        ${q.gabarito_oficial_moodle ? `<div class="obs">${ic("alert")} <span>No Moodle, o gabarito oficial marca: ${q.gabarito_oficial_moodle.map(k => letraVis(k)).join(", ")}. Veja a observação acima.</span></div>` : ""}
        </div>
      </div>`;
  }

  /* ---------- Tela: Resultado ---------- */
  function telaResultado() {
    salvarRodada();
    const total = quiz.itens.length;
    const acertos = quiz.respostas.filter(r => r && r.ok).length;
    const erradas = quiz.itens.filter((_, i) => quiz.respostas[i] && !quiz.respostas[i].ok).map(x => x.q);
    const p = pct(acertos, total);
    const [selo, msg] = p === 100 ? ["🏆", "Gabaritou! Joga o capelo pro alto!"] : p >= 90 ? ["🎓", "Nível formatura. Diploma garantido!"]
      : p >= 70 ? ["📜", "Aprovado(a)! Revise os erros para fechar com chave de ouro."] : p >= 50 ? ["📚", "Recuperação à vista: refaça as erradas."]
      : ["♻️", "Segunda chamada liberada. Bora de novo!"];

    if (p === 100 && total >= 5 && !db.conq.gabarito) {
      db.conq.gabarito = Date.now(); save();
      setTimeout(() => toast(`<span class="toast-ic">💯</span><div><b>Conquista desbloqueada!</b><br>Gabaritou!</div>`, "gold"), 600);
    }

    app.innerHTML = `
      <p class="eyebrow">Resultado</p>
      <h2>${esc(quiz.titulo)}</h2>
      <div class="grid stagger" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));align-items:start">
        <div class="card result-card">
          <div class="selo-res">${carca(p >= 70 ? "comemorando" : "pensando", "carca-res")}<span class="selo-emoji" aria-hidden="true">${selo}</span></div>
          <div class="score grad" data-alvo="${p}">0%</div>
          <p><b>${acertos}</b> de <b>${total}</b> corretas · <b>+${quiz.xpRodada}</b> créditos</p>
          <p class="muted">${msg}</p>
          <div class="btn-row" style="justify-content:center;margin-top:16px">
            <button class="btn btn-primary" type="button" id="refazer" ${erradas.length ? "" : "disabled"}>${ic("redo")} Segunda chamada (${erradas.length})</button>
            <button class="btn btn-ghost" type="button" id="novo">Nova rodada</button>
          </div>
        </div>
        <div class="card">
          <h3>Questão por questão</h3>
          <div class="lista-res">${quiz.itens.map((it, i) => {
            const r = quiz.respostas[i];
            const st = !r ? `<span class="ic muted">–</span>` : r.ok ? `<span class="ic ok-txt">${ic("check")}</span>` : `<span class="ic nok-txt">${ic("x")}</span>`;
            return `<button class="item" type="button" data-ver="${i}">${st}<span>${esc(it.q.tema || it.q.id)}</span><span class="muted small" style="margin-left:auto">${it.q.id}</span></button>`;
          }).join("")}</div>
        </div>
      </div>`;

    const sc = app.querySelector(".score");
    if (reduz) sc.textContent = p + "%";
    else { const t0 = performance.now(); const passo = t => { const k = Math.min(1, (t - t0) / 900); sc.textContent = Math.round(p * (1 - Math.pow(1 - k, 3))) + "%"; if (k < 1) requestAnimationFrame(passo); }; requestAnimationFrame(passo); }
    if (p >= 90) setTimeout(() => chuvaDeCapelos(p === 100 ? 30 : 16), 500); else if (p >= 70) setTimeout(() => confete(60), 500);

    app.querySelector("#refazer").onclick = () => iniciar(shuffle(erradas), "Segunda chamada · " + quiz.titulo);
    app.querySelector("#novo").onclick = () => { encerrarRodada(); ir("estudar"); };
    app.querySelectorAll("[data-ver]").forEach(b => b.onclick = () => { quiz.i = +b.dataset.ver; ir("quiz"); });
  }

  /* ---------- Tela: Desempenho (níveis, conquistas, diploma) ---------- */
  function telaDesempenho() {
    const g = resumo(Q);
    const ni = nivelDe(db.xp), formado = db.xp >= XP_COLACAO;
    app.innerHTML = `
      <p class="eyebrow">Desempenho</p>
      <h2>Sua jornada até a <span class="grad">formatura</span></h2>
      <div class="card banner-vr">
        ${carca("vr", "carca-banner")}
        <div>
          <p class="eyebrow">Visão do futuro</p>
          ${fala(db.xp >= XP_COLACAO ? "Já tô vendo você de beca e capelo! 🎓" : `Tô vendo aqui no meu tablet: faltam <b>${XP_COLACAO - db.xp} créditos</b> pra sua colação de grau.`, "fala-banner")}
        </div>
      </div>

      <div class="card trilha stagger">
        <div class="trilha-linha"><i style="--w:${Math.min(100, pct(db.xp, NIVEIS[NIVEIS.length - 1].xp))}%"></i></div>
        <div class="trilha-niveis">${NIVEIS.map((n, i) => `<div class="degrau ${i <= ni ? "feito" : ""} ${i === ni ? "atual" : ""}" title="${n.xp} créditos">
          <span class="degrau-ic">${n.ic}</span><span class="degrau-nome">${n.nome}</span><span class="muted small">${n.xp}</span></div>`).join("")}</div>
        <p class="muted small" style="text-align:center;margin:12px 0 0">${db.xp} créditos · ${proximoNivelTexto()}</p>
      </div>

      <div class="grid grid-stats section stagger" style="margin-top:20px">
        ${[[g.resp + "/" + Q.length, "Respondidas"], [g.taxa + "%", "Taxa de acerto"], [g.dominio + "%", "Domínio"], [g.erradas, "Para revisar"]]
          .map(([n, l]) => `<div class="card stat"><strong>${n}</strong><span>${l}</span></div>`).join("")}
      </div>

      <section class="section">
        <p class="eyebrow">Diploma</p>
        <div class="diploma ${formado ? "" : "bloqueado"}">
          <div class="diploma-borda">
            <p class="eyebrow" style="text-align:center">Diploma não oficial · só pela zoeira e pelo estudo 😄</p>
            <div class="diploma-capelo">🎓</div>
            <p class="diploma-titulo">Quiz GTI · Turma de Formandos</p>
            <p>Certificamos que</p>
            <p class="diploma-nome">${esc(nomeJogador())}</p>
            <p>${formado ? `colou grau no Quiz GTI com <b>${db.xp} créditos</b> e ${Object.keys(db.conq).length} conquistas.` : `ainda está cursando: faltam <b>${XP_COLACAO - db.xp} créditos</b> para a colação de grau.`}</p>
            <p class="diploma-ass">@prof.tenebroso<br><span class="muted small">reitor honorário do quiz</span></p>
          </div>
          ${formado ? "" : `<div class="cadeado">🔒 Libera com ${XP_COLACAO} créditos</div>`}
        </div>
      </section>

      <section class="section">
        <p class="eyebrow">Conquistas · ${Object.keys(db.conq).length}/${CONQ.length}</p>
        <div class="grid grid-3 stagger">${CONQ.map(c => `<div class="card conq ${db.conq[c.id] ? "on" : ""}">
          <span class="conq-ic">${db.conq[c.id] ? c.ic : "🔒"}</span><div><b>${c.nome}</b><br><span class="muted small">${c.desc}</span></div></div>`).join("")}</div>
      </section>

      ${B.disciplinas.map(d => {
        const us = unidadesDe(d.id);
        return `<section class="section">
          <div class="sec-head">${avatar(d.id, "md")}<div><h3>${esc(d.nome)}</h3><span class="prof">Prof. ${esc(PROF[d.id].nome)}</span></div></div>
          <div class="grid grid-3 stagger">${us.map(u => {
            const lista = Q.filter(q => q.disciplina === d.id && q.unidade === u), r = resumo(lista);
            return `<div class="card">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>${unidadeLabel(u)}</b><span class="muted small">${r.resp}/${r.total}</span></div>
              <div class="bar-row" style="margin:10px 0"><div class="bar"><i style="--w:${r.dominio}%"></i></div><b>${r.dominio}%</b></div>
              <div class="btn-row">
                <button class="btn btn-sm" type="button" data-estudar="${d.id}|${u}">Estudar</button>
                ${r.erradas ? `<button class="btn btn-ghost btn-sm" data-rev="${d.id}|${u}">${ic("redo")} Revisar ${r.erradas}</button>` : ""}
              </div></div>`;
          }).join("")}</div></section>`;
      }).join("")}
      <section class="section">
        <p class="eyebrow">Seus dados</p>
        <div class="card">
          <p style="margin-top:0">Seu progresso é salvo <b>automaticamente neste navegador</b> a cada resposta: pode fechar e abrir o app que tudo continua aqui.
            Para levar para outro computador ou celular, ou guardar uma cópia de segurança, use o backup.</p>
          <div class="btn-row">
            <button class="btn btn-primary" type="button" id="exportar">${ic("download")} Baixar backup</button>
            <label class="btn btn-ghost" for="importar" style="cursor:pointer" tabindex="0">${ic("upload")} Restaurar backup</label>
            <input type="file" id="importar" accept=".json,application/json" hidden>
            <button class="btn btn-danger" type="button" id="zerar">${ic("trash")} Zerar meu progresso</button>
          </div>
          <p class="muted small" style="margin-bottom:0">Janela anônima/privada e "limpar dados de navegação" apagam o progresso salvo no navegador. Por isso vale baixar o backup de vez em quando.</p>
        </div>
      </section>`;
    const parse = v => { const [d, u] = v.split("|"); return [d, isNaN(u) ? u : +u]; };
    app.querySelectorAll("[data-estudar]").forEach(b => b.onclick = () => { const [d, u] = parse(b.dataset.estudar); Object.assign(setup, { disc: d, unidades: [u], questionario: "", modo: "todas" }); ir("estudar"); });
    app.querySelectorAll("[data-rev]").forEach(b => b.onclick = () => { const [d, u] = parse(b.dataset.rev); iniciar(shuffle(Q.filter(q => q.disciplina === d && q.unidade === u && db.stats[q.id] && !db.stats[q.id].ult)), `Segunda chamada · ${DISC[d].nome} · ${unidadeLabel(u)}`); });
    app.querySelector("#zerar").onclick = () => {
      if (!confirm("Apagar respostas, créditos, conquistas e a rodada em andamento? Não dá para desfazer (a não ser que você tenha um backup).")) return;
      const { tema, nome, ranking } = db; quiz = null;
      db = { stats: {}, xp: 0, conq: {}, recup: 0, melhorCombo: 0, tema, nome, ranking }; save(); rota();
      toast(`<span class="toast-ic">🧹</span><div>Progresso zerado. Bora começar de novo!</div>`);
    };
    app.querySelector("#exportar").onclick = () => {
      salvarRodada();
      const dados = { app: "quizgti", versao: 1, exportado_em: new Date().toISOString(), dados: db };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }));
      a.download = `quizgti-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast(`<span class="toast-ic">💾</span><div>Backup baixado. Guarde o arquivo!</div>`);
    };
    app.querySelector('label[for="importar"]').onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); app.querySelector("#importar").click(); } };
    app.querySelector("#importar").onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text());
        const d = j && j.app === "quizgti" ? j.dados : null;
        if (!d || typeof d.stats !== "object" || typeof d.xp !== "number") throw new Error("formato");
        if (!confirm(`Restaurar o backup de ${j.exportado_em?.slice(0, 10) || "data desconhecida"} (${d.xp} créditos)? O progresso atual será substituído.`)) return;
        db = { stats: {}, conq: {}, recup: 0, melhorCombo: 0, ...d, tema: db.tema, ranking: d.ranking || db.ranking };
        save(); quiz = restaurarRodada(db.rodada); rota();
        toast(`<span class="toast-ic">✅</span><div>Backup restaurado: <b>${db.xp}</b> créditos.</div>`, "gold");
      } catch { toast(`<span class="toast-ic">⚠️</span><div>Esse arquivo não é um backup válido do Quiz GTI.</div>`); }
      e.target.value = "";
    };
  }

  /* ---------- Pode cair: Ímã de siglas ----------
   * Arraste a sigla (o ímã) até o conceito certo: se for o par, ela gruda; se não, é repelida e volta.
   * Também funciona tocando/clicando (sigla e depois conceito) e pelo teclado (Tab + Enter).
   * Créditos: +3 no 1º acerto de primeira de um termo; +1 nos demais acertos. Não contam no ranking
   * (o servidor só confere as questões do quiz). Domínio por termo fica em db.glos. */
  const IMA_POR_RODADA = 6;
  let glosCarregando = null;
  const carregarGlossario = () => window.GLOSSARIO ? Promise.resolve() : (glosCarregando ||= new Promise((ok, falha) => {
    const s = document.createElement("script"); s.src = "glossario.js?v=1"; s.async = true;
    s.onload = ok; s.onerror = () => { glosCarregando = null; s.remove(); falha(); };
    document.head.appendChild(s);
  }));
  const termosDe = d => (window.GLOSSARIO?.[d] || []).map(x => ({ ...x, id: `${d}:${x.t}` }));
  let pc = { modo: "jogar", disc: null, busca: "" };
  let ima = null;

  function novaRodada(disc) {
    const todos = shuffle(termosDe(disc));
    const g = id => db.glos?.[id];
    /* prioridade: nunca acertou de primeira > errou da última vez > já dominado */
    const peso = x => g(x.id)?.ok ? 2 : g(x.id) ? 1 : 0;
    const pares = todos.sort((a, b) => peso(a) - peso(b)).slice(0, IMA_POR_RODADA);
    ima = { disc, pares, alvos: shuffle(pares), pecas: shuffle(pares), feitos: new Set(), erros: {}, sel: null, xp: 0, primeira: 0 };
  }

  function somarXp(pts, alvo, extras = []) {
    const ev = { xp: pts, partes: [], conquistas: [], nivelAntes: nivelDe(db.xp) };
    db.xp += pts; ev.nivelDepois = nivelDe(db.xp);
    const ganha = id => { if (!db.conq[id]) { db.conq[id] = Date.now(); ev.conquistas.push(CONQ.find(c => c.id === id)); } };
    extras.forEach(ganha);
    if (db.xp >= XP_COLACAO) ganha("colacao");
    if (ev.nivelDepois === NIVEIS.length - 1) ganha("laureado");
    save(); atualizarHud(); celebrarEventos(ev, alvo);
  }

  async function telaPodeCair() {
    pc.disc = pc.disc || setup.disc || "gsc";
    app.innerHTML = `
      <p class="eyebrow">Pode cair na prova</p>
      <h2>Ímã de <span class="grad">siglas</span></h2>
      <div class="card carca-dica pc-dica">
        ${carca("estudando", "carca-sm")}
        ${fala(`Arraste a sigla até o conceito: par certo, o <b>ímã gruda</b> 🧲; errado, é <b>repelido</b> e você tenta de novo. <span class="so-desktop">Também dá para clicar na sigla e depois no conceito.</span><span class="so-celular">Ou toque na sigla e depois no conceito.</span>`)}
      </div>
      <div class="pc-barra">
        <div class="chips" role="group" aria-label="Disciplina">${B.disciplinas.map(d => `<button class="chip chip-prof" type="button" data-pc-disc="${d.id}" aria-pressed="${d.id === pc.disc}" aria-label="${esc(d.nome)}">${avatar(d.id, "xs")} <span class="so-desktop">${esc(d.nome)}</span><span class="so-celular" aria-hidden="true">${{ gsc: "Segurança", gov: "Governança", eag: "Est. Avançados" }[d.id] || esc(d.nome)}</span></button>`).join("")}</div>
        <div class="pc-modos" role="group" aria-label="Modo">
          <button class="chip" type="button" data-pc-modo="jogar" aria-pressed="${pc.modo === "jogar"}">🧲 Jogar</button>
          <button class="chip" type="button" data-pc-modo="colinha" aria-pressed="${pc.modo === "colinha"}">📖 Colinha</button>
        </div>
      </div>
      <div id="pc-corpo" class="pc-corpo"><div class="card rk-vazio"><p class="muted" style="margin:0">Carregando as siglas…</p></div></div>`;
    app.querySelectorAll("[data-pc-disc]").forEach(b => b.onclick = () => { pc.disc = b.dataset.pcDisc; ima = null; telaPodeCair(); });
    app.querySelectorAll("[data-pc-modo]").forEach(b => b.onclick = () => { pc.modo = b.dataset.pcModo; telaPodeCair(); });
    try { await carregarGlossario(); }
    catch {
      const c = app.querySelector("#pc-corpo");
      if (c) c.innerHTML = `<div class="card rk-vazio"><p style="margin-top:0">Não consegui carregar as siglas. Confira sua conexão.</p><button class="btn btn-sm" type="button" id="pc-tentar">${ic("redo")} Tentar de novo</button></div>`;
      app.querySelector("#pc-tentar")?.addEventListener("click", telaPodeCair);
      return;
    }
    if (location.hash !== "#podecair") return;
    pc.modo === "colinha" ? renderColinha() : renderIma();
  }

  /* ----- Colinha: consulta de todos os termos da disciplina ----- */
  function renderColinha() {
    const corpo = app.querySelector("#pc-corpo"), lista = termosDe(pc.disc);
    const dom = lista.filter(x => db.glos?.[x.id]?.ok).length;
    corpo.innerHTML = `
      <div class="pc-busca nome-box">
        <label for="pc-q">${ic("target")} Procurar sigla ou termo</label>
        <input id="pc-q" type="search" placeholder="Ex.: SLA, hash, COBIT…" value="${esc(pc.busca)}" autocomplete="off">
      </div>
      <p class="muted small">${lista.length} termos de ${esc(DISC[pc.disc].nome)} · <b>${dom}</b> dominados no ímã 🧲</p>
      <dl class="colinha" id="pc-lista"></dl>`;
    const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const desenhar = () => {
      const q = norm(pc.busca.trim());
      const vis = lista.filter(x => !q || norm(`${x.t} ${x.n} ${x.c}`).includes(q));
      corpo.querySelector("#pc-lista").innerHTML = vis.length ? vis.map(x => `
        <div class="colinha-item ${db.glos?.[x.id]?.ok ? "dominado" : ""}">
          <dt><b>${esc(x.t)}</b>${db.glos?.[x.id]?.ok ? ` <span class="seal seal-ok" title="Você já ligou de primeira">🧲 dominado</span>` : ""}</dt>
          <dd><span class="colinha-nome">${esc(x.n)}</span>${esc(x.c)}</dd>
        </div>`).join("") : `<p class="muted">Nenhum termo encontrado para “${esc(pc.busca)}”.</p>`;
    };
    corpo.querySelector("#pc-q").oninput = e => { pc.busca = e.target.value; desenhar(); };
    desenhar();
  }

  /* ----- Jogo do ímã ----- */
  function renderIma() {
    if (!ima || ima.disc !== pc.disc || ima.feitos.size === ima.pares.length && ima.fim) novaRodada(pc.disc);
    const corpo = app.querySelector("#pc-corpo");
    corpo.innerHTML = `
      <div class="ima-status">
        <span class="hud-pill" id="ima-placar">🧲 <b>${ima.feitos.size}</b>/${ima.pares.length} ligados</span>
        <span class="hud-pill">+<b id="ima-xp">${ima.xp}</b> créditos</span>
        <button class="btn btn-sm btn-ghost" type="button" id="ima-nova">${ic("redo")} Nova rodada</button>
      </div>
      <p class="sr-only" id="ima-aviso" aria-live="assertive"></p>
      <div class="ima-board">
        <div class="ima-pecas" aria-label="Siglas (ímãs)">${ima.pecas.map(x => `
          <button class="ima-peca ${ima.feitos.has(x.id) ? "usada" : ""}" type="button" data-id="${esc(x.id)}" aria-pressed="false" ${ima.feitos.has(x.id) ? "disabled" : ""}>
            <span class="ima-polo" aria-hidden="true"></span>${esc(x.t)}</button>`).join("")}
        </div>
        <ol class="ima-alvos" aria-label="Conceitos">${ima.alvos.map(x => {
          const feito = ima.feitos.has(x.id);
          return `<li><button class="ima-alvo ${feito ? "feito" : ""}" type="button" data-id="${esc(x.id)}" ${feito ? "disabled" : ""}>
            <span class="ima-slot" aria-hidden="${!feito}">${feito ? `<b>${esc(x.t)}</b>` : "🧲"}</span>
            <span class="ima-conc">${esc(x.c)}${feito ? `<span class="ima-nome">${esc(x.t)} = ${esc(x.n)}</span>` : ""}</span>
          </button></li>`; }).join("")}
        </ol>
      </div>
      <p class="muted small" style="margin-top:16px">Os créditos do ímã sobem o seu nível, mas não entram no ranking (lá só valem as questões do quiz).</p>`;
    corpo.querySelector("#ima-nova").onclick = () => { novaRodada(pc.disc); renderIma(); };
    corpo.querySelectorAll(".ima-peca:not(.usada)").forEach(prepararPeca);
    corpo.querySelectorAll(".ima-alvo").forEach(a => a.onclick = () => {
      if (a.classList.contains("feito")) return;
      const p = ima.sel && corpo.querySelector(`.ima-peca[data-id="${CSS.escape(ima.sel)}"]`);
      if (!p) { aviso("Escolha primeiro uma sigla e depois toque no conceito."); corpo.querySelector(".ima-peca:not(.usada)")?.focus(); return; }
      tentar(p, a, null);
    });
  }

  const aviso = txt => { const a = app.querySelector("#ima-aviso"); if (a) a.textContent = txt; };
  function selecionar(p) {
    app.querySelectorAll(".ima-peca").forEach(x => { const on = x === p && ima.sel !== x.dataset.id; x.classList.toggle("selecionada", on); x.setAttribute("aria-pressed", on); });
    ima.sel = p && ima.sel !== p.dataset.id ? p.dataset.id : null;
    if (ima.sel) aviso(`${p.textContent.trim()} selecionada. Agora escolha o conceito.`);
  }

  function prepararPeca(p) {
    let ignorarClique = false;
    p.onclick = () => { if (ignorarClique) { ignorarClique = false; return; } selecionar(p); };
    p.onpointerdown = e => {
      if (e.button !== 0 || p.classList.contains("usada")) return;
      const r = p.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
      let fantasma = null, perto = null, rolar = 0, raf = 0;
      const mover = ev => {
        if (!fantasma) {
          if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 6) return;
          fantasma = p.cloneNode(true); fantasma.classList.add("ima-fantasma"); fantasma.removeAttribute("id");
          fantasma.style.width = r.width + "px"; document.body.appendChild(fantasma);
          p.classList.add("ima-origem"); selecionar(null);
        }
        fantasma.style.transform = `translate(${ev.clientX - ox}px, ${ev.clientY - oy}px) rotate(-3deg) scale(1.06)`;
        const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".ima-alvo:not(.feito)") || null;
        if (el !== perto) { perto?.classList.remove("perto"); el?.classList.add("perto"); perto = el; }
        /* rolagem automática perto das bordas (celular) */
        rolar = ev.clientY < 90 ? -14 : ev.clientY > innerHeight - 110 ? 14 : 0;
        if (rolar && !raf) { const passo = () => { if (!rolar) { raf = 0; return; } scrollBy(0, rolar); raf = requestAnimationFrame(passo); }; raf = requestAnimationFrame(passo); }
      };
      const fim = ev => {
        p.removeEventListener("pointermove", mover); p.removeEventListener("pointerup", fim); p.removeEventListener("pointercancel", fim);
        rolar = 0;
        if (!fantasma) return;
        ignorarClique = true; setTimeout(() => { ignorarClique = false; }, 50);
        perto?.classList.remove("perto");
        /* a página pode ter rolado sozinha: confere de novo o que está embaixo do dedo */
        if (ev.type === "pointerup") perto = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".ima-alvo:not(.feito)") || null;
        if (perto && ev.type === "pointerup") tentar(p, perto, fantasma);
        else voltar(p, fantasma);
      };
      p.setPointerCapture(e.pointerId);
      p.addEventListener("pointermove", mover); p.addEventListener("pointerup", fim); p.addEventListener("pointercancel", fim);
    };
  }

  /* anima o fantasma até um retângulo e chama o fim */
  function voar(fantasma, alvoRect, dur, curva, fimFn) {
    if (reduz) { fantasma.remove(); return fimFn(); }
    fantasma.style.transition = `transform ${dur}ms ${curva}`;
    fantasma.style.transform = `translate(${alvoRect.left}px, ${alvoRect.top}px)`;
    let feito = false;
    const acabar = () => { if (feito) return; feito = true; fantasma.remove(); fimFn(); };
    fantasma.addEventListener("transitionend", acabar, { once: true }); setTimeout(acabar, dur + 80);
  }
  const criarFantasma = p => {
    const r = p.getBoundingClientRect(), f = p.cloneNode(true);
    f.classList.add("ima-fantasma"); f.style.width = r.width + "px"; f.style.transform = `translate(${r.left}px, ${r.top}px)`;
    document.body.appendChild(f); return f;
  };
  function voltar(p, fantasma) {
    voar(fantasma, p.getBoundingClientRect(), 380, "cubic-bezier(.3, 1.5, .5, 1)", () => p.classList.remove("ima-origem"));
  }

  function tentar(p, alvo, fantasma) {
    const id = p.dataset.id, certo = alvo.dataset.id === id, x = ima.pares.find(y => y.id === id);
    db.glos = db.glos || {};
    const g = db.glos[id] || (db.glos[id] = { t: 0, a: 0 });
    selecionar(null);
    if (certo) {
      const dePrimeira = !ima.erros[id];
      const pts = dePrimeira && !g.ok ? 3 : 1;
      g.t++; g.a++; if (dePrimeira) g.ok = true;
      ima.feitos.add(id); ima.xp += pts; if (dePrimeira) ima.primeira++;
      p.classList.add("usada"); p.disabled = true; p.classList.remove("ima-origem");
      const slot = alvo.querySelector(".ima-slot");
      const grudar = () => {
        alvo.classList.add("feito", "grudou"); alvo.disabled = true;
        slot.innerHTML = `<b>${esc(x.t)}</b>`; slot.setAttribute("aria-hidden", "false");
        alvo.querySelector(".ima-conc").insertAdjacentHTML("beforeend", `<span class="ima-nome">${esc(x.t)} = ${esc(x.n)}</span>`);
        app.querySelector("#ima-placar").innerHTML = `🧲 <b>${ima.feitos.size}</b>/${ima.pares.length} ligados`;
        app.querySelector("#ima-xp").textContent = ima.xp;
        const r = slot.getBoundingClientRect();
        confete(dePrimeira ? 22 : 10, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        aviso(`Grudou! ${x.t} = ${x.n}. +${pts} créditos.`);
        const fimRodada = ima.feitos.size === ima.pares.length;
        const perfeito = fimRodada && ima.primeira === ima.pares.length;
        somarXp(pts, slot, perfeito ? ["ima"] : []);
        if (fimRodada) setTimeout(() => location.hash === "#podecair" && resultadoIma(), reduz ? 200 : 900);
        else app.querySelector(".ima-peca:not(.usada)")?.focus({ preventScroll: true });
      };
      const f = fantasma || criarFantasma(p);
      const sr = slot.getBoundingClientRect();
      voar(f, { left: sr.left + (sr.width - f.offsetWidth) / 2, top: sr.top + (sr.height - f.offsetHeight) / 2 }, 320, "cubic-bezier(.2, 1.6, .4, 1)", grudar);
    } else {
      ima.erros[id] = (ima.erros[id] || 0) + 1;
      g.t++;
      save();
      alvo.classList.remove("repele"); void alvo.offsetWidth; alvo.classList.add("repele");
      setTimeout(() => alvo.classList.remove("repele"), 600);
      const f = fantasma || criarFantasma(p);
      p.classList.add("ima-origem");
      /* empurrão para longe do conceito antes de voltar */
      const ar = alvo.getBoundingClientRect(), m = new DOMMatrixReadOnly(getComputedStyle(f).transform);
      const dx = m.m41 - (ar.left + ar.width / 2), dy = m.m42 - (ar.top + ar.height / 2), d = Math.hypot(dx, dy) || 1;
      if (!reduz) {
        f.style.transition = "transform 140ms ease-out";
        f.style.transform = `translate(${m.m41 + dx / d * 46}px, ${m.m42 + dy / d * 46}px) rotate(8deg)`;
      }
      setTimeout(() => voltar(p, f), reduz ? 0 : 150);
      setTimeout(() => { p.classList.remove("treme"); void p.offsetWidth; p.classList.add("treme"); }, reduz ? 0 : 520);
      aviso(`${x.t} não gruda nesse conceito. Tente outra vez!`);
      toast(`<span class="toast-ic">🧲</span><div><b>Repelido!</b><br>${esc(x.t)} não gruda aí. Tente outra vez.</div>`);
    }
  }

  function resultadoIma() {
    ima.fim = true;
    const total = ima.pares.length, perf = ima.primeira === total;
    const corpo = app.querySelector("#pc-corpo");
    corpo.innerHTML = `
      <div class="card ima-fim">
        ${carca(ima.primeira >= total * .7 ? "comemorando" : "pensando", "carca-banner")}
        <div>
          <p class="eyebrow">${perf ? "Ímã humano!" : "Rodada concluída"}</p>
          <h3 style="margin:0 0 6px">${ima.primeira} de ${total} de primeira · +${ima.xp} créditos</h3>
          ${fala(perf ? "Gabaritou as siglas! Essas já não te pegam mais na prova. 🧲" : "Boa! As que você errou voltam nas próximas rodadas até grudarem de primeira.")}
          <div class="btn-row" style="margin-top:14px">
            <button class="btn btn-primary" type="button" id="ima-de-novo">🧲 Próxima rodada</button>
            <button class="btn btn-ghost" type="button" id="ima-colinha">📖 Ver colinha</button>
          </div>
        </div>
      </div>
      <dl class="colinha" style="margin-top:20px">${ima.pares.map(x => `
        <div class="colinha-item ${ima.erros[x.id] ? "" : "dominado"}"><dt><b>${esc(x.t)}</b> ${ima.erros[x.id] ? `<span class="seal seal-warn">${ima.erros[x.id]} erro(s)</span>` : `<span class="seal seal-ok">de primeira</span>`}</dt>
        <dd><span class="colinha-nome">${esc(x.n)}</span>${esc(x.c)}</dd></div>`).join("")}</dl>`;
    corpo.querySelector("#ima-de-novo").onclick = () => { novaRodada(pc.disc); renderIma(); corpo.scrollIntoView({ behavior: reduz ? "auto" : "smooth", block: "start" }); };
    corpo.querySelector("#ima-colinha").onclick = () => { pc.modo = "colinha"; telaPodeCair(); };
    corpo.querySelector("#ima-de-novo").focus({ preventScroll: true });
  }

  /* ---------- Ranking (Supabase) ----------
   * A chave abaixo é a "publishable" (pública por natureza). As tabelas ficam fechadas por RLS:
   * ela só consegue chamar as funções ranking_* definidas em QUIZ/supabase/esquema.sql. */
  const RANKING = { url: "https://ofpzwycjdjguoyraghpj.supabase.co", chave: "sb_publishable_M5YK53PH78uBiQWMPGxbuA_r6n9v53h" };
  const MSG_RK = {
    apelido_invalido: "O apelido precisa ter de 2 a 24 caracteres (letras, números, espaço, ponto, hífen).",
    jogador_nao_encontrado: "Sua inscrição no ranking não existe mais. Entre de novo quando quiser.",
  };
  const espera = ms => new Promise(r => setTimeout(r, ms));
  async function rpc(fn, args) {
    const r = await fetch(`${RANKING.url}/rest/v1/rpc/${fn}`, {
      method: "POST", headers: { apikey: RANKING.chave, "Content-Type": "application/json" }, body: JSON.stringify(args),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) { const e = new Error(j?.message || `HTTP ${r.status}`); e.code = j?.message; throw e; }
    return j;
  }
  const msgErro = e => MSG_RK[e?.code] || "Não consegui falar com o servidor do ranking. Confira sua internet e tente de novo.";

  /* Fila de respostas: cada resposta vai para o servidor; sem internet, espera e tenta depois. */
  function rankingRegistrar(q, sel, valores) {
    const rk = db.ranking; if (!rk) return;
    rk.fila = rk.fila || [];
    if (rk.fila.length >= 400) rk.fila.shift();
    rk.fila.push({ q: q.id, r: q.alternativas ? [...sel].sort() : valores.map(v => v || "") });
    save(); enviarFila();
  }
  let enviando = null;
  function enviarFila() {
    if (enviando) return enviando;
    const rk = db.ranking;
    if (!rk || !rk.fila?.length) return Promise.resolve();
    enviando = (async () => {
      while (db.ranking === rk && rk.fila.length) {
        try {
          await rpc("ranking_responder", { p_token: rk.token, p_questao: rk.fila[0].q, p_resposta: rk.fila[0].r });
          rk.fila.shift(); save();
          if (rk.fila.length) await espera(1100); // o servidor aceita 1 resposta por segundo
        } catch (e) {
          if (e.code === "muito_rapido") { await espera(1100); continue; }
          if (e.code === "questao_desconhecida" || e.code === "resposta_invalida") { rk.fila.shift(); save(); continue; }
          if (e.code === "jogador_nao_encontrado") { delete db.ranking; save(); }
          break; // sem internet: tenta de novo mais tarde
        }
      }
    })().finally(() => { enviando = null; });
    return enviando;
  }
  addEventListener("online", enviarFila);
  setTimeout(enviarFila, 2500);

  const MEDALHA = ["🥇", "🥈", "🥉"];
  function telaRanking() {
    const rk = db.ranking;
    app.innerHTML = `
      <p class="eyebrow">Ranking da #TurmaGTI</p>
      <h2>Quem está mais perto da <span class="grad">formatura</span></h2>
      ${rk ? `<div class="card rk-eu" id="rk-eu" aria-live="polite"><p class="muted" style="margin:0">Buscando sua posição…</p></div>` : `
      <div class="card rk-entrar">
        ${carca("comemorando", "carca-banner")}
        <div class="rk-entrar-txt">
          <h3 style="margin-top:0">Entre no ranking</h3>
          <ul class="rk-regras">
            <li>Seu <b>apelido</b> fica visível para toda a turma. Use um apelido se não quiser mostrar o nome.</li>
            <li>Valem as respostas dadas <b>a partir de agora</b>. O servidor confere cada uma no gabarito: não dá para inventar pontos.</li>
            <li>Pode sair quando quiser: seus dados do ranking são apagados.</li>
          </ul>
          <form class="nome-box rk-form" id="rk-form">
            <label for="rk-apelido">${ic("pen")} Apelido no ranking</label>
            <div class="rk-linha">
              <input id="rk-apelido" maxlength="24" minlength="2" required autocomplete="nickname" placeholder="Ex.: Ana S." value="${esc((db.nome || "").slice(0, 24))}">
              <button class="btn btn-primary" type="submit">${ic("trophy")} Entrar</button>
            </div>
            <p class="rk-erro small" id="rk-erro" role="alert"></p>
          </form>
        </div>
      </div>`}
      <section class="section rk-sec" id="rk-lista" aria-live="polite" aria-busy="true">
        <div class="card rk-vazio"><p class="muted" style="margin:0">Carregando o ranking…</p></div>
      </section>`;

    const form = app.querySelector("#rk-form");
    if (form) form.onsubmit = async e => {
      e.preventDefault();
      const btn = form.querySelector("button"), erro = form.querySelector("#rk-erro");
      btn.disabled = true; erro.textContent = "";
      try {
        const [r] = await rpc("ranking_entrar", { p_apelido: form.querySelector("#rk-apelido").value });
        db.ranking = { id: r.id, token: r.token, fila: [] }; save();
        toast(`<span class="toast-ic">🏆</span><div><b>Você está no ranking!</b><br>Cada acerto daqui pra frente conta.</div>`, "gold");
        if (location.hash === "#ranking") telaRanking();
      } catch (err) { erro.textContent = msgErro(err); btn.disabled = false; }
    };
    carregarRanking();
  }

  async function carregarRanking() {
    const rk = db.ranking, lista = app.querySelector("#rk-lista");
    await enviarFila();
    let top, eu;
    try {
      [top, eu] = await Promise.all([rpc("ranking_top", { p_limite: 50 }), rk ? rpc("ranking_eu", { p_token: rk.token }) : null]);
    } catch (e) {
      if (location.hash !== "#ranking" || !lista.isConnected) return;
      lista.setAttribute("aria-busy", "false");
      lista.innerHTML = `<div class="card rk-vazio"><p style="margin-top:0">${esc(msgErro(e))}</p><button class="btn btn-sm" type="button" id="rk-tentar">${ic("redo")} Tentar de novo</button></div>`;
      lista.querySelector("#rk-tentar").onclick = telaRanking;
      if (rk) app.querySelector("#rk-eu").innerHTML = `<p class="muted" style="margin:0">Sua posição aparece quando a conexão voltar.</p>`;
      return;
    }
    if (location.hash !== "#ranking" || !lista.isConnected) return;
    eu = eu?.[0];
    if (rk && !eu) { delete db.ranking; save(); toast(`<span class="toast-ic">⚠️</span><div>${esc(MSG_RK.jogador_nao_encontrado)}</div>`); return telaRanking(); }
    if (rk) renderEu(eu);

    const meuId = eu?.id;
    const linha = r => {
      const n = NIVEIS[nivelDe(r.xp)], meu = r.id === meuId;
      return `<li class="rk-item ${meu ? "rk-meu" : ""}">
        <span class="rk-pos">${r.posicao}º</span>
        <span class="rk-nivel" title="${n.nome}" aria-hidden="true">${n.ic}</span>
        <span class="rk-nome"><b>${esc(r.apelido)}${meu ? ` <span class="tag">você</span>` : ""}</b><span class="muted small">${n.nome} · ${r.dominadas} dominadas</span></span>
        <span class="rk-xp"><b>${r.xp}</b><span class="muted small">créditos</span></span>
      </li>`;
    };
    const podio = top.slice(0, 3), resto = top.slice(3);
    lista.setAttribute("aria-busy", "false");
    lista.innerHTML = !top.length
      ? `<div class="card rk-vazio">${fala("Ninguém pontuou ainda. O primeiro lugar está esperando por você! 🏆")}</div>`
      : `<p class="eyebrow">Pódio</p>
        <ol class="podio" aria-label="Pódio">${podio.map((r, i) => {
          const n = NIVEIS[nivelDe(r.xp)];
          return `<li class="podio-item podio-${i + 1} ${r.id === meuId ? "rk-meu" : ""}">
            <span class="podio-medalha" aria-hidden="true">${MEDALHA[r.posicao - 1] || "🏅"}</span>
            <span class="sr-only">${r.posicao}º lugar:</span>
            <b class="podio-nome">${esc(r.apelido)}</b>
            <span class="muted small">${n.ic} ${n.nome}</span>
            <span class="podio-xp"><b>${r.xp}</b> créditos</span>
            <span class="podio-base" aria-hidden="true">${r.posicao}º</span>
          </li>`; }).join("")}</ol>
        ${resto.length ? `<p class="eyebrow" style="margin-top:28px">Classificação</p><ol class="rk-lista">${resto.map(linha).join("")}</ol>` : ""}
        <p class="muted small" style="margin-top:18px">Mostrando ${top.length === 1 ? "o primeiro colocado" : `os ${top.length} primeiros`}. Os créditos do ranking são calculados pelo servidor e contam desde que cada pessoa entrou, por isso podem ser diferentes dos créditos salvos no seu navegador.</p>`;
  }

  function renderEu(eu) {
    const box = app.querySelector("#rk-eu"), pend = db.ranking?.fila?.length || 0;
    box.innerHTML = `
      <div class="rk-eu-topo">
        <div class="rk-eu-pos">
          <p class="eyebrow" style="margin-bottom:2px">Sua posição</p>
          ${eu.xp > 0
            ? `<p style="margin:0"><b class="grad">${eu.posicao}º</b> <span class="muted">de ${eu.total}</span></p>`
            : `<p style="margin:4px 0">Responda uma questão para aparecer no ranking.</p>`}
        </div>
        <div class="rk-eu-num"><b>${eu.xp}</b><span class="muted small">créditos no ranking</span></div>
        <div class="rk-eu-num"><b>${eu.dominadas}</b><span class="muted small">dominadas</span></div>
      </div>
      ${pend ? `<p class="muted small">${pend} resposta(s) aguardando internet para subir.</p>` : ""}
      <form class="rk-linha rk-acoes" id="rk-renomear">
        <label class="sr-only" for="rk-novo">Apelido no ranking</label>
        <input id="rk-novo" maxlength="24" minlength="2" required value="${esc(eu.apelido)}" autocomplete="nickname">
        <button class="btn btn-sm" type="submit">${ic("pen")} Mudar apelido</button>
        <button class="btn btn-sm" type="button" id="rk-atualizar">${ic("redo")} Atualizar</button>
        <button class="btn btn-danger btn-sm" type="button" id="rk-sair">${ic("trash")} Sair do ranking</button>
      </form>
      <p class="rk-erro small" id="rk-erro2" role="alert"></p>`;
    const tok = db.ranking.token, erro = box.querySelector("#rk-erro2");
    box.querySelector("#rk-atualizar").onclick = telaRanking;
    box.querySelector("#rk-renomear").onsubmit = async e => {
      e.preventDefault(); erro.textContent = "";
      try {
        const novo = await rpc("ranking_apelido", { p_token: tok, p_apelido: box.querySelector("#rk-novo").value });
        toast(`<span class="toast-ic">✍️</span><div>Apelido no ranking: <b>${esc(novo)}</b></div>`); telaRanking();
      } catch (err) { erro.textContent = msgErro(err); }
    };
    box.querySelector("#rk-sair").onclick = async () => {
      if (!confirm("Sair do ranking? Seu apelido, seus créditos e seu progresso no ranking serão apagados do servidor. Seu progresso neste navegador continua.")) return;
      try {
        await rpc("ranking_sair", { p_token: tok });
        delete db.ranking; save(); telaRanking();
        toast(`<span class="toast-ic">👋</span><div>Você saiu do ranking e seus dados foram apagados.</div>`);
      } catch (err) { erro.textContent = msgErro(err); }
    };
  }

  rota();
})();
