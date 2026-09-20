# Castelei — guia para o Claude Code

Plataforma de estudos que ensina o conteúdo **e** a linguagem da prova. Cada lição é uma sequência de etapas (uma ideia por tela) seguida de questões em Modo Prova. Dono do projeto: Sávio (estudante de ADS no IFBA). Fale em **português do Brasil**.

O planejamento completo, com o **Guia Editorial de Conteúdo**, está em `docs/planejamento.md`. Leia antes de escrever lições.

## Estrutura

- `backend/`: API Laravel 12 (Sanctum, PostgreSQL em produção, SQLite em dev e testes).
- `frontend/`: Next.js 16 (App Router), React 19, Tailwind 4. É um PWA.
- `scripts/lint-content.mjs`: verificador do Guia Editorial (roda no conteúdo, não no código).
- `docs/`: planejamento, guia de deploy (`deploy-railway.md`), mapa das aulas de Sistemas Operacionais (`sistemas-operacionais-mapa.md`).
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
- **Planos:** limite de questões por lição no servidor (Grátis 5, Plus 30, Pro sem limite) em `backend/config/castelei.php`. Pagamento **não** está integrado.
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
- Variáveis do frontend: `API_URL` (domínio público do backend, terminando em `/api`), `GUEST_MODE=true`.
- Nunca commite segredos. Não versione `.env`.

## Estado atual

Pronto: MVP (cadastro, catálogo, prática com cronômetro, resultado com recorde e ponto fraco, progresso por tópico, planos), modo de teste, Fase 2 (streak, XP, conquistas), lições em etapas, conteúdo revisado pelo Guia Editorial (Matemática, Português) e a matéria **Sistemas Operacionais** com 5 lições (o que é um SO; componentes e funções; terminal na prática; chamadas de sistema em 2 lições).

**Fase 2 fechada** (menos TWA na Play Store e expansão de módulos, adiados pelo Sávio): simulado por matéria (`ExamController`, tentativa com `kind = exam`, questões sorteadas em rodízio entre as lições) e gráfico de evolução em `/progresso` (`EvolutionChart`, acerto e tempo em gráficos separados — nunca eixo duplo). CI ativo em `.github/workflows/ci.yml`.

Aguardando respostas do Sávio (plano do professor, ver `docs/sistemas-operacionais-mapa.md`):
1. Onde entra o **escalonamento** (suposição: Processos e Threads, parte 2).
2. Se os **estudos de caso** (Linux, Windows) ficam nos trabalhos.
3. Se quer **história dos SOs e revisão de hardware** na introdução.

Próximas lições, na ordem das aulas: 29/09 Estrutura e arquitetura de um SO; depois Processos e Threads, Comunicação entre processos, Memória, Arquivos, Dispositivos, Virtualização. Só o que está no plano do professor (Impasses, Multiprocessadores e Segurança ficam de fora).

## Pendências e cuidados

- **`backend/composer.lock` não está versionado.** Cada deploy do Railway resolve as dependências do zero, então produção pode receber versões diferentes das testadas. Commitar o lock resolve, mas o arquivo gerado aqui veio do PHP 8.4 e o Railway não tem versão fixada (`composer.json` pede `^8.2`): confira a versão do PHP em produção antes de versionar.
- **O simulado depende de `EXAM_FOR_ALL=true`** no serviço `backend` do Railway para aparecer fora do plano Pro. Ainda não foi ligado.
- O Sávio **edita direto no GitHub** (já fez ajustes visuais de PWA). Sempre `git fetch` e confira antes de dar push. Nunca use force push.
- Observações sobre ajustes manuais dele (não alterados): `BottomNav` sem `aria-label` e com padding de área segura duplicado no iPhone. Sugira, não altere sem pedir.
- Não testado em celular real nem em máquinas Windows/Linux reais (os comandos vêm da documentação). O Sávio está testando o app.
- Ainda não existem: login com Google, pagamento, ranking, simuladores interativos, vídeos.
- Ao terminar de usar tokens pessoais de GitHub que foram colados em chats, revogue-os.
