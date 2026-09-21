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
  Três estados, e cor nunca é o único sinal de nenhum: concluída tem o ícone
  de certo, a atual tem o anel que pulsa e o selo "Agora", a que falta é lisa
  — e o estado entra no rótulo acessível de todo nó. A que falta **continua
  clicável**: o cinza orienta, não tranca, porque revisar fora de ordem é uso
  legítimo num app que acompanha um semestre.

  Dois detalhes que não são enfeite. A onda é medida em **porcentagem da
  largura**, e o traço que liga os nós é um SVG com `preserveAspectRatio="none"`
  e `vector-effect="non-scaling-stroke"`: assim o desenho acompanha qualquer
  tela sem engrossar a linha. E o título da lição carrega `.trail-mask`, que
  repete o grão do `body` — o traço passa por trás dele, e um `bg-surface`
  liso apareceria como retângulo mais claro sobre o fundo texturizado.
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
6. **Animação com propósito.** Confete ao bater recorde, sim; animação ao
   carregar lista, não. Tudo dentro de `prefers-reduced-motion`. A única
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
- **Modo escuro.** Os papéis de superfície já isolam o que precisaria mudar,
  então é trocar os valores, não caçar cor pelas telas.
- **Textura de grão** existe só no fundo do `body`; poderia valer nos painéis
  escuros.
