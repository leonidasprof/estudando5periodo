# Design system do quiz (extraído da referência "PixelCraft")

Estilo: **dark, neon violeta, glassmorphism leve**, com brilhos radiais no fundo e cantos arredondados.

## Cores

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0A0A24` | Fundo da página (azul-marinho quase preto) |
| `--bg-glow` | `radial-gradient(#7C3AED55, transparent)` | Manchas de luz violeta nos cantos |
| `--surface` | `#13133A` | Cards |
| `--surface-2` | `#1A1A4A` | Cards em hover, campos |
| `--border` | `rgba(139, 92, 246, 0.25)` | Borda fina dos cards |
| `--primary` | `#7C3AED` | Botões, destaques |
| `--primary-2` | `#6366F1` | Fim do gradiente (índigo) |
| `--gradient` | `linear-gradient(90deg, #A855F7, #6366F1)` | Botão principal, barras de progresso, texto destacado |
| `--accent` | `#22D3EE` | Ícones e detalhes em ciano |
| `--success` | `#2DD4BF` | Selo "Verified" → **acerto / gabarito oficial** |
| `--danger` | `#F43F5E` | **Erro** (não aparece na referência; adicionado para o quiz) |
| `--warning` | `#FBBF24` | Gabarito "especialista" / observação |
| `--text` | `#FFFFFF` | Títulos e texto principal |
| `--text-muted` | `#A3A6C8` | Textos secundários, legendas |

Modo claro: a referência tem botão de sol/lua. Versão clara: fundo `#F5F3FF`, cards `#FFFFFF`, texto `#1E1B4B`; o gradiente violeta continua igual.

## Tipografia

- **Fonte:** Poppins (Google Fonts). Títulos 700, subtítulos 600, texto 400.
- **Título hero:** 40–48px, duas linhas, com a segunda em `--gradient` (ex.: "Hi, I'm" branco + "Alex Carter" violeta).
- **Título de seção:** 28px, com uma palavra em violeta ("Skills & **T**echnologies").
- **Eyebrow:** 12px, maiúsculas, `letter-spacing: .12em`, em violeta ou ciano ("ABOUT ME", "EXPERTISE").
- **Texto:** 14–16px, `--text-muted`, altura de linha 1.6.

## Forma e espaço

- **Raio:** cards 14px; botões e chips em pílula (999px); avatar em círculo.
- **Espaçamento:** base 8px; seções separadas por 80–96px; padding de card 16–20px.
- **Sombra/brilho:** `0 0 24px rgba(124, 58, 237, .35)` nos botões e cards ativos.

## Componentes

| Referência | Uso no quiz |
|---|---|
| **Navbar flutuante em pílula**, com logo à esquerda, links no centro (ativo sublinhado em violeta) e botão de tema à direita | Topo do app: logo CESAR School + "Quiz GTI"; links Início · Disciplinas · Revisar erros · Desempenho |
| **Hero** com título em duas cores, texto curto e dois botões (preenchido com gradiente + contorno) | Tela inicial: "Estude para a prova com o **@prof.tenebroso**", botões "Começar quiz" e "Refazer erradas" |
| **Ícones sociais** em círculo | Instagram @prof.tenebroso |
| **Cards de estatística** (2+, 20+, 100%) | Questões respondidas, % de acerto, sequência de acertos |
| **Cards de habilidade com barra de progresso** e % | Card de cada disciplina/unidade com o % de domínio |
| **Lista de certificados** com ícone, data e selo "Verified" | Histórico de tentativas; selo "Oficial" (verde) ou "Especialista" (amarelo) |
| **Carrossel de projetos** com setas circulares | Escolher o questionário de origem (1.3 Quiz, 1.6 Avaliação Final...) |
| **Avatar 3D** | Mascote/avatar do @prof.tenebroso, se você tiver uma imagem |

## Estados da questão (criados para o quiz)

- **Alternativa normal:** card `--surface` com borda `--border`.
- **Selecionada:** borda `--primary` + brilho.
- **Correta:** borda e ícone `--success`.
- **Errada:** borda e ícone `--danger`, seguida do card de explicação.
- **Explicação:** card com eyebrow "POR QUE?" em ciano.
