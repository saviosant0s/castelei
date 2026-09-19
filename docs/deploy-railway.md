# Colocando o Castelei no ar (Railway)

O Railway roda **três serviços** no mesmo projeto, todos a partir deste repositório: o banco PostgreSQL, a API (`backend/`) e o app (`frontend/`). Os nomes de menus abaixo podem mudar um pouco com o tempo; se algo não bater, a documentação do Railway (docs.railway.com) tem os guias de Laravel e de Next.js.

## 0. Antes de começar

- Repositório no GitHub com este código enviado.
- Conta no Railway (railway.com) ligada ao seu GitHub.
- Uma chave para o Laravel. Gere no terminal (não precisa de PHP):

  ```bash
  echo "base64:$(openssl rand -base64 32)"
  ```

## 1. Criar o projeto e o banco

1. **New Project → Deploy from GitHub repo** e escolha `castelei`. Autorize o app do Railway no GitHub se ele pedir.
2. O Railway vai criar um serviço a partir da raiz do repositório. Você vai transformá-lo no backend (passo 2). Se ele falhar o primeiro build, é esperado: ainda falta apontar a pasta.
3. Adicione o banco: **New → Database → Add PostgreSQL**.

## 2. Serviço do backend (Laravel)

No serviço criado, abra **Settings**:

- **Source → Root Directory:** `/backend`. O Railway detecta o Laravel sozinho e sobe com PHP e Caddy. O arquivo `backend/railway.json` já define o pre-deploy e o health check.
- **Networking → Generate Domain:** por padrão o serviço não é público. Copie a URL gerada (algo como `https://backend-production-xxxx.up.railway.app`).

Em **Variables** (dica: use o *Raw Editor* e cole tudo de uma vez, trocando `Postgres` pelo nome do seu serviço de banco, se for diferente):

```
APP_NAME=Castelei
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:COLE_A_CHAVE_GERADA_NO_PASSO_0
APP_URL=https://SEU-BACKEND.up.railway.app
APP_LOCALE=pt_BR
LOG_CHANNEL=stderr
DB_CONNECTION=pgsql
DB_URL=${{Postgres.DATABASE_URL}}
SESSION_DRIVER=array
CACHE_STORE=database
```

O pre-deploy (`php artisan castelei:setup`) roda as migrations e carrega as lições **a cada deploy**, em um container separado com acesso às variáveis. Se ele falhar, o deploy não segue, então olhe os logs do deploy. O carregamento do conteúdo é idempotente: não duplica nada.

Teste: abra `https://SEU-BACKEND.up.railway.app/up` (deve responder 200) e `https://SEU-BACKEND.up.railway.app/` (deve mostrar `{"name":"Castelei API","status":"ok"}`).

## 3. Serviço do frontend (Next.js)

1. **New → GitHub Repo → `castelei`** de novo, para criar um segundo serviço.
2. **Settings → Source → Root Directory:** `/frontend`.
3. **Variables:**

   ```
   API_URL=https://SEU-BACKEND.up.railway.app/api
   ```

   Não coloque essa variável como pública: ela só é usada no servidor do Next.
   Para testes sem login, acrescente também `GUEST_MODE=true` (veja o README).
4. **Settings → Networking → Generate Domain.** Essa é a URL que você abre e compartilha.
5. Faça o redeploy se as variáveis foram criadas depois do primeiro build.

Abra a URL do frontend, crie uma conta e faça uma lição de ponta a ponta.

## 4. Domínio próprio (opcional)

No serviço do **frontend**: Settings → Networking → Custom Domain. Aponte o DNS como o Railway indicar. O backend não precisa de domínio próprio.

## 5. Mudando o plano de alguém (enquanto não há pagamento)

No serviço do backend, abra um shell (Railway CLI: `railway ssh`, ou o comando "Run" do painel) e rode:

```bash
php artisan castelei:plan email@exemplo.com plus
```

## Problemas comuns

| Sintoma | O que olhar |
|---|---|
| Backend: build falha logo no primeiro deploy | Root Directory ainda não está em `/backend` |
| Backend: pre-deploy falha | Variável `DB_URL` (referência ao Postgres) ou `DB_CONNECTION=pgsql` faltando |
| Backend responde 500 | `APP_KEY` vazia ou inválida; veja os logs (`LOG_CHANNEL=stderr` joga tudo neles) |
| Frontend abre, mas login dá "Não deu para falar com o servidor" | `API_URL` errada (precisa terminar em `/api`) ou backend fora do ar |
| Deu certo localmente e não no Railway | Compare as variáveis; o app lê `API_URL` só no servidor |

## Segurança

- O token da API fica num cookie `httpOnly`; o navegador nunca o lê.
- A API é pública (tem domínio), mas todas as rotas de dados exigem token e login/cadastro têm limite de tentativas.
- Nunca commite `.env`. O `.gitignore` já ignora.
