# Castelei — guia para o Claude Code

Plataforma de estudos que ensina o conteúdo **e** a linguagem da prova. Cada lição é uma sequência de etapas (uma ideia por tela) seguida de questões em Modo Prova. Dono do projeto: Sávio (estudante de ADS no IFBA). Fale em **português do Brasil**.

O planejamento completo, com o **Guia Editorial de Conteúdo**, está em `docs/planejamento.md`. Leia antes de escrever lições.

## Estrutura

- `backend/`: API Laravel 12 (Sanctum, PostgreSQL em produção, SQLite em dev e testes).
- `frontend/`: Next.js 16 (App Router), React 19, Tailwind 4. É um PWA.
- `scripts/lint-content.mjs`: verificador do Guia Editorial (roda no conteúdo, não no código).
- `docs/`: planejamento, **design system (`design-system.md`)**, guia de deploy (`deploy-railway.md`), **lançamento na Play Store (`play-store.md`)**, mapa das aulas de Sistemas Operacionais (`sistemas-operacionais-mapa.md`), **painel de conteúdo (`painel-admin.md`)**, **revisão espaçada e a ciência por trás dela (`revisao-espacada.md`)**.
- `frontend/src/components/ui/`: os componentes do design system (`Card`, `Callout`, `Pill`, `Stat`, `ProgressBar`, `ListRow`, `EmptyState`). **Leia `docs/design-system.md` antes de mexer em tela.**
- Conteúdo das lições: `backend/database/seeders/content/*.json` (**fonte de verdade**). Figuras SVG: `frontend/public/figuras/`.

## Como rodar e testar

```bash
# API
cd backend && composer install && cp .env.example .env && php artisan key:generate
touch database/database.sqlite && php artisan castelei:setup && php artisan serve   # :8000
php artisan test

# App (outro terminal)
cd frontend && npm install && cp .env.example .env.local && npm run dev             # :3000
npm test && npm run lint && npm run build

# Conteúdo (deve passar sempre que mexer nos JSON)
node scripts/lint-content.mjs
```

Plano de um usuário: `php artisan castelei:plan email@exemplo.com plus`.

## Decisões de arquitetura

- **A vitrine é a única parte que lê o backend sem sessão**, por `GET /api/catalog`. Ela nunca pode cair junto com ele: qualquer falha vira a lista de reserva de `site-content.ts`, e o pedido tem prazo de 2,5 s para não pendurar a página.
- **O navegador nunca fala com a API.** O Next guarda o token do Sanctum em cookie `httpOnly` (`castelei_token`) e repassa só as rotas de prática (`frontend/src/lib/proxy.ts`). `frontend/src/proxy.ts` protege as telas do app.
- **Modo de teste sem login:** com `GUEST_MODE=true` (frontend), cada navegador ganha uma conta de visitante. A API segue protegida. Sem a variável, o login normal volta.
- **Site público separado do app.** `src/app/(site)/` guarda tudo que abre sem login (`/`, `/como-funciona`, `/materias`, `/privacidade`, `/excluir-conta`), com cabeçalho e rodapé de site. O app continua em `(app)`, com a moldura de aplicativo. O catálogo anunciado no site fica em `lib/site-content.ts` — não vem da API, para a vitrine não cair junto com o backend, e um teste (`site-content.test.ts`) reprova se ele divergir do conteúdo de verdade.
- **Planos:** limite de questões por lição no servidor (Grátis 5, Plus 30, Pro sem limite) em `backend/config/castelei.php`. Pagamento **não** está integrado. **Decisão do Sávio:** quando entrar, vai ser pelo faturamento do próprio Google Play. Dentro de um TWA isso não é a biblioteca de Android, e sim a Digital Goods API + Payment Request, com validação do *purchase token* no servidor — o caminho completo está em `docs/play-store.md`.
- **FASE DE TESTES — tudo liberado.** `UNLOCK_ALL` (padrão **ligado**) faz todo mundo estudar como Pro. Passa por `Plans::effective()`; o plano guardado em cada usuário não muda, então trocar o padrão para `false` devolve os limites sem migração. É a chave a desligar no lançamento.
- **Identidade visual é própria, e isso é decisão.** Nenhuma biblioteca de design de terceiros entra como base — Carbon traz a cara da IBM, Primer a do GitHub, e o padrão do shadcn/ui virou a cara dos apps de IA. O Atlassian Design System foi avaliado e descartado por licença (só vale para produtos integrados à Atlassian, e proíbe obras derivadas). Comportamento complexo, quando precisar, vem do Radix UI (MIT), sem visual junto.
- **Gamificação** (XP 20 por acerto, streak em dias no fuso `America/Sao_Paulo`, 10 conquistas): dados guardados para todos; só Plus/Pro veem. `GAMIFICATION_FOR_ALL=true` (backend) libera para todos, e está ligado no Railway para testes. Falhas da gamificação nunca podem quebrar o estudo (tudo em `try/catch`).
- **Etapas de lição** (`lessons.steps`, JSON): `kind` (`idea` primeira, `recap` última, uma `exam`, uma `pitfall`), `title`, `body`, e opcionais `example`, `bullets`, `terms`, `figure`, `video`, `code`, `table`. Formato completo no `README.md`. Colunas antigas (`explanation`, `exam_style`, `pitfalls`) são derivadas das etapas pelo `ContentSeeder`.
- Lições são identificadas por `(matéria, slug)` e questões por `(lição, posição)`: **não reordene questões já publicadas**. Por isso o painel não deixa editar slug depois de criado.
- **A lição guarda o nome do módulo, nunca o número** (`lessons.module`, opcional). A tela da matéria agrupa lições **seguidas** com o mesmo nome e numera pela ordem. Se o número morasse no conteúdo, reordenar a matéria deixaria um "Módulo 5" antes do 4. Nome vazio vira nulo: matéria sem módulos vira uma trilha só.
- **Só existe um caminho de escrita em massa de conteúdo:** `App\Support\Content\ContentImporter`. O `ContentSeeder` do deploy e o painel usam o mesmo código, inclusive para derivar as colunas antigas. Dois caminhos para a mesma tabela viram duas regras diferentes na primeira correção feita em um só.
- **Toda matéria guarda de onde vem** (`subjects.origin`): `seed` = os arquivos de `database/seeders/content/` ainda mandam; `painel` = foi editada em `/admin` e o `ContentSeeder` pula ela. A troca acontece na primeira escrita do painel, inclusive numa lição ou questão dela. Sem isso, o pre-deploy do Railway recarregaria o arquivo antigo por cima de toda edição — sem erro e sem aviso. O teste que trava isso é `ContentImportTest::test_o_seeder_nao_desfaz_o_que_o_painel_editou`.

## Painel de conteúdo (`/admin`)

Publicar matéria sem mexer em código nem esperar deploy. O guia completo está em `docs/painel-admin.md`; o essencial:

- **A mesma conta do app**, com uma permissão a mais. `ADMIN_EMAILS` (lista por vírgula) é a porta de entrada — no Railway dá para criar variável pelo navegador, mas rodar comando exige CLI. Depois disso, `php artisan castelei:admin email` (`--remover` tira). Plano Pro **não** dá acesso: plano é sobre estudar, permissão é sobre publicar. Conta de visitante do `GUEST_MODE` nunca entra.
- **Três camadas de barreira, e a que conta é a de baixo:** o middleware `admin` na API é a tranca; o proxy do Next (`/api/admin/[...path]`) é só encanamento, que põe o token do cookie `httpOnly` no header; a guarda em `(painel)/layout.tsx` é conforto, para a pessoa ler uma explicação em vez de um 403 numa tela branca.
- **Duas réguas diferentes, de propósito.** `App\Support\Content\ContentValidator` separa **erro** (quebra o app: campo faltando, `correct_index` fora da lista, slug repetido, figura sem `alt` útil) de **aviso** (Guia Editorial: falta `idea`/`recap`, número de alternativas ≠ 5, de questões ≠ 8). O verificador completo continua sendo `scripts/lint-content.mjs`, que roda na máquina de quem escreve — o painel existe justamente para publicar sem esse ambiente montado.
- **O importador nunca apaga sozinho.** Arquivo que encolheu gera `orphan_lessons`/`orphan_questions` no relatório; só some com `prune` ligado, e a tela diz o que vai junto (respostas e tentativas de quem já estudou).
- **A matéria sai por onde entrou.** `GET /api/admin/subjects/{id}/export` (botão "Baixar esta matéria" na tela da matéria) devolve o arquivo de importação completo, e o que sai **entra de volta sem perda** — um teste compara exportar→reimportar→exportar. Sem isso, matéria escrita no painel ficava presa no banco: sem versionamento, sem passar pelo `lint-content.mjs` e sem ninguém poder revisar num editor. Cuidado com o `correct_index`: a alternativa A é 0, e um `array_filter` ingênuo apagaria o gabarito.
- **O editor de etapas é de blocos, não de JSON** (`StepsEditor`, `StepCard`, `BlockFields`, lógica pura em `lib/steps.ts`). O campo de JSON cru que havia aqui apostava que o fluxo seria sempre "a IA gera, o painel confere e publica". A aposta quebrou na primeira vez que alguém escreveu um curso à mão: pôr uma figura exigia escrever JSON, escrever mais um parágrafo não exigia nada, e saiu um curso inteiro de texto corrido. **A ferramenta ensinou isso.** Quatro decisões:
  - **Os botões de bloco ficam sempre à vista**, com a frase do que cada um serve. Escondidos num menu é o que faz esquecer que existem.
  - **O medidor de paredão** mostra, enquanto se escreve, a mesma conta que o validador faz depois de salvar. Aviso que chega junto com o "salvo" raramente faz alguém voltar.
  - **Lição nova já nasce com uma figura e uma tabela em branco.** Campo vazio à vista puxa para ser preenchido; bloco que precisa ser acrescentado é bloco que se esquece. `limpar()` descarta o que ficou vazio antes de salvar.
  - **O modo JSON continua ali** para quem chega com conteúdo pronto. Enquanto o JSON está pela metade vale a última versão boa — devolver a cada tecla esvaziaria a lição.
- **Aviso de "lição só de texto corrido"** (`ContentValidator::tooMuchProse` e `checkVisuals` no lint). Nasceu de um caso real: um curso inteiro escrito pelo painel saiu sem uma figura, tabela ou exemplo em lição nenhuma — o conteúdo certo, a tela um paredão. Conta `figure`, `video`, `table`, `code`, `example`, `bullets` e `terms`; o piso é um terço das etapas. É **aviso**, nunca erro: forma não reprova conteúdo.
- **Modelo comentado** em `backend/resources/content/modelo-conteudo.json`. Chaves começadas por `_` são comentário e saem na importação (`ContentImporter::stripComments`). Um teste garante que o modelo passa na própria conferência sem erro nem aviso — se mudar o validador, o modelo tem que acompanhar.
- **Mídia:** `/admin/midia` guarda imagem e vídeo no disco de `castelei.media.disk` e devolve o endereço para colar na etapa. No Railway isso mora no volume `midia`, montado no `backend` em `/app/storage/app/public` — sem ele o arquivo sumiria a cada deploy. Trocar para externo é `MEDIA_DISK=s3`; nada no código muda.
- **A entrega da mídia é a rota `GET /api/media/{caminho}`, não o `public/storage` do Laravel.** O atalho é criado por `storage:link`, que só rodaria no pre-deploy do Railway — contêiner separado e descartável, montado antes do volume. O atalho nunca chega ao contêiner que atende as requisições: o log diria "link has been connected" e toda imagem responderia 404. **Não devolva o `storage:link` ao `castelei:setup`.**
- **A vitrine se anuncia sozinha.** `/materias`, `/` e `/como-funciona` leem `GET /api/catalog` (rota pública, só nome de matéria e título de lição) por `frontend/src/lib/site-catalog.ts`, com cache de 1 minuto. Matéria criada no painel aparece sem deploy. `site-content.ts` virou **rede de segurança**: vai ao ar quando a API falha, demora mais de 2,5 s ou responde fora do formato — por isso `site-content.test.ts` continua exigindo que ela fique igual aos arquivos. O `pitch` não existe no banco (é texto de venda): matéria nova se anuncia com a `description`. E "8 questões por lição" deixou de ser fixo: a rota devolve nulo quando o número varia, e a vitrine para de prometer em vez de mentir.

## Regras de conteúdo (do Sávio, valem sempre)

1. **O app é independente.** Nunca cite livro, autor, capítulo ou página dentro das lições. O livro-base da disciplina só serve para estruturar os assuntos; pode e deve usar conhecimento de qualquer boa fonte. O verificador reprova referências a fontes.
2. **Escreva para quem parte do zero.** Explique mais, em mais etapas, com exemplos do dia a dia. Se um iniciante trava, o texto está errado.
3. **Comandos sempre dizem onde funcionam:** Windows (PowerShell e cmd), Linux, ou os dois. Quando houver dois jeitos, mostre os dois (use o bloco `table`). Explique como abrir e usar o shell.
4. **Informação atualizada:** se algo da fonte estiver defasado, corrija com conhecimento atual (confira na internet).
5. Guia Editorial: analogia antes de definição, concreto antes de abstrato, nunca use um termo sem explicá-lo antes (na própria lição), sem "como vimos anteriormente", frases curtas (mais de 2 vírgulas, quebre), jargão de banca só na etapa "Como cai na prova".
6. Toda figura precisa de `alt` descritivo e legenda. Figuras são **originais** (não copie figuras de livros).

## Deploy (Railway)

Projeto `castelei` com três serviços: `Postgres`, `backend` (Root Directory `/backend`) e `frontend` (`/frontend`). **Cada push na `main` faz deploy automático.** O `backend` roda `php artisan castelei:setup` (migrations + carga idempotente do conteúdo) como pre-deploy: se falhar, o deploy não segue.

- Frontend: `https://frontend-production-3c7da.up.railway.app`. Backend: `https://backend-production-b5a94.up.railway.app`.
- Variáveis do backend: `APP_KEY`, `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, `DB_CONNECTION=pgsql`, `DB_URL=${{Postgres.DATABASE_URL}}`, `LOG_CHANNEL=stderr`, `SESSION_DRIVER=array`, `CACHE_STORE=database`, `GAMIFICATION_FOR_ALL=true`.
- Variáveis do frontend: `API_URL` (domínio público do backend, terminando em `/api`), `GUEST_MODE=true`. Opcionais: `SITE_URL` (endereço público, usado no sitemap, no robots e nas prévias de link), `CONTACT_EMAIL` (aparece em `/privacidade`), `ANDROID_CERT_FINGERPRINTS` e `ANDROID_PACKAGE_NAME` (Play Store).
- Variáveis do backend para os lembretes: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` e `CRON_SECRET`. O mesmo valor de `CRON_SECRET` vai no GitHub como o *secret* `CASTELEI_CRON_SECRET`.
- Nunca commite segredos. Não versione `.env`.

## Estado atual

Pronto: MVP (cadastro, catálogo, prática com cronômetro, resultado com recorde e ponto fraco, progresso por tópico, planos), modo de teste, Fase 2 (streak, XP, conquistas), lições em etapas, conteúdo revisado pelo Guia Editorial (Matemática, Português) e a matéria **Sistemas Operacionais** com **30 lições, cobrindo o cronograma inteiro do semestre**, da primeira aula aos trabalhos de fevereiro (o que é um SO; componentes e funções; terminal; chamadas de sistema em 2; estrutura de um SO; processos; estados e transições; escalonamento; threads em 2; comunicação entre processos em 5; memória em 4; arquivos em 3; dispositivos em 3; virtualização em 2; estudos de caso em 2).

**Fase 2 fechada** (menos TWA na Play Store e expansão de módulos, adiados pelo Sávio): simulado por matéria (`ExamController`, tentativa com `kind = exam`, questões sorteadas em rodízio entre as lições) e gráfico de evolução (`EvolutionChart`, acerto e tempo em gráficos separados — nunca eixo duplo). CI ativo em `.github/workflows/ci.yml`.

**Site de divulgação no ar**: vitrine em `/` (com uma questão real de Sistemas Operacionais como prova do produto), `/como-funciona` (o método passo a passo) e `/materias` (catálogo com o nome de toda lição). Junto vieram `sitemap.ts`, `robots.ts` e a imagem de prévia de link (`opengraph-image.tsx`, que lê as fontes da marca de `public/fonts/*.woff` — `.woff2` não serve para gerar imagem).

**Na tela inicial, cada matéria mostra uma barra de progresso** com lições praticadas sobre o total. Conta só tentativa concluída (`attempts` vem do backend com `whereNotNull('finished_at')`), e o número vem escrito ao lado da barra.

**A espera antes da primeira questão é um esqueleto** (`PracticeSkeleton`, em `PracticeClient.tsx`), com a forma do cabeçalho, do enunciado e das alternativas. Era uma frase solta no branco, no instante de maior desistência da prática.

**A lição retoma de onde parou** (`lib/lesson-progress.ts`, no `localStorage`): o `LessonStepper` devolve a pessoa à etapa, com aviso e saída para recomeçar, e a lista da matéria mostra "parou na etapa 4 de 11". Vale por aparelho e some se a lição mudar de número de etapas. Testes que renderizam o stepper **precisam limpar o `localStorage`** no `afterEach`, senão um teste começa no meio da lição do outro.

**Progresso é dividido em abas de rota**: `/progresso` (números gerais e por tópico), `/progresso/evolucao` e `/progresso/conquistas`, com o controle segmentado em `components/ProgressTabs.tsx`. Era tudo numa tela só e ficou embolado. Ao acrescentar uma aba, mexa também no `loading.tsx` da pasta — é ele que impede o cabeçalho de piscar.

**A ementa oficial resolveu as três dúvidas que estavam abertas.** Ela é a fonte de verdade da ordem do semestre:

> Conceitos de Sistemas Operacionais · Processos · Estados e Transições · **Escalonamento** · Comunicação e Sincronização de Processos · **Semáforos** · Gerência de Memória · Memória Virtual · Segmentação e Paginação · **Gerência de Disco** · Virtualização · **Estudos de Caso**

O que ela decide: o **escalonamento é tópico próprio**, logo depois de Estados e Transições; os **estudos de caso entram na matéria**, no fim; **história dos SOs e revisão de hardware não entram**. Semáforos e Gerência de Disco são itens explícitos, e por isso ganham lição própria. Impasses, Multiprocessadores e Segurança continuam de fora.

Já escritas, além das 5 primeiras: **Estrutura de um SO** (monolítico, camadas, micronúcleo, cliente-servidor, máquinas virtuais e contêineres), **Processos: o modelo** (programa × processo, tabela de processos, PID, criação, hierarquia e término), **Estados e Transições** (executando, pronto e bloqueado, as quatro transições, quem provoca cada uma, zumbi e suspenso) **Escalonamento** (com e sem preempção, objetivos, tipos de processo, regras de lote e interativas, fatia de tempo, prioridade, inanição e envelhecimento) **Threads** em 2 lições (o que compartilham e o que é próprio; escala no usuário × no núcleo, com goroutines e virtual threads como atualização) **Comunicação entre processos** em 5 lições (condição de corrida; exclusão mútua, das tentativas ingênuas a Peterson e à instrução indivisível; semáforos e mutexes; monitores, mensagens e barreira; os três problemas clássicos) **Memória** em 4 lições (base e limite, troca e fragmentação; memória virtual, paginação e TLB; substituição de páginas, com o relógio e o atropelo; segmentação, com o modo plano do x86-64 como atualização) **Arquivos** em 3 lições (arquivos, pastas e os dois tipos de link; contígua, encadeada, FAT, i-node e faixas contínuas; journaling, cópia ao gravar e cache de escrita) **Dispositivos** em 3 lições (camadas de E/S, controlador × driver e DMA; tempo de busca e as regras de ordem do braço, com o SSD mudando o jogo; arranjos de discos, com a insistência de que RAID não é backup), **Virtualização** em 2 lições (os dois tipos de hipervisor, Popek e Goldberg e a ajuda do processador; contêineres, com namespaces e cgroups) e **Estudos de caso** em 2 lições (Linux e Android; Windows).

**O plano de aula oficial (`Aula 00`) é a fonte de verdade do cronograma**, e o mapa em `docs/sistemas-operacionais-mapa.md` reproduz a tabela dele. Duas coisas que ele decide e a ementa sozinha não mostrava: **Gerenciamento de Arquivos tem duas aulas inteiras** (24/11 e 01/12) e **a prova é em 15/12** — tudo até Dispositivos Parte 1 cai nela.

**A matéria de Sistemas Operacionais está completa.** Todo o cronograma do plano de aula tem lição, da introdução de 15/09 aos trabalhos de 16/02 e 23/02. Não há próxima lição pendente nesta matéria.

Se for expandir daqui, as opções são: aprofundar o que ficou de fora da ementa (impasses, multiprocessadores, segurança), revisar as lições antigas com o mesmo nível de detalhe das novas, ou abrir outra matéria.

**Impasse entrou pela porta dos fundos.** A ementa o deixa de fora, mas ele é inevitável no jantar dos filósofos e na ordem errada de duas trancas. Está explicado onde aparece, sem lição própria.

**Painel de conteúdo no ar** (`/admin`, ver `docs/painel-admin.md`): importação de matéria por arquivo JSON com conferência antes de publicar e relatório do que entrou, edição de matéria, lição e questão, ordenação de lições, exclusão com o nome digitado, e biblioteca de imagem e vídeo. As etapas ganharam o bloco `video`, que aceita arquivo enviado ou link do YouTube (incorporado no domínio sem cookie de rastreio).

**A tela da matéria é uma trilha, não uma lista** (`components/trail/`, lógica em `lib/lesson-trail.ts`). Trinta lições em fileira não mostram onde você está nem quanto falta. Agora são módulos com barra de progresso, e dentro de cada um as lições formam uma onda de nós com três estados: concluída (verde, com certo), atual (azul, anel pulsando, selo "Agora") e ainda não praticada (cinza). Três coisas que valem saber antes de mexer:

- **Concluída é praticada, não aprovada.** Basta uma tentativa terminada; nota não entra. Cobrar acerto aqui transformaria a trilha numa cobrança, e a qualidade da resposta já é medida em `/progresso`.
- **A cinza continua clicável, de propósito.** O app acompanha um semestre com data marcada: quem revisa Memória na véspera da prova não pode esbarrar num cadeado por ter pulado uma lição de setembro. O cinza orienta, não tranca — por isso também não tem cadeado desenhado.
- **O traço passa por trás dos títulos**, e o título é uma plaquinha levantada (`bg-surface-raised` + sombra) por cima dele. Antes ele se disfarçava de fundo, repetindo cor e grão — o que só funcionava com fundo liso. A plaquinha não depende do fundo.
- **O módulo escolhe a COR, o estado escolhe a FORMA.** Cada módulo recebe sky, sage ou coral em rodízio pela ordem (nunca do conteúdo, e nunca `brick`: vermelho quer dizer erro). Assim cor diz "em que trecho da matéria você está", e quem carrega o estado é o ícone de certo, o anel com "Agora" e o cinza-cavidade. Foi o que resolveu a queixa de que a trilha era "trinta círculos cinza iguais".
- **O nó é uma tecla, não um adesivo** (`.node` + `.node-sky` e irmãs, em `globals.css`). Degrau de sombra sólida embaixo, que some quando o dedo aperta. As cores `*-deep` existem só para isso.
- **Cada módulo fecha num marco** (`TrailMilestone`, uma bandeira), que só acende completo. Não é link de propósito: não há para onde ir, e alvo que responde ao toque sem levar a lugar nenhum frustra.
- **As estrelas não cobram nota.** Terminar já vale uma, sempre (`stars()` devolve 1 até para 40% e para tentativa sem nota); a segunda e a terceira dependem do acerto. O convite é voltar e melhorar, nunca "você não concluiu".
- **O cabeçalho do módulo gruda no topo**, e é trocado pelo do módulo seguinte. É `position: sticky` puro — sem ouvir rolagem, sem medir nada: cada cabeçalho é o primeiro filho da `<section>` do seu módulo e o navegador faz a troca sozinho. Duas coisas de que isso depende e que quebram **em silêncio**: nenhum ancestral pode ter `overflow: hidden` (o app escapa porque o `globals.css` usa `overflow-x: clip`, que não cria caixa de rolagem), e **a folga entre módulos tem que ficar dentro da caixa de conteúdo da seção**. Padding na `<section>` e margem no próprio cabeçalho ficam FORA do retângulo que prende o grudado: com `pb-14` na seção e `mb-6` na faixa, o cabeçalho desgrudava 80px antes do fim do módulo e o topo da tela passava um trecho sem cabeçalho nenhum. Por isso o respiro mora num invólucro dentro da seção — e é um invólucro, não a div do caminho, porque aquela tem altura fixa em pixels e o padding comeria a sobra embaixo do marco. Medido rolando a tela, não deduzido: um teste trava as duas invariantes.
- **A faixa grudada é baixa e chapada.** Baixa porque, grudada, ela come tela o tempo todo — o cartão alto que havia aqui virou duas linhas e uma barra fina. Chapada e sangrando até a borda (`-mx-5 px-5`, com o grão do fundo junto) porque a trilha passa POR BAIXO dela: cartão solto deixaria o traço do caminho aparecer pelos cantos arredondados. O `padding-top` é `env(safe-area-inset-top)`, senão o cabeçalho nasce por baixo do relógio do celular.
- **A faixa de resumo da matéria mostra a PROVA, não XP** (`SubjectSummary`). A tentação era um cabeçalho de XP e streak no estilo dos apps de idioma. Duas razões para não: XP é da conta, não da matéria — é o mesmo número em Português e em Sistemas Operacionais, então não informa nada sobre a tela em que está —, e ele já mora em `/progresso`. O que só ESTA tela sabe é a data da prova, e é o dado que nenhum app de flashcard tem. A contagem informa, não cobra: sem vermelho, sem ícone de alerta e sem mudar de tom na última semana. O progresso da matéria usa o MESMO `concluida()` da trilha de propósito — duas definições de "concluída" é a receita para a barra dizer 6 e o caminho mostrar 7.

**Modo escuro e fundo com profundidade** (tudo em `globals.css` + `lib/theme.ts`). Duas coisas para não desfazer sem querer:

- **A rampa INVERTE no escuro.** `ink` deixa de ser "grafite" e passa a ser "a cor do texto"; `paper`, "a cor do fundo". É o que faz os quase cem `text-ink/70` e `border-ink/15` já espalhados pelas telas continuarem certos sem tocar em nenhuma. O que a inversão não resolve virou papel próprio: `surface-bold` (no escuro ele se destaca por ser mais CLARO que a página), `on-bold` (texto sobre esse bloco) e **`on-accent`** (texto sobre azul, verde ou coral cheios — não muda de tema, porque as cores da marca são claras nos dois; escrito como `text-ink` clareava junto e o botão "Confirmar" ficava ilegível).
- **O fundo é liso de propósito.** Teve brilho de azul-céu e malha de pontos, e o Sávio dispensou. Não era calibragem — foram duas rodadas de força diferente, e o veredito foi sobre o degradê em si. Ficou cor chapada com grão de 3%. Se for mexer, mexa na textura, não em degradê. E lembre que **o topo da página é a barra de status do celular** (`viewport-fit=cover`): cor no alto da página vira barra de status colorida.

**Som ao acertar e ao errar** (`lib/sound.ts`, no Modo Prova). Quatro coisas:

- **Não há arquivo de áudio.** Os dois sons são gerados na hora pela Web Audio: nada a baixar, funciona offline no PWA e o som é nosso, sem licença de banco de efeitos.
- **O erro não grita.** Uma nota grave que desce, e não o "errou!" de auditório. Quem estuda erra o tempo todo — é assim que se aprende. O acerto são duas notas subindo. Volume em 12%, porque isso toca em sala de aula.
- **`primeSound()` é chamada no começo do clique, ANTES do await.** O iPhone só libera áudio dentro de um gesto, e a resposta do servidor chega quando o gesto já passou. Sem isso, o primeiro som de toda sessão é engolido.
- **Interruptor em `/perfil`**, ligado por padrão. Ligar toca o som na hora — é a forma honesta de mostrar o que está sendo ligado, e de quebra libera o áudio no iPhone. Som sem interruptor em app de estudo é motivo para fechar o app.

A escolha do tema (Automático/Claro/Escuro, em `/perfil`) e a do som vivem no `localStorage`, **por aparelho**, e não vão ao servidor. Sem atributo = o aparelho manda; `data-theme="light"` existe só para vencer um celular escuro. O script no `<head>` é o único script embutido do app, e está lá para a tela não piscar claro antes da hidratação.

**A revisão espaçada é a primeira parte do app que tem opinião sobre o que estudar** (`lib/review.ts` na tela, motor em `Support/Review/Spacing.php`). Leia `docs/revisao-espacada.md` antes de mexer em qualquer número — eles têm origem medida. O essencial:

- **Não é o algoritmo do Anki, e isso é a decisão.** SM-2 e FSRS resolvem "lembrar para sempre", sem data. O Castelei tem prova marcada (15/12), e para prazo conhecido existe resultado direto: **Cepeda et al. (2008)** mediram, com 1.354 pessoas, que o intervalo ideal é uma **proporção do tempo que falta até o teste** — 10 a 20% para horizonte de semanas a meses. Usamos 15%.
- **A consequência é o produto inteiro:** o cronograma se comprime sozinho conforme a prova chega. Faltam 90 dias, a lição volta em 14; faltam 30, em 5; faltam 3, amanhã. Nenhum app de flashcard faz isso porque nenhum sabe a data da prova.
- **A crista é larga e assimétrica** (é o que "ridgeline" quer dizer no título do artigo): errar para mais custa bem menos que errar para menos. Por isso o cálculo arredonda para CIMA — e por isso **não precisamos de FSRS**: precisão não compra nada em cima de um platô.
- **A lição guarda a data, a matéria guarda a prova** (`subjects.exam_date`, opcional). Sem data, a matéria cai numa escada fixa de 1, 3, 7, 16, 30 dias, que **para** no último degrau: intervalo que só cresce arquiva a lição.
- **Os fatores de acerto são calibragem nossa, não estudo** (0,4 abaixo de 50%; 1,3 acima de 90%). Está escrito assim de propósito na documentação: se for afinar alguma coisa, afine isso, não a proporção de 15%.
- **A revisão abre o Modo Prova, nunca a lição.** Roediger & Karpicke (2006): 61% contra 40% de retenção após uma semana para quem pratica recuperação em vez de reler. O app já fazia certo; faltava o agendamento.
- **Só agenda na PRIMEIRA conclusão da tentativa.** Recarregar a tela de resultado é a mesma prática — reagendar ali daria um dia de folga a cada F5. Um teste trava isso.
- **O atraso não é vermelho.** Vermelho quer dizer erro no Castelei, e estar atrasado numa revisão não é erro: é o motivo de o app existir.
- **Nada é travado**, mesma decisão do nó cinza sem cadeado: a fila sugere, a trilha continua aberta.

**Lembrete de revisão** (`lib/push.ts` + `PushToggle`, backend em `PushService` e `castelei:lembretes`). O agendamento só vale se a pessoa voltar: um intervalo calculado com 1.354 participantes não serve para nada se o app espera em silêncio. Cinco coisas:

- **Sem chaves VAPID, a função não existe** — e diz que não existe. `GET /api/push/key` responde `enabled: false`, a assinatura responde 503 e o botão some. Mesmo padrão de `/.well-known/assetlinks.json`. Gere com `php artisan castelei:vapid` e ponha `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` no serviço `backend`. **Trocar o par depois derruba todas as assinaturas.**
- **Quem dispara é o GitHub Actions, não o Railway.** O agendador do Laravel precisa de alguém chamando `schedule:run` a cada minuto, e no plano em uso o Railway não dá isso: cron nativo tem intervalo mínimo de 5 minutos, e um serviço só de cron esbarra no limite de serviços. Então `.github/workflows/lembretes.yml` chama `POST /api/cron/lembretes` às 21h UTC, com o segredo em `X-Castelei-Cron`. O `Schedule::command` continua em `routes/console.php` porque em qualquer host com cron de verdade ele é o caminho certo — só não é o que roda hoje.
- **Segredo errado na rota de cron devolve 404, não 403.** 403 confirmaria que a rota existe e convidaria a tentar de novo com outro segredo. Sem `CRON_SECRET` configurado, idem: a função não existe. E `hash_equals`, não `===` — comparação que retorna mais rápido no primeiro caractere diferente entrega o segredo letra por letra.
- **O agendamento do GitHub atrasa, e tudo bem.** A crista de Cepeda é um platô largo: chegar uma hora depois não muda a retenção. O que ATRAPALHA é outra coisa — o GitHub **desliga** workflow agendado em repositório sem atividade por 60 dias. Lembrete que parou do nada: olhe isso primeiro.
- **Quem assina é o APARELHO, não a conta.** `push_subscriptions` tem uma linha por navegador, com unicidade pelo resumo do endpoint (ele é longo demais para índice único). A mesma pessoa no celular e no PC tem duas linhas, e desligar num não desliga no outro.
- **`navigator.serviceWorker.ready` nunca rejeita.** Sem service worker ativo ela fica pendurada para sempre — não expira, não dá erro. Por isso existe `registroPronto()`, com prazo: sem ele o Perfil ficava em "Verificando…" eternamente, e foi assim que o problema apareceu (em desenvolvimento o registro nem roda, só em produção).
- **No máximo um por dia, e só com lição vencida.** A crista de Cepeda é assimétrica — chegar um pouco atrasado custa pouco —, então insistir não compra retenção, compra desinstalação. A etiqueta `castelei-revisao` é a mesma todo dia, para o aviso de hoje substituir o de ontem em vez de empilhar. Desligado por padrão: pedir permissão sozinho é o caminho mais curto para um "bloquear" que o app **não consegue** reverter.

**Ao acrescentar lição, mexa em quatro lugares:** o JSON do conteúdo, a figura em `frontend/public/figuras/`, a lista de `frontend/src/lib/site-content.ts` (o teste `site-content.test.ts` reprova se esquecer) e o mapa em `docs/sistemas-operacionais-mapa.md`.

**Atualizações feitas sobre o material do semestre** (a regra 4 do Guia manda corrigir o que está defasado): micronúcleo hoje é tecnologia de produção, não experimento — entrou o seL4 e o uso em carros e aviões; e contêineres entraram ao lado de máquinas virtuais, porque é o que se usa hoje e o material da disciplina não cobre.

**Play Store (TWA).** O caminho está escrito em `docs/play-store.md`, com o que é do Sávio e o que é código. Pronto no código: `/privacidade` e `/excluir-conta` (páginas públicas exigidas pela loja), exclusão de conta no Perfil (`DELETE /api/me`, com confirmação em dois passos), `/.well-known/assetlinks.json` (lê `ANDROID_CERT_FINGERPRINTS`; responde 404 enquanto a variável não existir, de propósito) e o modelo do gráfico de destaque em `docs/play-store/feature-graphic.html`. Falta só o que depende do Sávio: conta de desenvolvedor, impressão digital e capturas de tela.

## Pendências e cuidados

- **`backend/composer.lock` não está versionado.** Cada deploy do Railway resolve as dependências do zero, então produção pode receber versões diferentes das testadas. Commitar o lock resolve, mas o arquivo gerado aqui veio do PHP 8.4 e o Railway não tem versão fixada (`composer.json` pede `^8.2`): confira a versão do PHP em produção antes de versionar.
- **Ainda faltam, do plano visual:** ilustrações próprias para estados vazios e conquistas (hoje são ícones do Lucide).
- **Ainda não funciona offline de verdade.** O `sw.js` cacheia estáticos e mostra `/offline.html`; cada resposta do Modo Prova exige rede. Para um aluno no ônibus, isso é o buraco mais caro que sobrou.
- **Autorização permanente do Sávio: pode subir sem perguntar.** Terminou um trabalho conferido (testes, lint, build e a tela olhada), abra o PR, mescle na `main` e acompanhe o deploy do Railway — não pare para pedir permissão. A exceção é ele dizer que naquele caso não é para subir. Isso não dispensa o resto: conferir antes, nunca subir coisa quebrada, e avisar o que foi ao ar.
- O Sávio **edita direto no GitHub** (já fez ajustes visuais de PWA). Sempre `git fetch` e confira antes de dar push. Nunca use force push.
- Observação sobre ajuste manual dele: `BottomNav` continua sem `aria-label`. Sugira, não altere sem pedir. (O padding de área segura duplicado foi corrigido junto com a folga da barra, a pedido dele.)
- Não testado em celular real nem em máquinas Windows/Linux reais (os comandos vêm da documentação). O Sávio está testando o app.
- Ainda não existem: login com Google, pagamento, ranking, simuladores interativos.
- Ao terminar de usar tokens pessoais de GitHub que foram colados em chats, revogue-os.
