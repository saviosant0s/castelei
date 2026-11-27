# Próximos passos (briefing, ainda não começado)

Combinado com o Sávio em outubro de 2026. **Nada daqui foi implementado.** É o
briefing para começar quando ele pedir, na ordem abaixo.

## O próximo: o pacote Adobe (pedido do Sávio, novembro de 2026)

**É a próxima coisa a fazer.** Nas palavras dele: "as próximas coisas que a
gente vai fazer é com relação a isso". Ficou só anotado porque, no dia do
pedido, ele estava sem limite de uso para escrever as lições.

O pedido:

- Ele vai comprar um PC e ter todos os aplicativos da Adobe. Quer aprender
  principalmente **Illustrator e After Effects**. Photoshop ele já sabe um
  pouco, mas pode ter a matéria também.
- **Aprender fazendo, com um objetivo.** O tutorial do YouTube ensina "como
  fazer tal coisa", mas na hora real ele não vê onde usar aquilo. Então a
  teoria termina numa **tarefa prática com propósito**: "crie um logo para
  tal coisa".
- **A dificuldade sobe aos poucos.** No começo ele não sabe mexer em nada no
  Illustrator, e a primeira tarefa tem que ser fácil.
- Sem pressa: ele sabe que leva tempo.

A proposta (confirmar com ele antes de escrever):

- **Uma matéria por programa**, num grupo novo de Informática, "Pacote Adobe"
  (`area_groups`). Cada programa tem uma lógica: o Illustrator desenha com
  pontos e curvas, o Photoshop pinta pixels, o After Effects anima no tempo.
  A ordem: Illustrator, After Effects, Photoshop (para fechar as lacunas de
  quem já mexe) e, se ele quiser, Premiere e InDesign depois.
- **Cada módulo termina num projeto**, com o briefing de um cliente inventado:
  o que entregar, as restrições (duas cores, funcionar em preto e branco,
  legível pequeno) e a lista de conferência. Os projetos sobem de nível e
  conversam entre si. Um rascunho:
  - Illustrator: o ícone de um app com formas simples; ícones de nuvem e de
    cadeado, juntando e cortando formas; contornar um desenho com a Caneta;
    um cartão de visita com texto; o **logo de uma padaria do bairro**,
    colorido e em preto e branco; uma estampa de camiseta, exportada para a
    web e para impressão.
  - After Effects: um texto que entra na tela; o movimento com aceleração;
    uma vinheta de cinco segundos; e **animar o logo da padaria** feito no
    Illustrator. Usar o que ele mesmo fez é o que dá sentido ao exercício.
- **O formato da tarefa prática ainda não existe.** Alternativa, ordenar,
  ligar e certo ou errado não cobrem "faça um logo". O mais perto é a escrita:
  roteiro antes, autoavaliação depois, e a parte conta como cumprida quando
  todos os critérios são marcados. Um formato de **projeto** seguiria esse
  molde: briefing, critérios, a pessoa faz no programa, volta e se avalia.
  Mandar a imagem exportada para a IA corrigir é possível, mas custa por uso,
  como a correção da escrita: decidir com ele, com limite por dia e só no Pro.
- **Questões continuam onde cabem.** Qual ferramenta faz o quê e qual atalho
  usar cabem em alternativa e em ligar os pares; o passo a passo de uma
  técnica cabe em ordenar.
- **O atalho diz o sistema** (regra 3): Ctrl no Windows, Cmd no Mac.
- **A interface muda todo ano**, e a Adobe vem pondo IA (Firefly) em tudo.
  Ensinar a lógica e escrever a versão com o ano, como Montar um PC faz com os
  modelos de peça.
- **Figuras nossas.** Captura de tela da Adobe é obra da Adobe. O esquema da
  interface, as curvas e as camadas são desenhados por nós (regra 6).
- **"Vetor" muda de sentido.** Na Álgebra Linear é a seta com tamanho e
  direção; no Illustrator é o desenho feito de pontos e curvas. O escopo novo
  do verificador define o sentido dele.
- **Quem vê:** nasceu para ele, então pela regra do lançamento fica exclusiva
  do Pro, como Montar um PC, a não ser que ele queira abrir.

## A ideia central: o gerador de cursos

O Castelei como um "NotebookLM que ensina". A pessoa pesquisa um assunto (ou
envia o próprio material), escolhe as fontes, e o app monta o curso inteiro —
trilha, lições em etapas, questões no Modo Prova, vocabulário, revisão — com a
cara e a régua editorial dos cursos escritos à mão.

Por que é diferente do NotebookLM: ele resume; o Castelei **ensina**. Etapas
curtas, termo explicado antes de ser usado, figura e tabela no lugar de
paredão, pegadinha, prática no formato da prova, revisão marcada pela data da
prova. E a interface é feita para estudar.

Por dentro, o caminho já existe: o gerador produz o mesmo JSON que o painel
importa, e ele passa pelo mesmo `ContentValidator`. O JSON nunca aparece para
o aluno.

### Fluxo

1. Pesquisar um tema na web **ou** enviar PDF/slide.
2. Escolher as fontes (marcar quais entram).
3. A IA propõe o **sumário** (módulos e lições). A pessoa edita e aprova.
   O sumário custa centavos e evita gastar o curso inteiro na direção errada.
4. Gera as lições. Uma segunda passada confere cada gabarito contra a fonte.
5. Publica como curso **da pessoa** (privado; compartilhar é escolha dela).

### Riscos que precisam de resposta antes

- **Gabarito errado ensina o erro.** Gerar só a partir das fontes escolhidas,
  mostrar de qual fonte veio cada etapa, conferir os gabaritos numa segunda
  passada, e botão "esta questão está errada".
- **Curso de quem?** Hoje toda matéria é pública. Curso gerado precisa de dono
  (`subjects` ganha `owner_id`) e fica fora do catálogo público.
- **Citar a fonte.** Nas lições que nós escrevemos, nunca se cita fonte (regra
  1). No curso gerado é o contrário: a fonte à vista é o que dá confiança. As
  duas regras convivem, cada uma no seu tipo de curso.
- **Demora.** Um curso leva minutos. O Railway do Sávio é o **plano grátis**,
  que já esbarrou no limite de serviços (ver lembretes no CLAUDE.md), então um
  serviço extra de fila provavelmente não cabe. Saída sem serviço novo: a
  própria tela pede uma lição por vez ("montando a lição 3 de 12"), cada pedido
  levando menos de um minuto.

### Custo estimado (Sonnet 5.5, preços de outubro de 2026)

Medido nos cursos atuais: uma lição completa tem uns 8 mil caracteres.

| O que gerar | Custo aproximado |
|---|---|
| 1 lição a partir de um slide/PDF | ~US$ 0,15 |
| Curso de 15 lições a partir de pesquisa | ~US$ 2 |
| O mesmo curso com Opus 5.5 | ~US$ 4 |

Fora da tabela: a taxa por busca na web (centavos por curso; conferir o preço).
O número de verdade sai da primeira geração real — medir os tokens antes de
fixar preço.

### Preço para quem usa (ideia do Sávio, com um ajuste)

A ideia do Sávio: o preço cresce com o tamanho do curso — número de fontes, de
lições na trilha e de questões. Faz sentido, porque o custo cresce exatamente
assim.

O ajuste sugerido: **créditos**, em vez de uma tabela com quatro eixos. Quem
compra não entende "fontes × lições × questões", mas entende um número só:

- cada plano dá X créditos por mês;
- antes de gerar, a tela diz quanto vai gastar ("este curso usa 12 créditos")
  — é o mesmo cálculo de fontes, lições e questões, só que mostrado como um
  número;
- crédito avulso para quem quiser mais; no Google Play isso é produto
  consumível, ao lado da assinatura (ver `play-store.md`);
- só cobra depois do sumário aprovado, e geração que falhar devolve o crédito
  (o mesmo acordo da correção por IA).

Gerar pode **não ter grátis**, como o Sávio sugeriu. Uma alternativa a pesar:
um curso pequeno de amostra para cada conta nova, para a pessoa ver o valor
antes de assinar.

Atenção: isso muda o corte grátis × pago já decidido (hoje o Pro tem só o
simulado e os níveis de dificuldade). A decisão é do Sávio.

### Compartilhar curso (decidido pelo Sávio)

Curso gerado nasce privado. O que ficou decidido:

- **Compartilhar por link ou e-mail: GRÁTIS.** A pessoa convidada estuda o
  curso com o próprio progresso. Não custa nada para nós (ninguém gera nada
  de novo) e cada curso compartilhado traz gente nova para o app.
- **Turma: PAGO. A primeira versão está feita** (novembro de 2026, ver “Turmas para professor” no `CLAUDE.md`): turma de uma matéria pública, convite por código e link, e a tela de desempenho. Falta a turma de curso gerado, que depende do dono do curso.
  O briefing original: Hoje o sistema não tem nada disso.
  Quem cria compartilha com uma turma e acompanha o desempenho dela: quem já
  estudou, em que lição a turma erra mais, quem está atrasado para a prova. O
  público natural é o professor que gera o curso dos próprios slides. Peças
  novas: tabela de turmas, membros (convite por link ou e-mail), papel de dono
  e de aluno, e a tela de desempenho da turma — que reaproveita as contas que
  o `/progresso` já faz, agrupadas por turma em vez de por pessoa.
- **Vender o curso** (loja, com repasse a quem criou): fica para muito depois
  — repasse de dinheiro, imposto e a regra do Google Play para conteúdo
  digital vendido dentro do app.

Cuidado em todas: curso gerado de fontes da web, quando passa a ser
compartilhado, aumenta o risco de direito autoral. Por isso é por link ou
turma, nunca catálogo público sem revisão.

### Preço com lucro (lembrete do Sávio)

Créditos estão decididos. O preço de cada crédito não pode cobrir só o custo
da IA, senão não sobra nada. A conta por trás tem que somar:

- o custo da IA (medido na primeira geração real, não estimado);
- a taxa do Google Play, que fica com uma parte de cada venda (conferir a taxa
  em vigor quando for publicar);
- o imposto, que depende de como o Sávio vai emitir (MEI, Simples…);
- a margem de lucro.

Fórmula de partida: **preço = custo da IA × margem ÷ (1 − taxa da loja −
imposto)**. Exemplo só para ver a ordem de grandeza (taxas a confirmar): um
curso que custa R$ 12 de IA, com margem de 2×, loja de 15% e imposto de 6%,
sai por volta de R$ 30.

A favor da margem: créditos de assinatura que não são usados no mês também
viram lucro. Contra: a primeira geração pode sair mais cara que o estimado, e
por isso o preço só se fixa depois de medir.

## Estatísticas que importam (refazer `/progresso`) — FEITO

Feito em outubro de 2026: ver `StatsController` e a seção do Progresso no
`CLAUDE.md`. Ficou por lição, e não por tópico, porque o tópico é quase sempre
uma questão só.

Queixa do Sávio: a aba de estatística está fraca, com gráficos que não ajudam
quem estuda. O que entra:

- **Estou pronto para a prova?** Quanto da matéria já está dominado contra os
  dias que faltam. Só o Castelei sabe a data da prova.
- **Onde eu erro.** Os assuntos mais fracos, e se estão melhorando ou piorando.
- **O que estou esquecendo.** Acerto na revisão comparado com o acerto da
  primeira vez — mostra se a revisão espaçada está funcionando.
- **Mapa da matéria.** Todas as lições num quadro, uma cor por nível de
  domínio, para ver os buracos de relance.

O que não ajuda a decidir o que estudar (tempo médio, XP acumulado) sai ou vai
para o fundo.

## Vídeo de apresentação

O Sávio quer um vídeo do Castelei com roteiro para ele narrar por cima. Fica
para depois das estatísticas e do "do slide à lição", porque aí o vídeo mostra
o diferencial de verdade.

## Defeitos conhecidos (corrigir quando o Sávio pedir)

- ~~Questão de pôr na ordem "muda a resposta".~~ **Resolvido.** O servidor
  conferia certo; a tela de depois mostrava SÓ a ordem certa, e quem errava
  lia aquilo como a própria resposta trocada. Agora aparece "Sua ordem",
  passo a passo, e a ordem certa embaixo (`OrderQuestion`, `Gabarito`).

## Ordem combinada

Antes de tudo, **o pacote Adobe** (seção no topo). As matérias novas da trilha
de perito esperam as decisões do Sávio, listadas em `docs/trilha-perito.md`.

1. ~~Refazer as estatísticas.~~ Feito.
2. "Do slide à lição", só para admin. Usa o que já existe; o Sávio testa no
   próprio semestre (ele já manda o slide de cada aula).
3. Abrir a geração para os alunos: pesquisa na web, curso privado, sumário
   aprovado, créditos.
4. Vídeo de apresentação com roteiro.
