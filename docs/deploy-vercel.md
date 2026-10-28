# Deploy no Vercel

O Castelei roda em dois projetos do Vercel, os dois ligados a este repositório,
mais um banco Postgres no Neon. **Cada push na `main` publica os dois.**

| Projeto | Pasta (Root Directory) | O que é |
|---|---|---|
| `castelei` | `frontend` | O app e o site (Next.js) |
| `castelei-api` | `backend` | A API (Laravel, rodando como função PHP) |
| Neon | — | O banco Postgres, criado pela aba Storage do Vercel |

Saímos do Railway em outubro de 2026, quando o período de teste acabou. O
banco começou do zero: as matérias do repositório voltam sozinhas no primeiro
deploy, mas contas, progresso e o que só existia no painel ficaram para trás.

## Como a API roda no Vercel

O Vercel não tem PHP próprio. Quem roda o Laravel é o adaptador da comunidade
`vercel-php` (ver `backend/vercel.json`), e toda requisição entra por
`backend/api/index.php`, que só carrega o `public/index.php` de sempre. Quatro
consequências:

- **Não existe disco que dure.** A função só escreve em `/tmp`, e o que fica
  lá some. Por isso os caches do Laravel apontam para `/tmp` (as variáveis
  `APP_*_CACHE` e `VIEW_COMPILED_PATH` no `vercel.json`), a sessão é
  `array`, o cache é o banco e o log vai para `stderr`.
- **A mídia mora no banco** (`MEDIA_DISK=database`, tabela `media_files`, ver
  `App\Support\Media\DatabaseAdapter`). Armazenamento externo seria mais um
  serviço e mais uma chave, para meia dúzia de figuras.
- **O envio para a função tem teto de 4,5 MB**, regra do Vercel. Por isso
  imagem e vídeo enviados pelo painel ficam limitados a 4 MB
  (`MEDIA_MAX_*_KB`). Vídeo maior vai pelo YouTube, que a etapa já aceita.
- **As migrações rodam no build**, no lugar do pre-deploy do Railway: o
  `composer.json` tem um script `vercel`, que o adaptador executa ao montar a
  função. Ele chama `castelei:setup` **só em produção** (`VERCEL_ENV`). Deploy
  de teste de outra branch não encosta no banco de verdade. Se o setup falhar,
  o build falha e a versão anterior continua no ar.

## Montar do zero (o que é feito no painel do Vercel)

O conector do Vercel do Claude cria projeto, variável e deploy. O banco do
Neon pede o aceite do Sávio no painel.

### 1. Projeto da API

1. **Add New → Project**, importar `saviosant0s/castelei`.
2. Nome `castelei-api`. **Root Directory: `backend`**. Framework: **Other**.
   Deixe os comandos de build em branco.
3. Pode deixar o primeiro deploy falhar: ainda não há banco.
4. **Storage → Create Database → Neon**. Região: **São Paulo (sa-east-1)**.
   Ligue ao projeto `castelei-api`, marcando **só Production**. A integração
   cria `DATABASE_URL`, que o `config/database.php` lê quando `DB_URL` não
   existe.
5. **Settings → Functions → Region: São Paulo (gru1)**, perto do banco e de
   quem estuda.
6. **Settings → Environment Variables** (Production):

   | Variável | Valor |
   |---|---|
   | `APP_KEY` | `base64:…` (gere com `php artisan key:generate --show`, ou reaproveite a do Railway) |
   | `APP_URL` | o endereço do projeto, ex. `https://castelei-api.vercel.app` |
   | `GAMIFICATION_FOR_ALL` | `true` |
   | `ADMIN_EMAILS` | seu e-mail (dá acesso ao `/admin`) |
   | `ANTHROPIC_API_KEY` | a mesma que estava no Railway (dúvida e correção por IA) |
   | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | as mesmas do Railway (lembretes) |
   | `CRON_SECRET` | o mesmo do Railway, que já está no GitHub como `CASTELEI_CRON_SECRET` |
   | `REAL_PLAN_EMAILS` | opcional: a conta que deve ver o plano grátis de verdade |

   As variáveis que não são segredo já vêm no `backend/vercel.json`.
7. **Deployments → Redeploy**. O log do build deve mostrar as migrações e a
   carga das matérias. Abra `https://SEU-ENDERECO/api/catalog`: tem que
   aparecer a lista de matérias.

### 2. Projeto do app

1. **Add New → Project**, o mesmo repositório.
2. Nome `castelei`. **Root Directory: `frontend`**. Framework: Next.js
   (detectado sozinho).
3. Variáveis (Production):

   | Variável | Valor |
   |---|---|
   | `API_URL` | o endereço da API **terminando em `/api`**, ex. `https://castelei-api.vercel.app/api` |
   | `GUEST_MODE` | `true` (modo de teste, sem login obrigatório) |
   | `CONTACT_EMAIL` | opcional, aparece em `/privacidade` |

   `SITE_URL` é opcional: sem ela, o sitemap e as prévias de link usam o
   endereço de produção que o próprio Vercel informa.
4. **Settings → Functions → Region: São Paulo (gru1)**.

### 3. Lembretes (GitHub)

O workflow `.github/workflows/lembretes.yml` chama a API às 18h de Brasília.
Ele usa `https://castelei-api.vercel.app/api`. Se o Vercel der outro
endereço ao projeto, crie em **GitHub → Settings → Secrets and variables →
Actions → Variables** a variável `CASTELEI_API_URL` com o endereço certo.

## Quando algo der errado

- **Build da API falhou:** o log mostra a saída do `castelei:setup`. Erro de
  conexão quase sempre é a integração do Neon não ligada ao ambiente de
  Production.
- **O app abre, mas não lista as matérias:** confira o `API_URL` do projeto
  `castelei`, com `/api` no fim. A vitrine continua de pé com a lista de
  reserva, então o site parecer normal não prova que a API responde.
- **Erro 500 na API:** **Logs** do projeto `castelei-api`. Com
  `LOG_CHANNEL=stderr`, o erro do Laravel aparece ali.
