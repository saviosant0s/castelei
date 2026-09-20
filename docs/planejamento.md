# Castelei — Planejamento do App de Estudos

**Data:** Setembro de 2026

---

## Conceito Central

O diferencial da plataforma é ensinar o conteúdo **e** a linguagem da prova. Cada lição é estruturada em 3 camadas:

1. **Explicação humana** — como um amigo te explicaria no corredor
2. **Como cai na prova** — o jeito exato que a questão vai aparecer, com o vocabulário de banca
3. **Pegadinhas** — os erros mais comuns que fazem o aluno marcar errado mesmo sabendo

---

## Nome da Plataforma

**Castelei** ✅

Nome escolhido por ser único, memorizável, em primeira pessoa ("eu castelei = eu dominei") e sem equivalente registrado no mercado. A metáfora do castelo também cobre o branding: você constrói conhecimento tijolo por tijolo, até erguer o castelo.

> Domínios a registrar: `castelei.com.br` · `castelei.app`

---

## Planos e Limitações

| Recurso | Grátis | Plus (R$ 19,90/mês) | Pro (R$ 39,90/mês) |
|---|---|---|---|
| Questões por lição | 5 | 30 | Ilimitado |
| Matérias disponíveis | 2 (rotativas) | Todas | Todas |
| Modo Prova | Básico | Completo | Completo + Análise |
| Explicação simples por IA | Sim | Sim | Sim |
| Flashcards gerados por IA | Não | Sim | Sim |
| Revisão Express (última hora) | Não | Sim | Sim |
| Comparar conceitos (tabela IA) | Não | Sim | Sim |
| Modo Tutor Socrático | Não | Sim | Sim |
| Streak + XP + Ranking | Não | Sim | Sim |
| Simulado cronometrado | Não | Não | Sim |
| Mapa mental gerado por IA | Não | Não | Sim |
| Plano de estudo personalizado | Não | Não | Sim |
| Análise de erros e padrões | Não | Não | Sim |
| Memorização criativa (IA) | Não | Não | Sim |
| Relatório de tempo por tópico | Básico | Completo | Completo + Export |

> 5 questões no grátis dá mais sensação de progresso do que 3 — aumenta a chance de conversão.

---

## Conteúdo — Plataforma Multi-Vertical

O app **não tem foco exclusivo em nenhuma área**. O ENEM é apenas um dos módulos disponíveis — a proposta é ser uma plataforma de aprendizado ampla, com múltiplas verticais:

| Vertical | Exemplos de conteúdo |
|---|---|
| **Vestibulares** | ENEM, FUVEST, UNICAMP, UNESP, Famerp |
| **Concursos Públicos** | Raciocínio Lógico, Português, Direito Constitucional, Administração |
| **Idiomas** | Inglês e Espanhol — gramática, vocabulário, interpretação |
| **Certificações Profissionais** | AWS, Google Cloud, PMP, Excel avançado |
| **Habilidades Técnicas** | Lógica de programação, SQL, Matemática financeira |
| **Saúde e Ciências** | Anatomia, Farmacologia, Bioquímica (para áreas da saúde) |
| **Concursos Militares** | EEAR, EsPCEx, AFA |

**Estratégia de lançamento:**
- **MVP:** 2 módulos curados manualmente (ex: Matemática Básica + Português)
- **Fase 2:** Expansão por verticais de maior demanda
- **Fase 3:** IA gerando questões dinamicamente para qualquer vertical
- **Escala:** API aberta para escolas e cursinhos criarem seus próprios módulos

> O conteúdo é diverso por natureza — o usuário escolhe o que quer estudar, sem limitação de área.

---

## Stack Técnica Sugerida

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (PWA → TWA no Android) |
| Backend | Laravel (API REST) |
| Banco de dados | PostgreSQL |
| Geração de questões | API de IA |
| Pagamentos | Stripe ou Pagar.me |
| Autenticação | Laravel Sanctum + Google OAuth |

---

## Fases do Projeto

### Fase 1 — MVP (2 a 3 meses)

- Cadastro e login
- 2 matérias com conteúdo manual
- Sistema de questões com Modo Prova
- Free vs Plus funcional
- PWA instalável

### Fase 2 — Crescimento (3 a 6 meses)

- Expansão de módulos (concursos, vestibulares, idiomas, certificações)
- Gamificação (streak, XP, badges)
- Simulado cronometrado
- TWA publicada na Play Store
- Dashboard do aluno com gráfico de evolução

### Fase 3 — Inteligência (6 a 12 meses)

- IA gerando questões novas dinamicamente
- Análise adaptativa de pontos fracos
- Plano de estudos personalizado por tempo disponível
- Plano Pro com relatórios detalhados
- App nativo iOS ou PWA aprimorada

### Fase 4 — Escala

- B2B: vender para escolas e cursinhos
- API para terceiros gerarem questões
- Concursos públicos como vertical separada

---

## Decisões de Design

### Cronômetro crescente (não decrescente)
O tempo por questão é **contado pra cima**, não pra baixo. Motivo: cronômetro decrescente cria ansiedade e prejudica o aprendizado — o aluno foca no tempo, não no conteúdo.

**Como funciona:**
- Durante a questão: `⏱ 00:42` (sobe silenciosamente)
- No resultado da lição: mostra tempo médio e compara com tentativas anteriores
- No perfil: gráfico de evolução do tempo médio por tópico

**Gamificação de superação pessoal:**
```
  Seu tempo médio nessa lição: 38s/questão
  Seu recorde anterior:        45s/questão
  🏆 Novo recorde! -7s mais rápido
```

**Painel de progresso por tópico:**
```
  Funções            ▓▓▓░░  38s  ↓ melhorando
  Logaritmos         ▓▓▓▓▓  72s  → estável
  Equações 1º grau   ▓▓░░░  24s  ✅ dominado
```

> Tempo baixo = conteúdo internalizado, não só memorizado. É uma métrica de confiança real.

---

## Wireframes das Telas Principais

### Tela 1 — Landing Page
```
┌──────────────────────────────────────┐
│  [LOGO] Castelei           [Entrar]  │
├──────────────────────────────────────┤
│   Aprenda do jeito que cai           │
│   na prova.                          │
│                                      │
│   [ Começar grátis ]                 │
│   [ Ver planos ]                     │
│                                      │
│  ✓ Vestibulares  ✓ Concursos         │
│  ✓ Certificações  ✓ Idiomas e +     │
│  "Não só o conteúdo — o jeito certo" │
└──────────────────────────────────────┘
```

### Tela 2 — Cadastro / Login
```
┌──────────────────────────────────────┐
│  [←]         Criar conta             │
├──────────────────────────────────────┤
│   Nome completo  [________________]  │
│   E-mail         [________________]  │
│   Senha          [________________]  │
│                                      │
│          [ Criar conta ]             │
│          ─────── ou ───────          │
│       [ G  Entrar com Google ]       │
│                                      │
│        Já tem conta? Entrar          │
└──────────────────────────────────────┘
```

### Tela 3 — Dashboard do Aluno
```
┌──────────────────────────────────────┐
│  Oi, Miqueias!           [🔔] [👤]  │
│  🔥 Streak: 7 dias   ⭐ XP: 1.240   │
├──────────────────────────────────────┤
│  Continue de onde parou              │
│  ┌─────────────────────────────┐     │
│  │ Matemática — Funções  72% ▓▓░│    │
│  │           [ Continuar ]     │     │
│  └─────────────────────────────┘     │
│                                      │
│  Explorar módulos                    │
│  [ ENEM ] [Concurs.] [Idiomas]      │
│  [Certif.] [ Saúde ] [  +  ]        │
│                                      │
│  [Início]  [Progresso]  [Perfil]     │
└──────────────────────────────────────┘
```

### Tela 4 — Seleção de Lição
```
┌──────────────────────────────────────┐
│  [←]         Matemática              │
├──────────────────────────────────────┤
│  Módulo 1 — Álgebra                  │
│  ✅ 1. Equações do 1º grau           │
│  ✅ 2. Equações do 2º grau           │
│  🔓 3. Funções                  →    │
│  🔒 4. Logaritmos          [Plus]    │
│  🔒 5. Progressões         [Plus]    │
│                                      │
│  Plano grátis: 1 módulo rotativo     │
│     [ Desbloquear tudo — Plus ]      │
└──────────────────────────────────────┘
```

### Tela 5 — Questão (coração do app)
```
┌──────────────────────────────────────┐
│  [←]  Funções        ████░░ 3/5     │
├──────────────────────────────────────┤
│  💡 MODO PROVA                       │
│  "Como essa questão cai na prova"    │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ (ENEM 2019) Considere f(x) =  │  │
│  │ 2x + 1. O valor de f(3) é:    │  │
│  └────────────────────────────────┘  │
│                                      │
│  ( ) A) 5   ( ) B) 6   ( ) C) 7     │
│  ( ) D) 8   ( ) E) 9                 │
│                                      │
│         [ CONFIRMAR RESPOSTA ]       │
│  ⏱ 00:42                   [Pular]  │
└──────────────────────────────────────┘
```

### Tela 6 — Feedback da Resposta
```
┌──────────────────────────────────────┐
│         ✅ ACERTOU! +20 XP           │
├──────────────────────────────────────┤
│  Gabarito: C) 7                      │
│                                      │
│  Por que é C?                        │
│  f(x) = 2x + 1                       │
│  f(3) = 2(3) + 1 = 6 + 1 = 7        │
│                                      │
│  ⚠️ Pegadinha clássica               │
│  Muita gente esquece o +1 e marca B  │
│                                      │
│  Apareceu 3x no ENEM (2017-2023)     │
│         [ PRÓXIMA QUESTÃO ]          │
└──────────────────────────────────────┘
```

### Tela 7 — Resultado da Lição
```
┌──────────────────────────────────────┐
│         Lição concluída!             │
│         4 de 5 corretas — 80%        │
│         ████████████████░░░░         │
│  +80 XP   🔥 Streak mantido!         │
│                                      │
│  Tempo médio: 38s/questão            │
│  Recorde anterior: 45s  🏆 -7s!      │
│                                      │
│  Ponto fraco: f(x) composta          │
│  [ Revisar ] [ Agora não ]           │
│                                      │
│  [ Próxima lição ] [ Ir ao início ]  │
└──────────────────────────────────────┘
```

---

## Diferenciais Adicionais a Explorar

- **"Por que errei?"** — explicação do erro imediatamente após a resposta, não só o gabarito
- **Histórico de bancas** — "essa pegadinha apareceu 4x no ENEM nos últimos 10 anos"
- **Modo Batalha** — desafio contra outro usuário em tempo real (alto potencial viral)
- **Resumo em 60 segundos** — antes das questões, um resumo ultra-curto do conceito

---

## Guia Editorial de Conteúdo

A qualidade do conteúdo é o coração do Castelei. O maior risco na produção de material didático é a **"maldição do conhecimento"**: quem sabe explica assumindo que o outro já conhece os termos básicos. Isso é o exato problema que o app se propõe a resolver — e não pode acontecer dentro dele.

### Regra-mãe

> Escreva como se o leitor soubesse ler, mas nunca tivesse visto o assunto na vida.

### Regras práticas para produção de conteúdo

- **Nunca cite um termo sem explicar** — se vai usar "equação de segundo grau", antes diz em uma linha o que é. Mesmo que pareça óbvio.
- **Proibido "como vimos anteriormente"** — cada lição deve ser autocontida. O aluno pode ter pulado a anterior, esquecido ou entrado diretamente.
- **Teste mental da avó** — antes de aprovar qualquer explicação, pergunte: uma pessoa sem nenhuma bagagem do assunto entenderia? Se não, simplifica mais uma camada.
- **Analogia antes de definição** — primeiro uma comparação com algo do cotidiano, depois a definição técnica. Exemplo: *"Pense no logaritmo como o inverso da potenciação, igual à divisão ser o inverso da multiplicação — só então: log₂(8) = 3 significa '2 elevado a que potência dá 8?'"*
- **Vocabulário de banca só na camada "Como cai na prova"** — na camada de Explicação Humana, linguagem completamente informal e acessível. O jargão formal aparece apenas quando estamos ensinando *como a prova vai perguntar*.
- **Frases curtas** — se uma frase tem mais de duas vírgulas, quebra em duas.
- **Concreto antes de abstrato** — começa com um exemplo real, depois generaliza a regra.

### Como revisar o conteúdo antes de publicar

1. Leia em voz alta. Se travar, reescreve.
2. Pergunte: tem alguma palavra aqui que eu não expliquei antes de usar?
3. Pergunte: o exemplo é de algo que o aluno conhece do dia a dia?
4. Pergunte: a camada "Como cai na prova" mostra o vocabulário real da banca, sem simplificar demais?

> Esta diretriz vale para qualquer pessoa ou ferramenta que produza conteúdo para o Castelei — seja o fundador, redatores contratados ou geração via IA.

---

## Funcionalidades de IA no App

Inspirado nos 20 usos mais valiosos que estudantes têm com IA (fonte: TechTudo/2026), estas funcionalidades devem ser nativas na plataforma — não como "chat livre", mas como modos estruturados de estudo:

| Funcionalidade | Descrição | Plano |
|---|---|---|
| **Explicação Simples** | IA explica o conteúdo com exemplos do dia a dia, linguagem acessível | Grátis |
| **Modo Tutor Socrático** | IA dá pistas progressivas sem entregar a resposta — o aluno chega sozinho | Plus |
| **Flashcards Gerados por IA** | Transforma qualquer lição em cards pergunta/resposta para memorização rápida | Plus |
| **Revisão Express (última hora)** | Concentra só os pontos essenciais e as pegadinhas mais comuns, em até 5 minutos | Plus |
| **Comparar Conceitos** | Tabela visual comparando conceitos parecidos que confundem (ex: célula animal vs vegetal) | Plus |
| **Mapa Mental** | Organiza o conteúdo da lição em hierarquia visual de tópicos e subtópicos | Pro |
| **Plano de Estudo Personalizado** | Distribui conteúdos por dias conforme o tempo disponível do aluno | Pro |
| **Simulado Completo com IA** | Monta avaliação misturando questões fáceis, médias e difíceis do banco | Pro |
| **Análise de Erros** | Identifica padrões nos erros do aluno e gera exercícios focados nas fraquezas | Pro |
| **Memorização Criativa** | Cria acrônimos, histórias e associações para fixar conteúdo difícil | Pro |

> Nenhuma dessas funcionalidades é "um chatbot". São modos de estudo que usam IA de forma estruturada e pedagógica, com UX controlada — não uma caixa de texto genérica.

---

## Diretrizes de Design (Mobile-First)

Baseado nas melhores práticas de apps como Duolingo, Revolut e Airbnb:

### Filosofia
Antes de desenhar qualquer tela, responder 3 perguntas:
1. O que o usuário quer fazer aqui? (reduzir fricção para isso)
2. Como essa tela deve fazer o usuário se sentir? (confiante, animado, calmo)
3. Qual é o único elemento que ele deve notar primeiro? (hierarquia visual)

### Sistema de Cores (regra 60/30/10)
- **60%** — fundo neutro (branco, cinza claro ou fundo escuro)
- **30%** — cor complementar (textos e elementos escuros)
- **10%** — cor de destaque/marca (botões de ação, ícones, indicadores)
- Variações de opacidade para hierarquia de texto: 100% títulos, 80% corpo, 60% secundário

### Tipografia
- Máximo 1 família de fonte (2 com propósito claro)
- Máximo 4 tamanhos e 2 pesos
- Fonte monoespaçada para números grandes (estatísticas, XP, tempo)
- Hierarquia por tamanho e peso — não por negrito em tudo

### Espaçamento (grade de 8 pontos)
- Todos os valores divisíveis por 8 ou 4: 8, 12, 16, 24, 32, 48, 64...
- Elementos relacionados mais próximos; grupos separados com o dobro do espaço interno
- Padding interno de cards: 24-32px

### Zona de Toque
- Todos os botões e áreas clicáveis: mínimo 44×44pt
- Ações principais sempre no terço inferior da tela (zona do polegar)
- Nunca esconder conteúdo importante atrás de banners ou taps extras

### Design Emocional (regra pico-fim)
O usuário lembra de dois momentos: o **pico** (momento mais intenso) e o **fim** (última impressão).
- Pico: acertar uma questão difícil, bater recorde, terminar a lição
- Fim: tela de resultado com celebração, progresso afirmado, nudge gentil pra voltar
- Estados de sucesso devem ser recompensadores: animação, brilho, badge, mensagem motivacional

### Anti-padrões a evitar
- Cronômetro decrescente (cria ansiedade — já decidimos usar crescente)
- Gradientes excessivos sem propósito
- Sombras puras em cinza/preto sobre fundos coloridos
- Estado vazio sem orientação (sempre mostrar uma ação, não uma tela em branco)
- CTAs fora da zona do polegar

---

## Identidade Visual — Fugindo da Cara de IA

Apps com cara de IA perdem credibilidade e parecem genéricos. O Castelei deve ter uma identidade **própria, humana e reconhecível**. Abaixo as diretrizes concretas para garantir isso.

---

### O que NÃO usar (sinais clássicos de "design de IA")

| Elemento | Problema | Alternativa |
|---|---|---|
| **Inter, Roboto, Open Sans, Lato** | São as fontes padrão geradas por IA — qualquer usuário subconsciente associa ao "chatbot" | Usar fontes com personalidade (ver abaixo) |
| **Gradientes roxo/índigo** | Assinatura visual de 90% dos produtos de IA | Azul céu sólido com accent quente |
| **3 cards arredondados enfileirados** | Layout clichê de landing page de IA | Composições assimétricas, grids variados |
| **Emojis como ícones de interface** | Emojis renderizam diferente em cada sistema e passam ar de "prompt gerado" | Usar biblioteca de ícones SVG (Lucide, Phosphor, Tabler) |
| **Sombras genéricas cinza/preto** | Denotam falta de cuidado com contexto de cor | Sombras suaves com tonalidade da própria cor do fundo |
| **Textos cheios de bullet points** | Cara de resposta de chatbot | Tipografia hierarquizada, parágrafos humanos |
| **Glassmorphism excessivo** | Virou lugar-comum em interfaces de IA | Usar com extrema moderação — só quando há propósito |

---

### Tipografia do Castelei

**Regra principal:** nunca usar as fontes que IA usa por padrão.

| Uso | Fonte recomendada | Por que |
|---|---|---|
| **Display / Títulos grandes** | [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) | Expressiva, moderna, humanizada — foge do neutro |
| **Corpo do texto** | [DM Sans](https://fonts.google.com/specimen/DM+Sans) | Limpa mas com personalidade, diferente do Inter |
| **Alternativa de corpo** | [Satoshi](https://www.fontshare.com/fonts/satoshi) | Curvas levemente quadradas, sofisticada, gratuita |
| **Números / XP / Tempo** | Fonte monoespaçada (ex: [JetBrains Mono](https://www.jetbrains.com/lp/mono/)) | Números alinhados são mais legíveis e têm ar técnico positivo |

> Máximo 2 famílias de fonte. Hierarquia criada por tamanho e peso — não por misturar fontes diferentes.

---

### Paleta de Cores — Azul Céu sem cara de IA

O azul do Castelei é o azul do céu aberto — **não** o azul corporativo escuro nem o índigo/violeta de IA.

| Papel | Tom | Hex sugerido | Observação |
|---|---|---|---|
| **Primária (60%)** | Branco off-white | `#F8F9FA` | Fundo principal — mais suave que branco puro |
| **Secundária (30%)** | Grafite | `#1C1C2E` | Textos e elementos escuros — não preto puro |
| **Accent principal (10%)** | Azul céu | `#5BABF0` | CTAs, ícones ativos, progresso — vivo mas não agressivo |
| **Accent quente** | Coral/Terracota | `#F4845F` | Streak, alertas, recordes — contraste com o azul, traz calor humano |
| **Sucesso** | Verde sage | `#52B788` | Acertos, badges — não o verde-limão genérico |
| **Erro** | Vermelho suave | `#E05C5C` | Erros — não vermelho gritante |

**Sobre gradientes:** se usar, apenas do azul céu para um azul levemente mais escuro (`#5BABF0` → `#3A8ED4`). Nunca azul para roxo — isso é assinatura de IA.

---

### Ícones — Nunca Emojis na Interface

**Regra inegociável:** emojis ficam apenas em conteúdo contextual (ex: celebração de resultado) — nunca como elemento de navegação ou ícone de categoria.

- **Biblioteca recomendada:** [Lucide Icons](https://lucide.dev/) — clean, consistente, open source
- **Alternativa:** [Phosphor Icons](https://phosphoricons.com/) — mais expressivo, com variantes filled/outline/duotone
- Usar sempre o mesmo estilo de ícone em todo o app (ou tudo outline, ou tudo filled — nunca misturar)
- Tamanho mínimo: 20×20px em contexto de corpo; 24×24px em navegação

---

### Elementos que Humanizam o Design

Baseado em pesquisa sobre o que diferencia apps com identidade real de produtos genéricos de IA:

- **Texturas sutis** — um grain leve no fundo (2-3% de opacidade) quebra o plástico digital
- **Espaço em branco intencional** — layouts que "respiram" são mais confiáveis do que telas lotadas
- **Illustrações customizadas** — estados vazios, onboarding e conquistas com ilustrações próprias (não clipart genérico)
- **Microcopy humano** — mensagens de erro, estados vazios e tooltips com linguagem real, não "ocorreu um erro inesperado"
- **Animações de propósito** — transições só onde reforçam o significado (ex: confete ao bater recorde, não ao carregar uma lista)

---

### Checklist Visual por Tela

Antes de aprovar qualquer tela do Castelei, verificar:

- [ ] Não usa Inter, Roboto ou Open Sans
- [ ] Não tem gradiente roxo/índigo
- [ ] Ícones SVG em vez de emojis na navegação e categorias
- [ ] Botões e áreas tocáveis com mínimo 44×44pt
- [ ] Hierarquia visual clara: o olho sabe onde ir primeiro
- [ ] Sombras com tonalidade da cor do fundo (não cinza puro)
- [ ] Textos em cor grafite, não preto puro
- [ ] Accent azul céu nos elementos de ação — não roxo, não índigo

---

## Metodologia de Desenvolvimento

Adotar a abordagem **TDD + subagentes** (inspirado no framework Superpowers):

- **Test-Driven Development**: escrever testes antes do código de produção
- Ciclo: RED (teste falha) → GREEN (código mínimo que passa) → REFACTOR (limpeza)
- Desenvolvimento por agentes especializados em subtarefas isoladas (ex: agente de questões, agente de gamificação)
- Revisão de código obrigatória antes de cada merge
- Branches isoladas por feature (git worktrees recomendado)

---

## Fundamentos Científicos do App

O design pedagógico da plataforma é baseado em evidências científicas consolidadas. Cada decisão de produto — de como as questões aparecem até o cronômetro crescente — tem respaldo em pesquisa real.

---

### 1. Retrieval Practice (Prática de Recuperação)

**Estudo:** *Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention*
**Autores:** Henry L. Roediger III e Jeffrey D. Karpicke
**Publicação:** *Psychological Science*, Vol. 17, No. 3, pp. 249–255 (2006)

**O que o estudo prova:**
Fazer questões sobre um conteúdo retém a informação na memória de longo prazo de forma muito superior a reler o mesmo conteúdo. No experimento: alunos que estudaram e fizeram testes (mesmo sem feedback) lembraram significativamente mais do conteúdo **1 semana depois** do que os que apenas releram o material repetidas vezes. Os alunos que só releram, curiosamente, superestimaram seu próprio aprendizado.

**Como isso justifica nossas decisões:**
- O núcleo do app são **questões**, não aulas expositivas — isso não é uma escolha arbitrária, é a abordagem mais eficaz comprovada cientificamente
- Refazer questões de lições anteriores é ainda mais valioso do que a primeira vez
- A seção "Como cai na prova" funciona como ativação de memória ativa, não leitura passiva

---

### 2. Organização Visual e Hierarquia (UX/UI na Educação)

**Instituição:** Nielsen Norman Group (NN/g)
**Pesquisas:** *F-Shaped Pattern for Reading Web Content* (2006, replicado em 2017) e *Text Scanning Patterns: Eyetracking Evidence*
**Metodologia:** Rastreamento ocular (eyetracking) de 232 participantes em milhares de páginas web

**O que a pesquisa prova:**
Na ausência de boa hierarquia visual, usuários leem na forma de um **F**: leem a primeira linha completa, depois uma segunda linha mais curta, e então apenas escaneiam verticalmente o lado esquerdo — com atenção decrescente. Espaços em branco, divisão em blocos curtos e subheadings quebram esse padrão e aumentam a retenção do conteúdo.

**Como isso justifica nossas decisões:**
- Questões em blocos isolados, não parágrafos densos
- Alternativas com espaçamento generoso (grade de 8pt)
- Informação mais importante (enunciado e alternativas) sempre no topo e à esquerda
- Explicação do gabarito em bloco visual separado — não embutida no texto corrido
- Interface limpa, sem distrações na tela de questão

---

### 3. Cognitive Load Theory e Microlearning (Carga Cognitiva)

**Teoria base:** *Cognitive Load Theory* — John Sweller (1988)
**Estudo prático:** *The effectiveness of microlearning to improve students' learning ability* — Mohammed et al. (2015)

**O que a teoria prova:**
A memória de trabalho humana tem capacidade limitada. Quando uma interface ou conteúdo sobrecarrega esse sistema (muita informação de uma vez, design poluído, múltiplas tarefas simultâneas), o aprendizado falha — não por falta de esforço do aluno, mas por limitação cognitiva. Fragmentar o conteúdo em **pílulas curtas (microlearning)** e usar interfaces sem distrações reduz a carga cognitiva e melhora a retenção.

**Como isso justifica nossas decisões:**
- Lições curtas, com 5 a 30 questões — nunca maratonas exaustivas
- Resumo em 60 segundos antes de cada lição (ativa o schema sem sobrecarregar)
- Uma questão por tela — nunca listagem densa
- Feedback imediato após cada resposta — não acumular erros pra mostrar no final
- Modo Revisão Express para o estado de "última hora", onde a carga cognitiva disponível é baixa

---

### 4. Dual Coding Theory (Dupla Codificação)

**Teoria:** *Dual Coding Theory* — Allan Paivio (1971, com extensões em décadas seguintes)

**O que a teoria prova:**
O cérebro processa informação verbal e visual em canais **separados e independentes**. Quando um conteúdo ativa os dois canais simultaneamente (texto + imagem/diagrama/infográfico), a probabilidade de retenção **dobra** — porque a memória é armazenada em dois locais funcionais distintos. Se um ativa o outro na hora da recuperação, a lembrança é mais rápida e confiável.

**Como isso justifica nossas decisões:**
- Usar diagramas, tabelas visuais e infográficos junto das explicações textuais — especialmente nas explicações do gabarito
- A funcionalidade de **Mapa Mental (IA)** é uma aplicação direta da Dupla Codificação
- Tabelas comparativas de conceitos (funcionalidade "Comparar Conceitos") ativam ambos os canais
- Flashcards com imagem + texto são mais eficazes que flashcards só textuais

---

### 5. Curva do Esquecimento e Repetição Espaçada

**Base:** Hermann Ebbinghaus (1885) — *Über das Gedächtnis*
**Replicação moderna:** Murre & Dros (2015) — confirmação da curva em condições modernas
**Meta-análise:** *Psychological Bulletin* — efeito da repetição espaçada entre faixas etárias e domínios de conteúdo

**O que a pesquisa prova:**
Sem revisão, humanos perdem ~50% de uma nova informação em 24 horas e ~80% em uma semana. Mas cada revisão no momento certo ("logo antes de esquecer") **achata a curva** progressivamente. Meta-análises mostram que a repetição espaçada produz em média **20% mais retenção** do que o estudo concentrado no mesmo tempo total. Duolingo, Anki e Memrise são construídos sobre esse princípio.

**Como isso justifica nossas decisões:**
- Sistema de **revisão programada**: após completar uma lição, o app agenda revisões no dia seguinte, depois em 3 dias, 7 dias, 14 dias — invisível para o usuário, mas presente na lógica do backend
- O **streak diário** não é apenas gamificação — é um mecanismo de repetição espaçada disfarçado de hábito
- O relatório de "tempo médio por tópico" também serve como indicador de consolidação: tempo baixo e consistente = conteúdo ancorado na memória de longo prazo

---

> **Crédito e transparência:** Futuramente, o app pode exibir uma seção "Por que funciona?" explicando a base científica por trás de cada funcionalidade. Isso gera confiança e diferencia a plataforma de apps genéricos de quiz.

---

## Próximos Passos Sugeridos

- [x] Definir nome da plataforma — **Castelei** ✅
- [ ] Escolher 2 matérias piloto para o MVP
- [x] Criar protótipo de tela (wireframe)
- [ ] Modelar o banco de dados (questões, usuários, planos, progresso, tempo por tópico)
- [ ] Definir formato das questões (alternativas, verdadeiro/falso, dissertativa?)
- [ ] Avaliar ferramentas de geração/curadoria de conteúdo
- [ ] Priorizar quais funcionalidades de IA entram no MVP
- [ ] Definir paleta de cores e identidade visual (seguindo diretrizes mobile-first)
- [ ] Criar protótipo navegável (Figma ou HTML/Tailwind)
