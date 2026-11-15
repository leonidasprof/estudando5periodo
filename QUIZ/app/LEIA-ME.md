# Quiz GTI · Edição Formatura 🎓

Quiz de estudo com 198 questões de Gestão de Segurança Cibernética, Governança em TI e Estudos Avançados em GTI.
Criado por @prof.tenebroso (Leônidas Leandro), GTI 5º período, CESAR School. Projeto independente, não oficial.

## Como abrir
Dê dois cliques em `index.html`. Funciona offline (só a fonte Poppins precisa de internet; sem ela usa a fonte do sistema).
Para compartilhar, envie a pasta `app` inteira (zipada).

## Arquivos
- `index.html`, `styles.css`, `app.js`: o app.
- `banco.js`: as questões. É gerado a partir de `../banco_questoes.json`.
- `assets/cesar-school-logo.png`: logo com fundo transparente.

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
- O progresso fica salvo no navegador de cada pessoa (localStorage).
