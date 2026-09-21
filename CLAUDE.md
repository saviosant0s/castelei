# Castelei — guia para o Claude Code

Plataforma de estudos que ensina o conteúdo **e** a linguagem da prova. Cada lição é uma sequência de etapas (uma ideia por tela) seguida de questões em Modo Prova. Dono do projeto: Sávio (estudante de ADS no IFBA). Fale em **português do Brasil**.

O planejamento completo, com o **Guia Editorial de Conteúdo**, está em `docs/planejamento.md`. Leia antes de escrever lições.

## Estrutura

- `backend/`: API Laravel 12 (Sanctum, PostgreSQL em produção, SQLite em dev e testes).
- `frontend/`: Next.js 16 (App Router), React 19, Tailwind 4. É um PWA.
- `scripts/lint-content.mjs`: verificador do Guia Editorial (roda no conteúdo, não no código).
- `docs/`: planejamento, **design system (`design-system.md`)**, guia de deploy (`deploy-railway.md`), **lançamento na Play Store (`play-store.md`)**, mapa das aulas de Sistemas Operacionais (`sistemas-operacionais-mapa.md`).
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

- **O navegador nunca fala com a API.** O Next guarda o token do Sanctum em cookie `httpOnly` (`castelei_token`) e repassa só as rotas de prática (`frontend/src/lib/proxy.ts`). `frontend/src/proxy.ts` protege as telas do app.
- **Modo de teste sem login:** com `GUEST_MODE=true` (frontend), cada navegador ganha uma conta de visitante. A API segue protegida. Sem a variável, o login normal volta.
- **Site público separado do app.** `src/app/(site)/` guarda tudo que abre sem login (`/`, `/como-funciona`, `/materias`, `/privacidade`, `/excluir-conta`), com cabeçalho e rodapé de site. O app continua em `(app)`, com a moldura de aplicativo. O catálogo anunciado no site fica em `lib/site-content.ts` — não vem da API, para a vitrine não cair junto com o backend, e um teste (`site-content.test.ts`) reprova se ele divergir do conteúdo de verdade.
- **Planos:** limite de questões por lição no servidor (Grátis 5, Plus 30, Pro sem limite) em `backend/config/castelei.php`. Pagamento **não** está integrado. **Decisão do Sávio:** quando entrar, vai ser pelo faturamento do próprio Google Play. Dentro de um TWA isso não é a biblioteca de Android, e sim a Digital Goods API + Payment Request, com validação do *purchase token* no servidor — o caminho completo está em `docs/play-store.md`.
- **FASE DE TESTES — tudo liberado.** `UNLOCK_ALL` (padrão **ligado**) faz todo mundo estudar como Pro. Passa por `Plans::effective()`; o plano guardado em cada usuário não muda, então trocar o padrão para `false` devolve os limites sem migração. É a chave a desligar no lançamento.
- **Identidade visual é própria, e isso é decisão.** Nenhuma biblioteca de design de terceiros entra como base — Carbon traz a cara da IBM, Primer a do GitHub, e o padrão do shadcn/ui virou a cara dos apps de IA. O Atlassian Design System foi avaliado e descartado por licença (só vale para produtos integrados à Atlassian, e proíbe obras derivadas). Comportamento complexo, quando precisar, vem do Radix UI (MIT), sem visual junto.
- **Gamificação** (XP 20 por acerto, streak em dias no fuso `America/Sao_Paulo`, 10 conquistas): dados guardados para todos; só Plus/Pro veem. `GAMIFICATION_FOR_ALL=true` (backend) libera para todos, e está ligado no Railway para testes. Falhas da gamificação nunca podem quebrar o estudo (tudo em `try/catch`).
- **Etapas de lição** (`lessons.steps`, JSON): `kind` (`idea` primeira, `recap` última, uma `exam`, uma `pitfall`), `title`, `body`, e opcionais `example`, `bullets`, `terms`, `figure`, `code`, `table`. Formato completo no `README.md`. Colunas antigas (`explanation`, `exam_style`, `pitfalls`) são derivadas das etapas pelo `ContentSeeder`.
- Lições são identificadas por `(matéria, slug)` e questões por `(lição, posição)`: **não reordene questões já publicadas**.

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
- Nunca commite segredos. Não versione `.env`.

## Estado atual

Pronto: MVP (cadastro, catálogo, prática com cronômetro, resultado com recorde e ponto fraco, progresso por tópico, planos), modo de teste, Fase 2 (streak, XP, conquistas), lições em etapas, conteúdo revisado pelo Guia Editorial (Matemática, Português) e a matéria **Sistemas Operacionais** com 26 lições, cobrindo todo o cronograma até 22/12 (o que é um SO; componentes e funções; terminal; chamadas de sistema em 2; estrutura de um SO; processos; estados e transições; escalonamento; threads em 2; comunicação entre processos em 5; memória em 4; arquivos em 3; dispositivos em 3).

**Fase 2 fechada** (menos TWA na Play Store e expansão de módulos, adiados pelo Sávio): simulado por matéria (`ExamController`, tentativa com `kind = exam`, questões sorteadas em rodízio entre as lições) e gráfico de evolução (`EvolutionChart`, acerto e tempo em gráficos separados — nunca eixo duplo). CI ativo em `.github/workflows/ci.yml`.

**Site de divulgação no ar**: vitrine em `/` (com uma questão real de Sistemas Operacionais como prova do produto), `/como-funciona` (o método passo a passo) e `/materias` (catálogo com o nome de toda lição). Junto vieram `sitemap.ts`, `robots.ts` e a imagem de prévia de link (`opengraph-image.tsx`, que lê as fontes da marca de `public/fonts/*.woff` — `.woff2` não serve para gerar imagem).

**Na tela inicial, cada matéria mostra uma barra de progresso** com lições praticadas sobre o total. Conta só tentativa concluída (`attempts` vem do backend com `whereNotNull('finished_at')`), e o número vem escrito ao lado da barra.

**A espera antes da primeira questão é um esqueleto** (`PracticeSkeleton`, em `PracticeClient.tsx`), com a forma do cabeçalho, do enunciado e das alternativas. Era uma frase solta no branco, no instante de maior desistência da prática.

**A lição retoma de onde parou** (`lib/lesson-progress.ts`, no `localStorage`): o `LessonStepper` devolve a pessoa à etapa, com aviso e saída para recomeçar, e a lista da matéria mostra "parou na etapa 4 de 11". Vale por aparelho e some se a lição mudar de número de etapas. Testes que renderizam o stepper **precisam limpar o `localStorage`** no `afterEach`, senão um teste começa no meio da lição do outro.

**Progresso é dividido em abas de rota**: `/progresso` (números gerais e por tópico), `/progresso/evolucao` e `/progresso/conquistas`, com o controle segmentado em `components/ProgressTabs.tsx`. Era tudo numa tela só e ficou embolado. Ao acrescentar uma aba, mexa também no `loading.tsx` da pasta — é ele que impede o cabeçalho de piscar.

**A ementa oficial resolveu as três dúvidas que estavam abertas.** Ela é a fonte de verdade da ordem do semestre:

> Conceitos de Sistemas Operacionais · Processos · Estados e Transições · **Escalonamento** · Comunicação e Sincronização de Processos · **Semáforos** · Gerência de Memória · Memória Virtual · Segmentação e Paginação · **Gerência de Disco** · Virtualização · **Estudos de Caso**

O que ela decide: o **escalonamento é tópico próprio**, logo depois de Estados e Transições; os **estudos de caso entram na matéria**, no fim; **história dos SOs e revisão de hardware não entram**. Semáforos e Gerência de Disco são itens explícitos, e por isso ganham lição própria. Impasses, Multiprocessadores e Segurança continuam de fora.

Já escritas, além das 5 primeiras: **Estrutura de um SO** (monolítico, camadas, micronúcleo, cliente-servidor, máquinas virtuais e contêineres), **Processos: o modelo** (programa × processo, tabela de processos, PID, criação, hierarquia e término), **Estados e Transições** (executando, pronto e bloqueado, as quatro transições, quem provoca cada uma, zumbi e suspenso) **Escalonamento** (com e sem preempção, objetivos, tipos de processo, regras de lote e interativas, fatia de tempo, prioridade, inanição e envelhecimento) **Threads** em 2 lições (o que compartilham e o que é próprio; escala no usuário × no núcleo, com goroutines e virtual threads como atualização) **Comunicação entre processos** em 5 lições (condição de corrida; exclusão mútua, das tentativas ingênuas a Peterson e à instrução indivisível; semáforos e mutexes; monitores, mensagens e barreira; os três problemas clássicos) **Memória** em 4 lições (base e limite, troca e fragmentação; memória virtual, paginação e TLB; substituição de páginas, com o relógio e o atropelo; segmentação, com o modo plano do x86-64 como atualização) **Arquivos** em 3 lições (arquivos, pastas e os dois tipos de link; contígua, encadeada, FAT, i-node e faixas contínuas; journaling, cópia ao gravar e cache de escrita) e **Dispositivos** em 3 lições (camadas de E/S, controlador × driver e DMA; tempo de busca e as regras de ordem do braço, com o SSD mudando o jogo; arranjos de discos, com a insistência de que RAID não é backup).

**O plano de aula oficial (`Aula 00`) é a fonte de verdade do cronograma**, e o mapa em `docs/sistemas-operacionais-mapa.md` reproduz a tabela dele. Duas coisas que ele decide e a ementa sozinha não mostrava: **Gerenciamento de Arquivos tem duas aulas inteiras** (24/11 e 01/12) e **a prova é em 15/12** — tudo até Dispositivos Parte 1 cai nela.

Próximas, nesta ordem: Virtualização (02/02/27, ~2 lições) · Estudos de Caso (os trabalhos 01 e 02, ~2 lições).

**Todo o conteúdo da prova de 15/12 está escrito.** O que falta é o que vem depois dela.

**Impasse entrou pela porta dos fundos.** A ementa o deixa de fora, mas ele é inevitável no jantar dos filósofos e na ordem errada de duas trancas. Está explicado onde aparece, sem lição própria.

**Ao acrescentar lição, mexa em quatro lugares:** o JSON do conteúdo, a figura em `frontend/public/figuras/`, a lista de `frontend/src/lib/site-content.ts` (o teste `site-content.test.ts` reprova se esquecer) e o mapa em `docs/sistemas-operacionais-mapa.md`.

**Atualizações feitas sobre o material do semestre** (a regra 4 do Guia manda corrigir o que está defasado): micronúcleo hoje é tecnologia de produção, não experimento — entrou o seL4 e o uso em carros e aviões; e contêineres entraram ao lado de máquinas virtuais, porque é o que se usa hoje e o material da disciplina não cobre.

**Play Store (TWA).** O caminho está escrito em `docs/play-store.md`, com o que é do Sávio e o que é código. Pronto no código: `/privacidade` e `/excluir-conta` (páginas públicas exigidas pela loja), exclusão de conta no Perfil (`DELETE /api/me`, com confirmação em dois passos), `/.well-known/assetlinks.json` (lê `ANDROID_CERT_FINGERPRINTS`; responde 404 enquanto a variável não existir, de propósito) e o modelo do gráfico de destaque em `docs/play-store/feature-graphic.html`. Falta só o que depende do Sávio: conta de desenvolvedor, impressão digital e capturas de tela.

## Pendências e cuidados

- **`backend/composer.lock` não está versionado.** Cada deploy do Railway resolve as dependências do zero, então produção pode receber versões diferentes das testadas. Commitar o lock resolve, mas o arquivo gerado aqui veio do PHP 8.4 e o Railway não tem versão fixada (`composer.json` pede `^8.2`): confira a versão do PHP em produção antes de versionar.
- **Ainda faltam, do plano visual:** ilustrações próprias para estados vazios e conquistas (hoje são ícones do Lucide) e modo escuro — os papéis de superfície já isolam o que mudaria.
- O Sávio **edita direto no GitHub** (já fez ajustes visuais de PWA). Sempre `git fetch` e confira antes de dar push. Nunca use force push.
- Observação sobre ajuste manual dele: `BottomNav` continua sem `aria-label`. Sugira, não altere sem pedir. (O padding de área segura duplicado foi corrigido junto com a folga da barra, a pedido dele.)
- Não testado em celular real nem em máquinas Windows/Linux reais (os comandos vêm da documentação). O Sávio está testando o app.
- Ainda não existem: login com Google, pagamento, ranking, simuladores interativos, vídeos.
- Ao terminar de usar tokens pessoais de GitHub que foram colados em chats, revogue-os.
