# 🎓 Quiz GTI · Edição Formatura

<p align="center">
  <img src="QUIZ/app/assets/carca-hero.webp" alt="Carca, o carcará tech mascote da #TurmaGTI" width="220">
</p>

<p align="center"><b>Aprender. Evoluir. Conquistar.</b><br>
Quiz de estudo gamificado para as provas do 5º período de <b>Gestão da Tecnologia da Informação (GTI)</b> da CESAR School,<br>
com o <b>Carca</b>, o carcará tech mascote da <b>#TurmaGTI</b>.</p>

<p align="center">
  <a href="https://leonidasprof.github.io/estudando5periodo/"><b>▶ Jogar agora</b></a> ·
  <a href="https://instagram.com/prof.tenebroso">@prof.tenebroso</a>
</p>

---

## 📚 Conteúdo: 198 questões comentadas

| Disciplina | Professor(a) | Questões |
|---|---|---|
| Gestão de Segurança Cibernética | Humberto Caetano | 60 |
| Governança em TI | Ricardo Baudel | 98 |
| Estudos Avançados em GTI | Hayanna Oliveira | 40 |

Cada questão traz a resposta certa, **por que cada alternativa errada está errada** e uma explicação do conteúdo.
O selo **Oficial** indica gabarito conferido com a correção do Moodle; **Especialista** indica gabarito ainda não confirmado pelo Moodle.

> Projeto independente de estudo, feito por um aluno. **Não é material oficial da CESAR School.**

## ✨ O que o app faz

**Estudo**
- Correção na hora, com explicação e o motivo do erro.
- Filtros por disciplina, unidade e questionário de origem.
- Modos **todas**, **só as que errei** (segunda chamada) e **ainda não respondidas**.
- Formatos: múltipla escolha (inclusive com mais de uma correta), verdadeiro/falso, lacunas e associação.

**🧲 Pode cair: Ímã de siglas**
- 120 siglas e termos que aparecem nas questões (SLA, hash, COBIT, BPMN…), separados por disciplina.
- Arraste a sigla até o conceito: par certo **gruda**, par errado é **repelido** e você tenta de novo. Também funciona tocando ou pelo teclado.
- **Colinha** com busca para consultar tudo, marcando o que você já domina.

**🏆 Ranking da turma**
- Pódio e classificação com apelido (participação opcional). O servidor (Supabase) confere cada resposta no gabarito, então não dá para inventar pontos.

**Gamificação de formatura**
- **Créditos** por acerto, bônus por questão difícil e por recuperar um erro, e **combo 🔥** a partir de 3 acertos seguidos.
- **8 níveis:** Calouro → Veterano → Estagiário → Monitor → Concluinte → **Formando** → Orador da Turma → Laureado.
- **Colação de grau** aos 1000 créditos, com chuva de capelos e **diploma** (não oficial 😄) com o nome do jogador.
- **13 conquistas**, como "Em chamas", "Hacker do bem", "Pronto pro ENADE", "Coruja de véspera" e "Ímã humano".

**Carca, o mascote**
- Recebe você no início, estuda junto na tela de configuração, **comemora quando você acerta**, **fica pensativo quando você erra** e, de óculos VR, mostra quanto falta para a sua formatura.

**Experiência**
- Visual dark neon com tema claro, fotos dos professores em cada disciplina e animações de confete, capelos e subida de nível.
- No celular, menu em barra inferior estilo aplicativo.
- Acessível: navegação por teclado, link "pular para o conteúdo", rótulos para leitores de tela e respeito a "reduzir movimento".
- **Progresso salvo automaticamente** no navegador: a rodada continua de onde parou. Backup em arquivo para levar a outro aparelho.

## 🚀 Como usar

- **Online:** https://leonidasprof.github.io/estudando5periodo/
- **Offline:** baixe o repositório (**Code → Download ZIP**), descompacte e abra `QUIZ/app/index.html`.

## 🗂️ Estrutura

```
QUIZ/
├── app/                    # o quiz (HTML, CSS e JS puros, sem dependências)
│   ├── index.html          # estrutura e ícones SVG
│   ├── app.js              # telas, regras de negócio e gamificação
│   ├── styles.css          # design system (dark neon, tema claro, motions)
│   ├── banco.js            # gerado a partir de banco_questoes.json
│   ├── glossario.js        # siglas e termos do "Pode cair" (carrega só na aba)
│   ├── gerar_gabarito_sql.py # gera o gabarito do ranking para o Supabase
│   ├── atualizar_banco.py  # regenera o banco.js
│   └── assets/             # logo, fotos dos professores e poses do Carca
├── supabase/               # SQL do ranking (esquema, gabarito, instalar.sql)
├── banco_questoes.json     # banco mestre: 198 questões com explicações
├── design-system.md        # cores, tipografia e componentes
├── notas_estudos_de_caso.md
└── questoes.json           # rascunho inicial (só Segurança Cibernética)
```

Para editar questões, altere `QUIZ/banco_questoes.json` e rode `python QUIZ/app/atualizar_banco.py`.
O formato de cada tipo de questão está descrito no próprio JSON (`tipos_de_questao`).

## 🙌 Créditos

- Criação e curadoria: **Leônidas Leandro** ([@prof.tenebroso](https://instagram.com/prof.tenebroso)), GTI 5º período, CESAR School.
- Mascote **Carca**: criado por Leônidas para a #TurmaGTI.

## Veja também

- [agente-rag-lgpd](https://github.com/leonidasprof/agente-rag-lgpd): agente RAG sobre LGPD, feito na mesma disciplina.
