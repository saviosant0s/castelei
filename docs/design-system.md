# Design system do Castelei

Guia de quem vai mexer na interface. O porquê de cada escolha está em
`docs/planejamento.md`, na seção **Identidade Visual — Fugindo da Cara de IA**.

## A decisão de fundo: o sistema é nosso

O Castelei **não usa uma biblioteca de design de terceiros como base visual**.
Não é preciosismo: é o único jeito de ter identidade própria. Carbon traz a cara
da IBM, Primer a do GitHub, e o visual padrão do shadcn/ui virou justamente a
aparência dos apps gerados por IA — o oposto do que o app quer.

O Atlassian Design System foi avaliado e **descartado por licença**. O texto em
https://atlassian.design/license concede uso apenas em conexão com produtos que
"interoperate or are integrated with Atlassian's software and cloud products",
e proíbe obras derivadas. O Castelei é independente e comercial, então não cabe.

Quando um componente precisar de comportamento difícil de acertar sozinho
(diálogo, menu, combobox, deslizador), a peça **sem visual** vem do
[Radix UI](https://www.radix-ui.com/) (MIT) e a aparência continua sendo esta
daqui. Até hoje nenhuma tela precisou — não instale antes de precisar.

## As duas camadas de cor

Elas ficam em `frontend/src/app/globals.css`, e a ordem importa.

**A rampa** diz *o que a cor é*. Só o design system fala essa língua.

| Token | Valor | Papel na marca |
|---|---|---|
| `paper` | `#f8f9fa` | branco quebrado, mais suave que branco puro |
| `paper-2` | `#eef1f5` | cinza de cavidade |
| `ink` | `#1c1c2e` | grafite; **nunca preto puro** |
| `sky` | `#5babf0` | azul céu — a cor de ação |
| `coral` | `#f4845f` | calor humano: streak, recorde |
| `sage` | `#52b788` | acerto |
| `brick` | `#c93b3b` | erro, sem gritar |

**Os papéis** dizem *o que a cor faz*. É isso que as telas usam.

| Token | Quando usar |
|---|---|
| `bg-surface` | fundo da página |
| `bg-surface-raised` | cartão que sobe da página |
| `bg-surface-sunken` | cavidade: campo, selo, degrau |
| `bg-surface-bold` | bloco escuro de destaque |
| `text-content` | texto principal |
| `text-content-secondary` | apoio, descrição |
| `text-content-subtle` | rótulo, metadado |
| `text-content-faint` | ícone decorativo, seta |
| `on-bold-secondary` / `on-bold-subtle` | os mesmos níveis sobre fundo escuro |

Trocar a marca vira trocar a rampa: os papéis seguem junto e nenhuma tela
precisa ser reescrita.

**Regra:** tela nunca escreve `text-ink/60`. Pede o papel. A hierarquia é
decidida num lugar só, em vez de a olho em cada arquivo.

*(Na prática a regra não foi seguida à risca, e o modo escuro conviveu com
isso: ver "A rampa inverte", abaixo. Mas continue pedindo o papel — quem
escreve `bg-white` em vez de `bg-surface-raised` fura os dois temas.)*

## Escala de raio

O arredondamento é assinatura visual, então é escala e não improviso:
`rounded-control` (botão, campo) · `rounded-card` (cartão) ·
`rounded-panel` (painel grande) · `rounded-pill` (selo, barra).

## Os componentes

Ficam em `frontend/src/components/ui/`, com testes em `ui.test.tsx`.

| Componente | Para quê |
|---|---|
| `Card` | a superfície básica. `tone` escolhe o peso, `href` transforma em link |
| `Callout` | aviso de uma linha com ícone; o `role` decide o tom |
| `Pill` | selo curto: streak, XP, plano. Número sempre em monoespaçada |
| `Stat` | número em destaque com o que ele significa |
| `ProgressBar` | barra de progresso, sempre com o número em texto junto |
| `ListRow` | linha de lista navegável, área de toque bem acima do mínimo |
| `EmptyState` | tela vazia que sempre oferece uma saída |
| `SettingsGroup`, `SettingsRow`, `Switch` | lista de ajustes: grupo com título curto, uma linha por ajuste, interruptor de liga-desliga |

### Tons do `Card`

`raised` (padrão) · `bold` · `sky` · `coral` · `sage` · `sunken` · `outline` ·
`dashed`. O tracejado significa sempre a mesma coisa: **existe, mas ainda não é
seu** (recurso de outro plano).

Escolha o tom pelo peso do conteúdo, nunca por variedade. Os tons existem para
o app não virar uma fileira de caixas brancas iguais — o plano trata "3 cards
arredondados enfileirados" como cara de IA.

**Não passe cor por `className`.** No Tailwind, quem vence entre duas classes de
mesma especificidade é a ordem no CSS gerado, não a ordem no atributo: um
`className="bg-sky-soft"` sobre o tom padrão às vezes vence e às vezes não.
Use `tone`.

## Cara de app, não de site

O alvo é a Play Store: o app tem que parecer app, não página aberta no
navegador. O que sustenta isso hoje:

- **Abertura contínua** (`components/AppLaunch.tsx`). O Android mostra a tela
  do manifesto (fundo + ícone) e entrega a página — e é aí que aparece o
  branco vazio. Esta camada repete a mesma composição e sai animada, então a
  marca não pisca. É CSS puro: não depende de hidratação e nunca captura
  toque. Só existe dentro do app instalado (`display-mode: standalone`).
- **Nada de seleção de texto na moldura.** Segurar o dedo e ver a seleção azul
  na navegação ou num título entrega o site na hora. Navegação, botões e
  títulos não são selecionáveis; o texto das lições continua sendo, porque
  copiar um trecho é legítimo.
- **Atalhos no manifesto.** Segurar o ícone na tela inicial abre "Continuar
  estudando" e "Meu progresso", como em app nativo.
- **A lição lembra onde você parou.** `lib/lesson-progress.ts` guarda a etapa
  no `localStorage` e `LessonStepper` devolve a pessoa a ela — com aviso na
  tela e saída para recomeçar, porque abrir a lição no meio sem explicação
  desorienta. Na trilha da matéria isso vira "parou na etapa 4 de 11"
  (`components/trail/TrailResume.tsx`). É conveniência de leitura, não dado de
  estudo: o que conta para progresso são as questões, e isso vive no servidor.
  Vale por aparelho, e a marca é ignorada se a lição mudar de tamanho.
- **A matéria é uma trilha, não uma lista** (`components/trail/`, com a
  matemática em `lib/lesson-trail.ts`). As lições se agrupam em módulos, cada
  um com barra de progresso, e dentro do módulo viram nós numa onda vertical.
  **O módulo escolhe a cor, o estado escolhe a forma**, e essa separação é o
  coração da tela: cada módulo recebe sky, sage ou coral em rodízio pela
  ordem, então cor diz *em que trecho da matéria você está*, não *como você
  está*. Quem carrega o estado é o ícone de certo (concluída), o anel que
  pulsa com o selo "Agora" (atual) e o cinza-cavidade (a que falta) — e o
  estado entra no rótulo acessível de todo nó. `brick` fica de fora do
  rodízio: vermelho no app quer dizer erro.

  A que falta **continua clicável**: o cinza orienta, não tranca, porque
  revisar fora de ordem é uso legítimo num app que acompanha um semestre.

  Três coisas dão a vida que a primeira versão não tinha, e nenhuma delas
  encosta no fundo da página:

  - **O nó é uma tecla.** Degrau de sombra sólida embaixo (raio zero:
    desfoque vira "flutuando", sólido vira "apoiado"), e ao tocar o nó desce
    a altura exata do degrau. As cores `--color-*-deep` existem só para isso.
  - **Cada módulo fecha num marco** (`TrailMilestone`, uma bandeira), que só acende
    completo. "Faltam 22 lições" não move ninguém; "falta 1 para fechar
    Threads" move. Não é link de propósito — não há para onde ir.
  - **Estrelas no nó concluído**, e elas **não cobram nota**: terminar já
    vale uma, sempre. A segunda e a terceira dependem do acerto. O convite é
    voltar e melhorar, nunca dizer que não acabou.

  **O título fica ao lado do nó, no lado largo**, e a onda nunca passa pelo
  eixo para o título nunca ficar espremido. Embaixo do nó, em letra miúda,
  ele custava 164px por lição e era a coisa menos legível da tela. A linha
  inteira é o link.

  Dois detalhes que não são enfeite. A onda é medida em **porcentagem da
  largura**, e o traço que liga os nós é um SVG com `preserveAspectRatio="none"`
  e `vector-effect="non-scaling-stroke"`: assim o desenho acompanha qualquer
  tela sem engrossar a linha. E o título da lição é uma **plaquinha
  levantada** (`bg-surface-raised` com sombra): o traço passa por trás dela.
  Antes o título se disfarçava de fundo, repetindo cor e grão para tapar o
  traço — o que só funcionava enquanto o fundo fosse liso. A plaquinha é mais
  honesta e não depende de nada: continuou certa quando o fundo ganhou
  textura, e continuou certa quando ele voltou a ser liso.
- **Uma tela responde uma pergunta.** Quando uma tela começa a acumular
  assuntos, ela vira abas de rota — ver `components/ProgressTabs.tsx`. Cada aba
  é uma rota de verdade, então o botão "voltar" do Android funciona e o link
  pode ser compartilhado. Cada seção com abas ganha seu próprio `loading.tsx`,
  senão o cabeçalho pisca a cada toque.

## Site público × app

São duas molduras diferentes, de propósito, e elas moram em grupos de rota
separados.

- **`src/app/(site)/`** é o site de divulgação: `/`, `/como-funciona`,
  `/materias`, `/privacidade` e `/excluir-conta`. Tem cabeçalho fixo com
  navegação (`components/site/SiteHeader.tsx`) e rodapé completo
  (`SiteFooter.tsx`). Abre sem login e é o que o Google indexa.
- **`src/app/(app)/`** é o app: barra de baixo, abas, sem cabeçalho de site.

A regra: **site parece site, app parece app.** Quem chega pela divulgação
espera links e rodapé; quem está estudando espera um aplicativo. Misturar as
duas molduras é o que faz um app parecer "site embrulhado".

Detalhes que valem lembrar:

- A chamada para ação nunca é escrita à mão. É `components/site/StartLink.tsx`,
  que decide sozinho entre "Começar grátis" e "Continuar estudando" — ninguém
  com conta deve receber convite para criar outra.
- O catálogo anunciado no site vive em `lib/site-content.ts`, e **não** vem da
  API: a vitrine não pode depender de o backend estar no ar. O preço da cópia
  está pago em `site-content.test.ts`, que reprova o build se o site prometer
  matéria ou lição que o conteúdo não tem.
- No celular o cabeçalho esconde os links; quem garante que toda página
  pública continue alcançável é o rodapé.
- `sitemap.ts` e `robots.ts` listam só as páginas públicas. As telas de estudo
  são bloqueadas: indexá-las só geraria resultado de busca que leva ao login.

## Modo escuro

Mora inteiro em `globals.css`. **Nenhuma tela muda** — é o que a separação
entre rampa e papel sempre prometeu, e só funciona por causa de uma escolha
que vale entender.

### A rampa inverte

No claro, `ink` é o grafite do texto e `paper` é o fundo. **No escuro os dois
trocam de lado.** Com isso, os quase cem `text-ink/70` e `border-ink/15`
espalhados pelas telas continuam certos sozinhos: viram texto claro e borda
clara sobre fundo escuro.

A alternativa seria converter todos esses usos em papéis. Seriam umas noventa
edições, com risco em cada uma, para chegar ao mesmo resultado visual.

O que a inversão **não** resolve virou papel próprio:

| Papel | Por que não dava para inverter |
|---|---|
| `surface-bold` | No claro ele se destaca por ser escuro numa página clara. No escuro isso não existe, então passa a se destacar por **elevação**: fica mais claro que a página. |
| `on-bold` | O texto em cima desse bloco. Era `text-paper`, e teria virado escuro sobre escuro. |
| `on-accent` | Texto sobre azul, verde ou coral **cheios**. Não muda entre os temas: as cores da marca são claras nos dois, então o texto sobre elas é escuro sempre. Escrito como `text-ink`, clareava junto e o botão "Confirmar" ficava ilegível. |

### Quem escolhe

Três opções em `/perfil` (`components/ThemeToggle.tsx`): Automático, Claro,
Escuro. O padrão é o automático — quem já pôs o celular no escuro não deve
precisar repetir a escolha.

A escolha vive no `localStorage`, **por aparelho**, e não vai ao servidor: é
preferência de leitura, como a retomada da lição. Dois seletores em CSS fazem
o trabalho — `@media (prefers-color-scheme: dark)` para o automático e
`:root[data-theme="dark"]` para a escolha manual. O `data-theme="light"`
existe só para uma coisa: vencer um aparelho no escuro quando a pessoa pediu
claro. Por isso o automático **apaga** o atributo em vez de escrever "auto".

O script no `<head>` (`THEME_SCRIPT`, em `lib/theme.ts`) é o único script
embutido do app. Sem ele, quem pediu escuro veria a tela clara piscar antes
da hidratação.

### O fundo é liso, e isso é decisão

Cor chapada com um grão de 3%. Nada mais.

Já teve brilho de azul-céu e malha de pontos aqui, e foi retirado: **o Sávio
olhou e dispensou o gradiente.** Antes de propor de novo, saiba que o problema
não era calibragem — houve duas rodadas de força diferente, e o veredito foi
sobre o degradê em si. Se for mexer no fundo, mexa na textura, não em degradê.

Duas coisas que ficaram da tentativa e valem guardar:

- **O topo da página é a barra de status do celular.** Com `viewport-fit=cover`
  a tela vai até embaixo dela, então qualquer cor no alto da página aparece ali.
  O brilho azul virou barra de status azul num app que deveria ser branco.
- **Se um dia algo voltar para trás do conteúdo**, a cor de fundo tem de sair
  do `body` e ficar só no `html`. Na ordem de pintura do CSS, o fundo de um
  bloco descendente vem depois dos filhos de z-index negativo: com cor no
  `body`, a camada renderiza e fica invisível, e aumentar a opacidade não
  resolve nada.

## Som

Existe em um lugar só: **acerto e erro no Modo Prova** (`lib/sound.ts`).

Os dois sons são **gerados pela Web Audio, sem arquivo de áudio**. Isso resolve
três coisas de uma vez: nada a baixar, funciona offline no PWA instalado, e o
som é nosso — sem licença de banco de efeitos e sem a cara de app genérico.

O tom foi escolhido, não sorteado:

| Som | O que é | Por quê |
|---|---|---|
| Acerto | duas notas subindo, curtas e suaves | resposta imediata, sem fanfarra |
| Erro | uma nota grave que desce um pouco | **erro se mostra sem gritar**, como a cor `brick`. Quem estuda erra o tempo todo; som humilhante faz fechar o app |

Volume em 12%, porque isso toca em sala de aula e em ônibus. E **sempre com
interruptor** (`/perfil`, ligado por padrão): som sem como desligar, num app
de estudo, é motivo para desinstalar.

Duas armadilhas de navegador estão tratadas no módulo, e vale saber que
existem antes de mexer:

- **O iPhone só libera áudio dentro de um gesto.** A resposta chega do
  servidor *depois* do toque, quando o gesto já passou — por isso
  `primeSound()` é chamada no começo do clique, antes do `await`.
- **Navegador sem Web Audio, ou com áudio bloqueado, não pode derrubar a
  prática.** Tudo falha em silêncio.

## Regras que valem para toda tela nova

1. **Ícones em SVG, nunca emoji na interface.** Emoji muda de cara em cada
   sistema e denuncia "prompt gerado". Biblioteca: Lucide. Emoji só em conteúdo
   de celebração.
2. **Área de toque mínima de 44×44.** Ação principal no terço de baixo da tela,
   onde o polegar alcança.
3. **Cor nunca é a única informação.** Todo estado tem palavra ou ícone junto —
   "Dominado", "Revisar", um cadeado.
4. **Nada de gradiente roxo ou índigo.** É a assinatura visual dos produtos de
   IA. Se usar gradiente, só de azul céu para um azul um pouco mais escuro.
5. **Sombra com a cor do fundo**, nunca cinza puro (`--shadow-lift`, `--shadow-sky`).
6. **Animação e som com propósito.** Confete ao bater recorde, sim; animação
   ao carregar lista, não. O som existe só no acerto e no erro da prática, e
   sempre com interruptor. Tudo dentro de `prefers-reduced-motion`. A única
   animação permanente é o anel da lição atual na trilha (`.trail-pulse`), que
   responde "onde eu paro?" sem obrigar a ler — e o destaque não depende dela:
   sem movimento, o anel fica lá, parado.
7. **Estado vazio sempre oferece uma ação.** Use `EmptyState`.
8. **Microcopy de gente.** "Não deu para falar com o servidor" em vez de
   "ocorreu um erro inesperado".

## O que ainda falta

Itens do plano que o sistema ainda não cobre:

- **Ilustrações próprias** para estados vazios, onboarding e conquistas. Hoje
  são ícones do Lucide — resolvem, mas não têm personalidade.
- **Textura de grão** existe só no fundo do `body`; poderia valer nos painéis
  escuros.
- **O manifesto do PWA tem uma cor só.** `theme_color` e `background_color`
  são estáticos, então a tela de abertura do Android instalado é sempre a
  clara. A barra de status já acompanha os dois temas.

## A figura fica numa folha branca, nos dois temas

As figuras do app são SVG desenhados a tinta escura (`#1C1C2E`) sobre papel:
traço de caixa, seta e texto solto usam essa mesma cor. Coladas direto no
cartão (`surface-raised`), no modo escuro só sobrevivia o que tinha
preenchimento claro por baixo — as caixas coloridas apareciam, e a borda
delas, as setas, os rótulos de eixo e as caixas sem preenchimento sumiam.

Não quebrava nada e não emitia aviso: a figura continuava lá, com metade do
desenho invisível. Apareceu olhando a lição de hardware no escuro, e não num
teste.

A saída é o token `sheet`, que **não inverte** — mesma família de `on-accent`
e `on-bold`. A imagem ganha `bg-sheet` e vira uma página impressa colada na
tela; a legenda continua no cartão, onde o texto acompanha o tema. Um teste
em `LessonStepper.test.tsx` trava isso.

Se um dia as figuras forem redesenhadas para os dois temas, o caminho é outro:
trocar as cores fixas do SVG por `currentColor` e variáveis. Enquanto forem
desenhos a tinta, a folha é a resposta certa.

## Ajustes têm cara de ajustes

O Perfil era seis seções, cada uma com um título do tamanho de um título de
página, um controle e uma frase solta embaixo. Seis títulos de igual peso não
dizem o que importa, e a tela rolava para mostrar o que cabe em meia. Agora
ele segue o desenho que a pessoa já conhece dos ajustes do celular
(`components/ui/Settings.tsx`):

- **Um grupo por assunto** (Aparência e som, Estudo, Conta), com título em
  `label-mono`, e **uma linha por ajuste** dentro dele: ícone num quadrado de
  cor suave, nome, uma frase, e o controle à direita.
- **Liga-desliga é `Switch`**, não um par de botões "Ligado | Desligado". O
  interruptor diz o estado sem palavras e cabe na linha.
- **O que é perigoso fica no fim do último grupo**, com o nome em vermelho, e
  a confirmação abre dentro da própria linha — sem pular para outra tela.

## Lista longa agrupa antes de rolar

O Resumo do Progresso tinha um cartão por tópico. Com oito lições praticadas
eram 64 cartões e dez mil pixels de rolagem — e "0/1 certas" num tópico solto
não diz nada: uma questão errada não é ponto fraco. Agora é **um cartão por
lição**, a mais fraca primeiro, e os tópicos ficam recolhidos dentro dela
(`<details>` nativo, sem JavaScript). Regra geral: quando uma lista cresce
com o uso, agrupe pelo que a pessoa reconhece (a lição) e deixe o detalhe a
um toque.
