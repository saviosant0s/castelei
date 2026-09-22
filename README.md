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
- 3 matérias, 9 lições e 72 questões originais (Matemática Básica, Português e Sistemas Operacionais; veja `docs/sistemas-operacionais-mapa.md`)
- Lição em etapas, uma ideia por tela: analogia, passo a passo com exemplo, como cai na prova, pegadinhas e resumo
- Modo Prova: uma questão por tela, cronômetro crescente, confirmar ou pular, feedback com gabarito, explicação e pegadinha
- Resultado com acerto, tempo médio por questão, recorde de tempo e ponto fraco
- Progresso por tópico (dominado, evoluindo, revisar)
- Plano Grátis (5 questões por lição) e Plus (todas), aplicado no servidor
- PWA instalável (manifest, ícones, service worker que só guarda arquivos estáticos)
- Revisão espaçada com data de prova: o intervalo entre revisões é uma fatia do tempo que falta até a prova da matéria, então o calendário se aperta sozinho conforme ela chega (`docs/revisao-espacada.md`)
- Lembrete de revisão por notificação (Web Push), desligado por padrão e no máximo um por dia. Precisa das chaves VAPID e de um processo de cron: veja `docs/deploy-railway.md`, passo 5

## O que ficou de fora (fases seguintes do planejamento)

- Login com Google e pagamento. Por enquanto o plano se troca com `php artisan castelei:plan email plus`
- Streak, XP, ranking e conquistas (Fase 2)
- Matérias rotativas no plano grátis (só há 2 matérias)
- IA e login com Google

As questões têm três formatos. O padrão é `choice`: cinco alternativas e um `correct_index`. `format: "order"` é pôr os passos na ordem, onde as `options` são os passos **escritos na ordem certa** (o app embaralha ao mostrar) e não existe `correct_index`; use de três a seis passos. `format: "match"` é ligar os pares: em vez de `options`, traz `pairs` com `{left, right}` (de três a cinco duplas), e o app embaralha a coluna da direita.

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

## Escrevendo conteúdo

As lições ficam em `backend/database/seeders/content/*.json`. Cada lição tem `summary`, `steps` (as etapas, uma ideia por tela) e `questions`.

A matéria aceita `exam_date` (`"2026-12-15"`), opcional. Não é enfeite de calendário: é o prazo de onde sai todo intervalo de revisão — quanto mais perto a prova, mais juntas as revisões. Matéria sem data cai num plano de longo prazo. Detalhes e as fontes em `docs/revisao-espacada.md`.

Tem também `module`, opcional: o assunto que agrupa a lição na trilha da matéria (`"Processos"`, `"Memória"`). Lições **seguidas** com o mesmo nome formam um módulo, e o número ("Módulo 3") sai da ordem — não escreva o número no arquivo. Matéria curta pode ficar sem: ela vira uma trilha só. O verificador avisa se uma matéria usa módulos e esquece uma lição, ou se o mesmo nome reaparece em dois trechos separados.

Uma etapa tem:

| Campo | Para quê |
|---|---|
| `kind` | `idea` (analogia inicial, sempre a 1ª), `explain`, `exam` (uma só), `pitfall` (uma só), `recap` (sempre a última) |
| `title`, `body` | título curto e parágrafos curtos (no máximo 75 palavras somadas) |
| `example` | exemplo resolvido: `label`, `lines` (uma por passo) e `ordered` — marque quando trocar duas linhas de lugar estragaria o exemplo, e a tela desenha os passos numerados |
| `bullets` | lista de itens |
| `terms` | palavras novas explicadas nesta etapa (`word`, `meaning`) |
| `figure` | figura SVG do app: `src` (em `frontend/public/figuras/`), `alt` (texto alternativo descritivo) e `caption` |
| `code` | trecho de código: `label`, `text` (linhas curtas, até uns 36 caracteres) e `notes`, uma frase por linha de código dizendo o que ela faz (obrigatório: quem lê a lição pode nunca ter visto código) |
| `video` | vídeo: `src` (arquivo enviado pelo painel ou link do YouTube), `title`, `caption` e `poster` |

O Castelei é independente: **o conteúdo nunca cita livros, autores, capítulos ou páginas**. Livros e outras fontes servem só de base para estruturar os assuntos, e o verificador reprova qualquer referência.

Antes de enviar, rode o verificador do Guia Editorial (o CI também roda):

```bash
node scripts/lint-content.mjs
```

Ele reprova frases com mais de 2 vírgulas, "como vimos anteriormente", etapas longas demais e termos técnicos usados sem explicação prévia.

## Painel de conteúdo (`/admin`)

Dá para publicar matéria sem mexer em código: `/admin` importa um arquivo JSON
com a matéria inteira, edita lições e questões e guarda imagens e vídeos. O
guia completo está em [`docs/painel-admin.md`](docs/painel-admin.md).

Para liberar a primeira conta, defina `ADMIN_EMAILS` no backend (lista separada
por vírgula). Depois disso o caminho é o comando:

```bash
php artisan castelei:admin voce@exemplo.com    # --remover tira o acesso
```

Um detalhe que vale saber antes de usar: o `ContentSeeder` roda a cada deploy e
recarrega os arquivos de `database/seeders/content/`. Para ele não desfazer o
que foi editado no painel, cada matéria guarda de onde vem — e **a primeira
edição feita pelo painel passa a matéria para o painel de vez**. Dali em diante
o arquivo no repositório vira histórico.

## Modo de teste (sem login)

Com `GUEST_MODE=true` no frontend, as telas de entrar e cadastrar somem: cada navegador ganha automaticamente uma conta de visitante (progresso guardado no cookie do navegador, por até 30 dias). A API continua protegida por token. Para voltar ao login normal, remova a variável ou troque por qualquer outro valor.

Limites conhecidos: limpar os cookies cria um visitante novo (o progresso antigo não volta), e o cadastro na API aceita 10 contas novas por minuto por IP, então muitos visitantes novos de uma vez podem ver a mensagem de servidor indisponível.

## Como a autenticação funciona

O navegador nunca fala direto com a API. O Next guarda o token do Sanctum num cookie `httpOnly` e repassa apenas as rotas de prática (`/api/lessons/*/attempts`, `/api/attempts/*/answers`, `/api/attempts/*/finish`), colocando o token no header. Assim o token não fica exposto a JavaScript, e não há CORS para configurar.

## Deploy

Veja [`docs/deploy-railway.md`](docs/deploy-railway.md).
