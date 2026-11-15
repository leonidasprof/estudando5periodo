# 🎓 Quiz GTI · Edição Formatura

Quiz de estudo gamificado para as provas do 5º período de **Gestão da Tecnologia da Informação (GTI)**, com **198 questões** comentadas de três disciplinas:

| Disciplina | Questões |
|---|---|
| Gestão de Segurança Cibernética | 60 |
| Governança em TI | 98 |
| Estudos Avançados em GTI | 40 |

Criado por **[@prof.tenebroso](https://instagram.com/prof.tenebroso)** (Leônidas Leandro), aluno da CESAR School.

> Projeto independente de estudo, feito por um aluno. **Não é material oficial da CESAR School.**
> Questões marcadas como **Especialista** ainda não têm gabarito oficial confirmado; as marcadas como **Oficial** foram conferidas com a correção do Moodle.

## Como usar

**Online:** https://leonidasprof.github.io/estudando5periodo/

**Offline:**
1. Baixe o repositório (botão **Code → Download ZIP**) e descompacte.
2. Abra `QUIZ/app/index.html` no navegador (dois cliques). Funciona offline.

## O que o quiz faz

- Correção na hora, com a resposta certa, o motivo de cada alternativa errada e a explicação do conteúdo.
- Filtros por disciplina, unidade e questionário de origem; modos **todas**, **só as que errei** e **ainda não respondidas**.
- Formatos: múltipla escolha (inclusive com mais de uma correta), verdadeiro/falso, lacunas e associação.
- Progresso salvo automaticamente no navegador; a rodada continua de onde parou ao reabrir. Backup em arquivo para levar para outro aparelho.
- Gamificação de formatura: créditos, combo 🔥, níveis de **Calouro** a **Laureado**, 12 conquistas, colação de grau e diploma (não oficial 😄).

## Estrutura

```
QUIZ/
├── app/                    # o quiz (HTML, CSS e JS puros, sem dependências)
│   ├── index.html
│   ├── app.js              # telas, regras de negócio e gamificação
│   ├── styles.css          # design system (dark, neon violeta)
│   ├── banco.js            # gerado a partir de banco_questoes.json
│   ├── atualizar_banco.py  # regenera o banco.js
│   └── assets/
├── banco_questoes.json     # banco mestre: 198 questões com explicações
├── design-system.md        # cores, tipografia e componentes
├── notas_estudos_de_caso.md
└── questoes.json           # rascunho inicial (só Segurança Cibernética)
```

Para editar questões, altere `QUIZ/banco_questoes.json` e rode `python QUIZ/app/atualizar_banco.py`. O formato de cada tipo de questão está descrito no próprio JSON (`tipos_de_questao`).

## Veja também

- [agente-rag-lgpd](https://github.com/leonidasprof/agente-rag-lgpd): agente RAG sobre LGPD, feito na mesma disciplina.
