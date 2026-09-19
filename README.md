# Castelei

Plataforma de estudos que ensina o conteúdo **e** a linguagem da prova. Cada lição tem três camadas: explicação humana, como o assunto cai na prova e as pegadinhas mais comuns. Depois vem o treino em Modo Prova, com cronômetro.

O planejamento completo está em [`docs/planejamento.md`](docs/planejamento.md).

```
castelei/
├── backend/    API Laravel 12 (Sanctum, PostgreSQL em produção, SQLite em dev/testes)
├── frontend/   App Next.js 16 + Tailwind 4, instalável como PWA
└── docs/       Planejamento e guia de deploy no Railway
```

## O que o MVP já faz

- Cadastro e login por e-mail e senha
- 2 matérias, 4 lições e 32 questões originais (Matemática Básica: equações do 1º grau e porcentagem; Português: crase e concordância verbal)
- Lição em 3 camadas (resumo, explicação humana, como cai na prova, pegadinhas)
- Modo Prova: uma questão por tela, cronômetro crescente, confirmar ou pular, feedback com gabarito, explicação e pegadinha
- Resultado com acerto, tempo médio por questão, recorde de tempo e ponto fraco
- Progresso por tópico (dominado, evoluindo, revisar)
- Plano Grátis (5 questões por lição) e Plus (todas), aplicado no servidor
- PWA instalável (manifest, ícones, service worker que só guarda arquivos estáticos)

## O que ficou de fora (fases seguintes do planejamento)

- Login com Google e pagamento. Por enquanto o plano se troca com `php artisan castelei:plan email plus`
- Streak, XP, ranking e conquistas (Fase 2)
- Matérias rotativas no plano grátis (só há 2 matérias)
- IA, revisão espaçada e simulados

Decisão de conteúdo: as questões são **originais**, escritas no estilo de prova, e não trazem a informação "apareceu N vezes no ENEM" do wireframe. Essa estatística exigiria uma base verificada de provas reais, que ainda não existe.

## Rodando localmente

Precisa de PHP 8.2+, Composer e Node 22+.

```bash
# 1) API
cd backend
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan castelei:setup      # migrations + conteúdo
php artisan serve               # http://localhost:8000

# 2) App (outro terminal)
cd frontend
npm install
cp .env.example .env.local      # API_URL=http://localhost:8000/api
npm run dev                     # http://localhost:3000
```

## Testes

```bash
cd backend  && php artisan test
cd frontend && npm test && npm run lint && npm run build
```

O CI (`.github/workflows/ci.yml`) roda tudo isso a cada push.

## Modo de teste (sem login)

Com `GUEST_MODE=true` no frontend, as telas de entrar e cadastrar somem: cada navegador ganha automaticamente uma conta de visitante (progresso guardado no cookie do navegador, por até 30 dias). A API continua protegida por token. Para voltar ao login normal, remova a variável ou troque por qualquer outro valor.

Limites conhecidos: limpar os cookies cria um visitante novo (o progresso antigo não volta), e o cadastro na API aceita 10 contas novas por minuto por IP, então muitos visitantes novos de uma vez podem ver a mensagem de servidor indisponível.

## Como a autenticação funciona

O navegador nunca fala direto com a API. O Next guarda o token do Sanctum num cookie `httpOnly` e repassa apenas as rotas de prática (`/api/lessons/*/attempts`, `/api/attempts/*/answers`, `/api/attempts/*/finish`), colocando o token no header. Assim o token não fica exposto a JavaScript, e não há CORS para configurar.

## Deploy

Veja [`docs/deploy-railway.md`](docs/deploy-railway.md).
