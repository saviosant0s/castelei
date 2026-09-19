# Castelei — API (Laravel 12)

API REST do Castelei. Autenticação por token (Laravel Sanctum), banco PostgreSQL em produção e SQLite em desenvolvimento/testes.

## Rodando localmente

Requisitos: PHP 8.2+ e Composer.

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan castelei:setup      # migrations + conteúdo das lições
php artisan serve               # http://localhost:8000
php artisan test                # suíte de testes
```

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/register` | Cria conta (nome, e-mail, senha ≥ 8) e devolve `token` |
| POST | `/api/login` | Login e `token` |
| POST | `/api/logout` | Revoga o token atual |
| GET | `/api/me` | Usuário logado e plano |
| GET | `/api/subjects` | Matérias, lições, progresso e questões disponíveis no plano |
| GET | `/api/lessons/{id}` | Resumo, "como cai na prova" e pegadinhas da lição |
| POST | `/api/lessons/{id}/attempts` | Inicia tentativa (questões **sem** gabarito) |
| POST | `/api/attempts/{id}/answers` | Responde (ou pula, com `selected: null`) e recebe gabarito + explicação |
| POST | `/api/attempts/{id}/finish` | Resultado: %, tempo médio, recorde, ponto fraco, próxima lição |
| GET | `/api/progress` | Acerto e tempo por tópico + última lição |

Todas exigem `Authorization: Bearer <token>`, exceto register e login.

## Planos

Definidos em `config/castelei.php`. Hoje a única regra é quantas questões cada lição entrega:
Grátis = 5, Plus = 30, Pro = ilimitado. A cobrança ainda não está integrada; para trocar o plano de alguém:

```bash
php artisan castelei:plan email@exemplo.com plus
```

## Conteúdo

As lições ficam em `database/seeders/content/*.json` (matéria → lições → questões). O `ContentSeeder` é idempotente e roda a cada deploy (`castelei:setup`). Lições são identificadas por `(matéria, slug)` e questões por `(lição, posição)`, então **não reordene questões já publicadas**: acrescente novas ao final.

## Deploy

Veja `../docs/deploy-railway.md`.
