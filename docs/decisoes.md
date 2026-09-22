# Decisões de engenharia

Este arquivo guarda as decisões que custaram alguma coisa: o problema que as provocou,
a opção escolhida e o que se perdeu junto. Decisão sem alternativa descartada é só uma
linha de código; o que vale registrar é onde havia dois caminhos.

A ordem é da mais estrutural para a mais local.

---

## 1. O navegador nunca fala com a API

**Problema.** Um app Next com uma API Laravel separada tem duas saídas óbvias: o
JavaScript do navegador chama a API direto com o token na mão, ou o servidor do Next
faz de intermediário.

**Escolha.** O intermediário. O token do Sanctum vive num cookie `httpOnly`, e o Next
repassa só as rotas de prática (`frontend/src/lib/proxy.ts`), pondo o token no header.

**O que isso compra.** O token não fica ao alcance de nenhum script da página, então um
XSS não vira roubo de sessão. E não há CORS para configurar, porque nenhuma requisição
cruza origem.

**O que isso custa.** Toda rota nova precisa ser liberada no repasse — esquecer é um 404
silencioso. Em troca, a lista de rotas expostas é explícita e cabe numa tela.

---

## 2. A vitrine pública não pode cair junto com o backend

**Problema.** As páginas abertas (`/`, `/materias`, `/como-funciona`) anunciam o catálogo.
Se elas lessem a API sem rede de proteção, uma queda do backend deixaria o site de
divulgação fora do ar — justo a página que alguém abre pela primeira vez.

**Escolha.** Elas leem `GET /api/catalog` com prazo de 2,5 s. Qualquer falha, demora ou
resposta fora do formato cai numa lista versionada em `lib/site-content.ts`.

**A armadilha que isso criou.** Uma cópia do catálogo envelhece calada. Por isso
`site-content.test.ts` compara a lista de reserva com o conteúdo de verdade e reprova o
CI quando elas divergem. A cópia existe, mas não pode mentir.

**Detalhe que veio junto.** "8 questões por lição" deixou de ser texto fixo: a rota
devolve nulo quando o número varia entre lições, e a vitrine para de prometer em vez de
prometer errado.

---

## 3. Um único caminho de escrita de conteúdo

**Problema.** O conteúdo entra por dois lugares: o seeder que roda em todo deploy e o
painel `/admin`. Duas rotas de escrita para a mesma tabela viram duas regras diferentes
na primeira correção feita em uma só.

**Escolha.** `App\Support\Content\ContentImporter` é o único caminho. O seeder o chama, o
painel o chama, e as colunas antigas (`explanation`, `exam_style`, `pitfalls`) são
derivadas no mesmo lugar.

**O problema seguinte, que só apareceu em produção.** O seeder roda a cada deploy e
recarregaria o arquivo do repositório por cima de tudo que foi editado no painel — sem
erro e sem aviso. A solução é `subjects.origin`: a matéria guarda de onde vem, e a
primeira escrita pelo painel a passa para o painel de vez. O teste que tranca isso é
`ContentImportTest::test_o_seeder_nao_desfaz_o_que_o_painel_editou`.

---

## 4. O conteúdo tem verificador, e ele roda no CI

**Problema.** As regras editoriais existiam num documento: explique todo termo na
estreia, frases curtas, nada de "como vimos anteriormente", nenhuma citação de livro.
Regra que ninguém confere é sugestão.

**Escolha.** `scripts/lint-content.mjs` roda sobre os JSON como se fosse teste, e um
push que reprova não entra.

**O que isso mediu.** A matéria de Servidores foi escrita à mão, com cuidado. Rodada a
régua de jargão, deram **499** usos de termo técnico sem definição anterior. A régua de
código, criada depois, deu outros **205**. Nos dois casos a intuição de que "estava
difícil" estava certa, e o que faltava era alguém contar.

**A lição de método.** Toda queixa recorrente virou régua, não correção pontual. Corrigir
o texto conserta uma lição; a régua conserta a próxima.

---

## 5. O editor do painel é de blocos, não de JSON

**Problema.** O painel tinha um campo de JSON cru. A aposta era que o fluxo seria sempre
"a IA gera, a pessoa confere e publica".

**O que quebrou a aposta.** Um curso inteiro escrito à mão saiu sem uma figura, tabela
ou exemplo em lição nenhuma. O conteúdo estava certo, a tela era um paredão. O motivo é
que pôr uma figura exigia escrever JSON e escrever mais um parágrafo não exigia nada. A
ferramenta ensinou isso.

**Escolha.** Editor de blocos, com quatro regras:

- os botões de bloco ficam sempre à vista, com a frase do que cada um serve;
- um medidor mostra, enquanto se escreve, a mesma conta que o validador faz depois;
- lição nova já nasce com uma figura e uma tabela em branco — campo vazio à vista puxa
  para ser preenchido, bloco que precisa ser acrescentado é bloco que se esquece;
- o modo JSON continua ali, para quem chega com conteúdo pronto.

---

## 6. A revisão espaçada é calculada a partir da data da prova

**Problema.** SM-2 e FSRS, os algoritmos dos aplicativos de flashcard, resolvem "lembrar
para sempre". O Castelei tem prova marcada.

**Escolha.** Para prazo conhecido existe resultado direto: Cepeda et al. (2008) mediram,
com 1.354 participantes, que o intervalo ideal é uma **proporção do tempo que falta até
o teste** — 10 a 20% para horizontes de semanas a meses. Usamos 15%.

**A consequência é o produto.** O cronograma se comprime sozinho: faltam 90 dias, a lição
volta em 14; faltam 30, em 5; faltam 3, amanhã. Nenhum app de flashcard faz isso porque
nenhum sabe a data da prova.

**Por que não FSRS.** A curva de Cepeda é um platô largo e assimétrico — errar para mais
custa muito menos que errar para menos. Precisão extra não compra nada em cima de um
platô, e por isso o cálculo arredonda para cima. As contas e as fontes estão em
[`revisao-espacada.md`](revisao-espacada.md).

---

## 7. Três formatos de questão, um único jeito de responder

**Problema.** Múltipla escolha só mede reconhecer. Boa parte da matéria é sequência
(`fork` antes de `execve`) ou correspondência (`open` ↔ `CreateFile`), e a alternativa
não cobra nenhuma das duas.

**Escolha.** `order` (pôr na ordem) e `match` (ligar os pares), ao lado de `choice`.

**A simplificação que os une.** Os dois mandam uma permutação do que está na tela: em
`order` a posição *i* quer dizer "o *i*-ésimo passo", em `match`, "o par do *i*-ésimo
item da esquerda". É a mesma conta — então são o mesmo campo na API (`ordering`) e o
mesmo verificador (`Support\Practice\StepShuffle`).

**O problema de segurança.** Nos dois formatos o gabarito é a própria estrutura da
questão: mandar a lista como está entregaria a resposta a quem abrisse as ferramentas do
desenvolvedor. O servidor embaralha antes de entregar, com semente `md5("tentativa:
questão:índice")` — reproduzível nas duas pontas **sem guardar estado**, e diferente para
duas pessoas na mesma questão. Nada de `shuffle()`: ele mexe no gerador global do PHP e
não é estável entre versões. Um teste roda 300 sorteios e garante que nenhum devolve a
ordem certa.

**A regra de interação, escolhida uma vez e reaproveitada.** Não se arrasta, se toca.
Arrastar dentro de uma página que rola é o gesto que mais erra no celular: o dedo ora
arrasta o item, ora rola a tela. Tocar sobe o passo; tocar de novo o devolve **ao lugar
de onde saiu**, não para o fim da fila. Aprender um formato ensina o outro.

---

## 8. Código na lição vem com tradução linha a linha

**Problema.** Uma queixa de quem estava estudando: "as linhas de código, você parte do
pressuposto que eu já entendo de código". Estava certo, e o furo era do verificador —
`code.text` não passava por conferência nenhuma, então `waitpid(pid, ...)` podia entrar
na tela sem uma palavra de explicação.

**Escolha.** `code.notes`: uma nota por linha não vazia, obrigatória.

**Por que não comentário dentro do código.** Comentário sai em fonte de máquina, foge
junto com a linha na rolagem lateral e não passa pela conferência de jargão. Fora do
bloco, a explicação é texto como qualquer outro, e entra no limite de vírgulas, no de
palavras e na régua de termos.

**Detalhe de implementação que quase deu errado.** A numeração é uma **coluna ao lado**,
não um número dentro de cada linha. Partir o código em um elemento por linha tiraria as
quebras de linha do `textContent`, e quem copiasse o bloco levaria tudo grudado. O
alinhamento se sustenta porque a linha não quebra (`whitespace-pre` com rolagem lateral).

---

## 9. Identidade visual própria, sem biblioteca de design

**Problema.** A saída fácil seria adotar um design system pronto.

**Escolha.** Nenhum entra como base. Carbon traz a cara da IBM, Primer a do GitHub, e o
padrão do shadcn/ui virou a cara dos aplicativos de IA. O Atlassian Design System foi
avaliado e descartado por licença: só vale para produtos integrados à Atlassian e proíbe
obras derivadas. Comportamento complexo, quando precisar, vem do Radix UI (MIT), sem
visual junto.

**O que sustenta isso.** `docs/design-system.md` e os componentes de
`frontend/src/components/ui/`. No modo escuro a rampa de cor **inverte** — `ink` deixa de
ser grafite e passa a ser a cor do texto —, o que faz as centenas de `text-ink/70` já
espalhadas continuarem certas sem tocar em nenhuma. O que a inversão não resolve virou
papel próprio: `surface-bold`, `on-bold` e `on-accent`.

---

## 10. Onde a intuição perdeu para olhar a tela

Três correções que nenhum teste apontou, e que só apareceram abrindo o app a 390 px:

- **O X vermelho ao lado da resposta certa.** A primeira versão de "ligar os pares"
  marcava o par correto com um X, e lia-se como "esta é a errada" — justo a linha que
  existe para ensinar. Agora o par certo vai em texto normal, e o erro vem embaixo.
- **Cinco caixas azuis iguais.** A regra de explicar todo termo na estreia é boa, e a
  conferência a tornou obrigatória. O efeito colateral foi uma etapa com cinco caixas
  idênticas, cada uma repetindo o rótulo "palavra nova". Trocamos um paredão de parágrafo
  por um paredão azul. Hoje é um cartão só, com as palavras separadas por um traço fino.
- **A explicação encostada na barra de baixo.** Depois de responder, o feedback rolava com
  `block: "nearest"` — o mínimo possível —, e o mínimo deixava a pegadinha cortada atrás
  da barra fixa. Virou `"center"`. Quem acabou de responder quer ler o porquê.

---

## 11. Coisas que parecem detalhe e derrubam a página em silêncio

Guardadas aqui porque cada uma custou uma sessão de depuração:

- **`position: sticky` quebra sem erro.** O cabeçalho de módulo da trilha desgrudava 80 px
  antes do fim da seção porque a folga entre módulos estava em `padding` da própria
  seção, fora do retângulo que prende o elemento grudado. Ela precisa morar num invólucro
  *dentro* da seção. Um teste tranca a invariante.
- **`navigator.serviceWorker.ready` nunca rejeita.** Sem service worker ativo ela fica
  pendurada para sempre: não expira, não dá erro. O Perfil ficava em "Verificando…"
  eternamente. Daí `registroPronto()`, com prazo.
- **`storage:link` não serve no Railway.** Ele rodaria no pre-deploy, num contêiner
  separado e descartável, montado antes do volume — o atalho nunca chegaria ao contêiner
  que atende as requisições. O log diria "link has been connected" e toda imagem
  responderia 404. A entrega da mídia é uma rota, `GET /api/media/{caminho}`.
- **Segredo errado na rota de cron devolve 404, não 403.** 403 confirmaria que a rota
  existe e convidaria a tentar outro segredo. E a comparação é `hash_equals`, não `===`:
  uma comparação que retorna mais rápido no primeiro caractere diferente entrega o
  segredo letra por letra.
- **Ordenação alfabética em português precisa tirar o acento.** Sem isso "Índice" cai
  depois de "Zona", porque a tabela ASCII põe toda letra acentuada atrás do alfabeto.

---

## 12. O que foi adiado de propósito

- **Funcionar offline de verdade.** O service worker guarda os estáticos, mas cada
  resposta do Modo Prova exige rede. Para um aluno no ônibus, é o buraco mais caro que
  sobrou.
- **Pagamento.** Quando entrar, será pelo faturamento do próprio Google Play. Dentro de
  um TWA isso não é a biblioteca de Android, e sim a Digital Goods API mais Payment
  Request, com validação do *purchase token* no servidor ([`play-store.md`](play-store.md)).
- **O corte entre grátis e pago.** Já está decidido e ainda não escrito: tudo que existe
  hoje fica no grátis; o Pro ganha o simulado por matéria e níveis de dificuldade nas
  questões.
