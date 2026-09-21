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
- **Uma tela responde uma pergunta.** Quando uma tela começa a acumular
  assuntos, ela vira abas de rota — ver `components/ProgressTabs.tsx`. Cada aba
  é uma rota de verdade, então o botão "voltar" do Android funciona e o link
  pode ser compartilhado. Cada seção com abas ganha seu próprio `loading.tsx`,
  senão o cabeçalho pisca a cada toque.

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
   carregar lista, não. Tudo dentro de `prefers-reduced-motion`.
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
