# Quiz GTI · Edição Formatura 🎓

Quiz de estudo com 198 questões de Gestão de Segurança Cibernética, Governança em TI e Estudos Avançados em GTI.
Criado por @prof.tenebroso (Leônidas Leandro), GTI 5º período, CESAR School. Projeto independente, não oficial.

## Como abrir
Dê dois cliques em `index.html`. Funciona 100% offline: a fonte Poppins fica em `fonts/` (WOFF2, subconjunto latin, licença SIL OFL em `fonts/OFL.txt`).
Para compartilhar, envie a pasta `app` inteira (zipada).

Online: https://leonidasprof.github.io/estudando5periodo/

## Arquivos
- `index.html`, `styles.css`, `app.js`: o app (inclui o conjunto de ícones SVG no `index.html`).
- `fonts/poppins-*.woff2`: fonte Poppins (400, 500, 600 e 700) hospedada no próprio projeto.
- `banco.js`: as questões. É gerado a partir de `../banco_questoes.json`.
- `assets/cesar-school-logo.webp`: logo com fundo transparente (cabeçalho). `favicon.png` e `apple-touch-icon.png`: ícones da aba e da tela inicial do celular.
- `assets/og-image.jpg` (1200×630): imagem que aparece ao compartilhar o link no WhatsApp, LinkedIn etc.
- `assets/*.webp` com nome de professor: fotos dos professores (Humberto Caetano, Ricardo Baudel, Hayanna Oliveira). O enquadramento do rosto fica em `PROF` no `app.js` (`foco` e `zoom`).
- `assets/carca-*.webp`: poses do mascote **Carca**, recortadas da arte “Carcará Tech” (moletom laranja do CESAR):

| Pose | Onde aparece |
|---|---|
| `carca-hero` (joinha, corpo inteiro) | cartaz da tela inicial, com o nível do jogador |
| `carca-estudando` (notebook, mão no queixo) | tela Estudar |
| `carca-comemorando` (punhos para o alto) | acerto, resultado ≥ 70%, subida de nível e colação |
| `carca-pensando` (sorriso de olhos fechados, “segue em frente”) | erro e resultado < 70% |
| `carca-vr` (tablet holográfico) | Desempenho, “visão do futuro” |

## Antes de publicar
Passe pelo checklist de produção: imagens WebP/AVIF com `width`/`height`, hero com `fetchpriority="high"` e demais com `loading="lazy"`, meta tags (SEO, Open Graph, Twitter, JSON-LD), teste em 360/390/768/1024/1366/1920 px, teclado (Tab, Enter, Escape fecha o modal), console sem erros e Lighthouse ≥ 90.

## Atualizar as questões
1. Edite `../banco_questoes.json`.
2. Rode `python atualizar_banco.py` dentro desta pasta.
3. Aumente o número `?v=` nas linhas de `banco.js`, `app.js` e `styles.css` do `index.html` para os navegadores não usarem a versão antiga.

## Regras do jogo
- 1º acerto de uma questão: **+10 créditos** (+5 se for difícil: lacunas, associação ou múltipla resposta).
- Acertar de novo uma questão já dominada: +2.
- Acertar uma que você tinha errado (segunda chamada): +5 de bônus.
- **Combo 🔥**: a partir de 3 acertos seguidos, +5 por questão. Errar zera o combo; erro nunca tira créditos.
- Níveis: Calouro → Veterano → Estagiário → Monitor → Concluinte → **Formando (1000 créditos = colação de grau e diploma)** → Orador da Turma → Laureado.
- 12 conquistas, diploma (não oficial) com o nome do jogador, revisão só das erradas.
- O progresso fica salvo no navegador de cada pessoa (localStorage), inclusive a rodada em andamento. Backup em arquivo na tela Desempenho.
