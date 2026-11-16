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
    gsc: { nome: "Humberto Caetano", foto: "assets/Humberto_Caetano.jpg", foco: [45, 22], zoom: 2.6 },
    gov: { nome: "Ricardo Baudel", foto: "assets/Ricardo_Baudel.jpg", foco: [51, 38], zoom: 1.4 },
    eag: { nome: "Hayanna Oliveira", foto: "assets/Hayanna_Oliveira.jpg", foco: [53, 41], zoom: 1.35 },
  };
  /* Carca: o carcará tech, mascote da #TurmaGTI. Uma pose para cada momento do app. */
  const CARCA = {
    hero: { src: "assets/carca-hero.webp?v=3", w: 570, h: 1113, alt: "Carca, o mascote carcará da turma de GTI, fazendo joinha" },
    estudando: { src: "assets/carca-estudando.webp?v=3", w: 285, h: 285, alt: "Carca estudando no notebook" },
    comemorando: { src: "assets/carca-comemorando.webp?v=3", w: 330, h: 289, alt: "Carca comemorando" },
    pensando: { src: "assets/carca-pensando.webp?v=3", w: 285, h: 305, alt: "Carca pensativo" },
    vr: { src: "assets/carca-vr.webp?v=3", w: 340, h: 305, alt: "Carca com óculos de realidade virtual" },
  };
  const carca = (pose, cls = "") => { const c = CARCA[pose]; return `<img class="carca ${cls}" src="${c.src}" width="${c.w}" height="${c.h}" alt="${c.alt}" decoding="async">`; };
  const fala = (txt, cls = "") => `<p class="fala ${cls}">${txt}</p>`;
  const avatar = (disc, tam = "md") => {
    const p = PROF[disc], [fx, fy] = p.foco;
    return `<span class="avatar avatar-${tam}"><span class="avatar-in"><img src="${p.foto}" alt="Prof. ${esc(p.nome)}" decoding="async"
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
    m.innerHTML = `<div class="modal card" role="dialog" aria-modal="true">${html}<button class="btn btn-primary" data-fechar style="margin-top:18px">Bora continuar! 🎉</button></div>`;
    document.body.appendChild(m);
    const fechar = () => { m.classList.add("sai"); setTimeout(() => m.remove(), 250); aoFechar && aoFechar(); };
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

  function rota() {
    const h = (location.hash || "#inicio").slice(1);
    document.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("ativo", a.dataset.nav === h));
    atualizarHud();
    app.classList.remove("entra"); void app.offsetWidth; app.classList.add("entra");
    if (h === "quiz" && quiz) return telaQuestao();
    if (h === "resultado" && quiz) return telaResultado();
    if (h === "estudar") return telaSetup();
    if (h === "desempenho") return telaDesempenho();
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
          ${fala(db.xp >= XP_COLACAO ? "Já tô vendo você de beca e capelo! 🎓" : `Tô vendo aqui no VR: faltam <b>${XP_COLACAO - db.xp} créditos</b> pra sua colação de grau.`, "fala-banner")}
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
      const { tema, nome } = db; quiz = null;
      db = { stats: {}, xp: 0, conq: {}, recup: 0, melhorCombo: 0, tema, nome }; save(); rota();
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
        db = { stats: {}, conq: {}, recup: 0, melhorCombo: 0, ...d, tema: db.tema };
        save(); quiz = restaurarRodada(db.rodada); rota();
        toast(`<span class="toast-ic">✅</span><div>Backup restaurado: <b>${db.xp}</b> créditos.</div>`, "gold");
      } catch { toast(`<span class="toast-ic">⚠️</span><div>Esse arquivo não é um backup válido do Quiz GTI.</div>`); }
      e.target.value = "";
    };
  }

  rota();
})();
