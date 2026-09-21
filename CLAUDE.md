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

Pronto: MVP (cadastro, catálogo, prática com cronômetro, resultado com recorde e ponto fraco, progresso por tópico, planos), modo de teste, Fase 2 (streak, XP, conquistas), lições em etapas, conteúdo revisado pelo Guia Editorial (Matemática, Português) e a matéria **Sistemas Operacionais** com 5 lições (o que é um SO; componentes e funções; terminal na prática; chamadas de sistema em 2 lições).

**Fase 2 fechada** (menos TWA na Play Store e expansão de módulos, adiados pelo Sávio): simulado por matéria (`ExamController`, tentativa com `kind = exam`, questões sorteadas em rodízio entre as lições) e gráfico de evolução (`EvolutionChart`, acerto e tempo em gráficos separados — nunca eixo duplo). CI ativo em `.github/workflows/ci.yml`.

**Site de divulgação no ar**: vitrine em `/` (com uma questão real de Sistemas Operacionais como prova do produto), `/como-funciona` (o método passo a passo) e `/materias` (catálogo com o nome de toda lição). Junto vieram `sitemap.ts`, `robots.ts` e a imagem de prévia de link (`opengraph-image.tsx`, que lê as fontes da marca de `public/fonts/*.woff` — `.woff2` não serve para gerar imagem).

**Progresso é dividido em abas de rota**: `/progresso` (números gerais e por tópico), `/progresso/evolucao` e `/progresso/conquistas`, com o controle segmentado em `components/ProgressTabs.tsx`. Era tudo numa tela só e ficou embolado. Ao acrescentar uma aba, mexa também no `loading.tsx` da pasta — é ele que impede o cabeçalho de piscar.

Aguardando respostas do Sávio (plano do professor, ver `docs/sistemas-operacionais-mapa.md`):
1. Onde entra o **escalonamento** (suposição: Processos e Threads, parte 2).
2. Se os **estudos de caso** (Linux, Windows) ficam nos trabalhos.
3. Se quer **história dos SOs e revisão de hardware** na introdução.

Próximas lições, na ordem das aulas: 29/09 Estrutura e arquitetura de um SO; depois Processos e Threads, Comunicação entre processos, Memória, Arquivos, Dispositivos, Virtualização. Só o que está no plano do professor (Impasses, Multiprocessadores e Segurança ficam de fora).

**Play Store (TWA).** O caminho está escrito em `docs/play-store.md`, com o que é do Sávio e o que é código. Pronto no código: `/privacidade` e `/excluir-conta` (páginas públicas exigidas pela loja), exclusão de conta no Perfil (`DELETE /api/me`, com confirmação em dois passos), `/.well-known/assetlinks.json` (lê `ANDROID_CERT_FINGERPRINTS`; responde 404 enquanto a variável não existir, de propósito) e o modelo do gráfico de destaque em `docs/play-store/feature-graphic.html`. Falta só o que depende do Sávio: conta de desenvolvedor, impressão digital e capturas de tela.

## Pendências e cuidados

- **`backend/composer.lock` não está versionado.** Cada deploy do Railway resolve as dependências do zero, então produção pode receber versões diferentes das testadas. Commitar o lock resolve, mas o arquivo gerado aqui veio do PHP 8.4 e o Railway não tem versão fixada (`composer.json` pede `^8.2`): confira a versão do PHP em produção antes de versionar.
- **Ainda faltam, do plano visual:** ilustrações próprias para estados vazios e conquistas (hoje são ícones do Lucide) e modo escuro — os papéis de superfície já isolam o que mudaria.
- O Sávio **edita direto no GitHub** (já fez ajustes visuais de PWA). Sempre `git fetch` e confira antes de dar push. Nunca use force push.
- Observação sobre ajuste manual dele: `BottomNav` continua sem `aria-label`. Sugira, não altere sem pedir. (O padding de área segura duplicado foi corrigido junto com a folga da barra, a pedido dele.)
- Não testado em celular real nem em máquinas Windows/Linux reais (os comandos vêm da documentação). O Sávio está testando o app.
- Ainda não existem: login com Google, pagamento, ranking, simuladores interativos, vídeos.
- Ao terminar de usar tokens pessoais de GitHub que foram colados em chats, revogue-os.
