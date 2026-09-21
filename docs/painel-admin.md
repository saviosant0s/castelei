# Painel de conteúdo (`/admin`)

Publicar matéria sem mexer em código e sem esperar deploy. O fluxo que ele
serve é este:

> pede o arquivo para uma IA → confere no painel → importa → está no ar.

## Como entrar

O painel usa a **mesma conta do app**. Não existe usuário separado de
administrador: o que existe é uma permissão na conta.

Duas portas, e as duas valem ao mesmo tempo:

| Porta | Quando usar |
|---|---|
| Variável `ADMIN_EMAILS` no backend | **primeiro acesso**. Uma lista separada por vírgula. No Railway dá para criar uma variável pelo navegador. |
| `php artisan castelei:admin email@exemplo.com` | o caminho normal, depois que já há CLI à mão. `--remover` tira o acesso. |

A conta precisa existir antes: cadastre-se no app e depois libere o acesso.

Em produção, com `GUEST_MODE=true`, o app cria contas de visitante sozinho — e
**nenhuma delas entra no painel**. A conta de visitante nasce sem permissão, e
o painel escreve no conteúdo que todos os alunos veem.

Quem administra vê um atalho para o painel na tela de Perfil.

## As telas

| Tela | Para quê |
|---|---|
| `/admin` | todas as matérias, com contagem de lições e questões |
| `/admin/importar` | enviar o arquivo da matéria e baixar o modelo |
| `/admin/midia` | enviar imagem e vídeo, e copiar o endereço deles |
| `/admin/materia/[id]` | lições da matéria: ordem, criação, exclusão |
| `/admin/licao/[id]` | o texto da lição (etapas) e as questões |

## Quem manda em cada matéria: `seed` × `painel`

Este é o ponto que mais importa entender.

O `ContentSeeder` roda no **pre-deploy** do Railway e recarrega os arquivos de
`backend/database/seeders/content/*.json`. Ele roda *depois* de qualquer
edição feita no painel. Sem nenhuma proteção, toda edição voltaria atrás
sozinha no deploy seguinte — sem erro, sem aviso, sem nada que explicasse.

Por isso cada matéria carrega uma marca de origem:

- **`seed`** — vem dos arquivos do repositório. O deploy recarrega ela.
- **`painel`** — foi editada aqui. O deploy **não encosta** mais nela.

A troca acontece na **primeira escrita feita pelo painel** naquela matéria,
inclusive numa lição ou numa questão dela. Daí em diante, o arquivo no
repositório vira histórico: ele continua lá, mas não manda mais.

O selo ao lado do nome da matéria diz em que estado ela está, e a tela avisa
antes da primeira edição.

**Consequência prática:** depois de editar Sistemas Operacionais pelo painel,
mudar o JSON dela no repositório não faz mais efeito. Para voltar a usar o
arquivo, é preciso trocar `origin` de volta para `seed` no banco.

## O arquivo de conteúdo

O modelo comentado sai em **Importar → Baixar o modelo**. Ele é um arquivo
válido de verdade: passa na própria conferência do painel, sem erro nem
ressalva.

Toda chave começada por `_` é comentário e é ignorada na importação. É assim
que o modelo se explica, já que JSON não tem comentário.

### O que é erro e o que é aviso

A régua do painel é mais larga que a de `scripts/lint-content.mjs`, e de
propósito: o verificador é para quem escreve com o ambiente de
desenvolvimento montado, e o painel existe justamente para publicar sem ele.

**Erro** impede a importação. É o que faria a tela quebrar ou mentir:

- campo obrigatório faltando ou com tipo errado;
- `correct_index` apontando para uma alternativa que não existe;
- menos de duas alternativas, ou alternativas repetidas;
- dois slugs iguais na mesma matéria;
- figura sem `alt`, ou com `alt` curto demais para descrever o que se vê;
- linha de tabela com número de células diferente do de colunas.

**Aviso** deixa passar, e aparece no relatório:

- a lição não abre com `idea` nem fecha com `recap`;
- falta (ou sobra) a etapa `exam` ou `pitfall`;
- menos de 6 etapas;
- número de alternativas diferente de 5;
- número de questões diferente de 8 — o site público anuncia 8 por lição.

Cada apontamento vem com o endereço dentro do arquivo
(`lessons[3].questions[2].correct_index`), para achar o erro sem reler tudo.

### Identidade: o que nunca se troca

- Matéria identificada por **slug**.
- Lição identificada por **(matéria, slug)**.
- Questão identificada por **(lição, posição)**.

Por isso reimportar o mesmo arquivo não duplica nada — atualiza o que mudou. E
por isso o slug não é editável depois de criado: trocá-lo não renomearia nada,
criaria outra coisa e deixaria a antiga para trás com as tentativas dos alunos
presas nela.

### Módulos: como a matéria vira trilha

A tela da matéria agrupa as lições em módulos e desenha cada um como uma
trilha em ziguezague. Quem decide o agrupamento é quem escreve o conteúdo,
pelo campo `module` da lição — no arquivo JSON ou no campo "Módulo" do painel.

Três regras, e todas existem para o mesmo fim: o arquivo não pode mentir sobre
a ordem do estudo.

- **Guarde o nome, nunca o número.** Escreva `"Processos"`, não
  `"Módulo 2 — Processos"`. O número sai da ordem das lições na hora de
  mostrar. Se ele morasse no arquivo, reordenar a matéria deixaria um
  "Módulo 5" antes do 4.
- **Módulo é trecho, não etiqueta.** Lições **seguidas** com o mesmo nome
  formam um módulo. O mesmo nome reaparecendo lá na frente abre outro grupo,
  em vez de puxar a lição de volta para cima — a trilha segue a ordem de
  estudo, e nenhuma lição pode aparecer fora dela.
- **O campo é opcional.** Matéria de duas lições não precisa de módulo: ela
  vira uma trilha só, sem cabeçalho. Mas, se a matéria usa módulos, use em
  todas — uma lição sem módulo no meio abre um bloco sem título.

As duas últimas são convenção editorial, não regra de banco: o app funciona
igual. Quem reclama delas é o `scripts/lint-content.mjs`, com aviso.

### Quando o arquivo encolhe

Nada é apagado por conta própria. Se o arquivo tem menos lições ou menos
questões do que já existe no app, o relatório aponta o que sobrou e as duas
coisas continuam no ar.

Para apagar de verdade, marque **"apagar o que não está no arquivo"**. Vale
saber o que isso leva junto: apagar uma questão apaga as respostas dela, e
apagar uma lição apaga as tentativas de quem já estudou.

O botão **"Conferir sem publicar"** roda a mesma validação e não grava nada.

## Imagem e vídeo

A biblioteca em `/admin/midia` guarda o arquivo e devolve o endereço para
colar dentro da etapa:

```json
"figure": { "src": "https://…/api/media/midia/images/x-a1b2c3.png", "alt": "…" }
"video":  { "src": "https://www.youtube.com/watch?v=…", "title": "…" }
```

O campo `video` aceita os dois caminhos:

- **arquivo enviado aqui** — toca no próprio app;
- **link do YouTube** — vira quadro incorporado. O link da barra de endereços
  funciona: o app reescreve para o endereço de incorporação, no domínio sem
  cookie de rastreio.

As figuras antigas das lições continuam onde estavam, em
`frontend/public/figuras/`. Endereço que começa com `/` é servido pelo próprio
app e não passa por aqui.

### Onde o arquivo mora

O disco do contêiner do Railway **é descartado a cada deploy**, então a mídia
precisa de um lugar que sobreviva. Hoje isso é o volume `midia`, montado no
serviço `backend` em `/app/storage/app/public`.

Para trocar por armazenamento externo: `MEDIA_DISK=s3` e as variáveis `AWS_*`
(vale para S3, Cloudflare R2 e compatíveis). Nada no código muda — a rota de
entrega passa a redirecionar para o disco externo em vez de servir o arquivo.

### Por que a entrega é uma rota, e não `public/storage`

O jeito normal do Laravel é um atalho em `public/storage`, criado por
`php artisan storage:link`. Aqui ele não funciona: esse comando rodaria no
pre-deploy do Railway, que acontece **num contêiner separado e descartável**,
antes de o volume ser montado. O atalho morre com esse contêiner e nunca chega
ao que atende as requisições.

O sintoma seria cruel: o log do deploy diz *"link has been connected"* e toda
imagem responde 404.

Por isso a entrega é a rota `GET /api/media/{caminho}`
(`MediaFileController`). Ela não depende de atalho, responde a pedidos de
trecho — que é o que deixa adiantar um vídeo —, e manda o navegador guardar o
arquivo para sempre, o que é seguro porque todo nome ganha um sufixo aleatório
ao ser enviado.

### Limites

| Variável | Padrão | O que é |
|---|---|---|
| `MEDIA_MAX_IMAGE_KB` | 4096 (4 MB) | PNG, JPEG, WebP, GIF, SVG |
| `MEDIA_MAX_VIDEO_KB` | 51200 (50 MB) | MP4, WebM, OGG |

Vídeo maior que isso: hospede no YouTube e cole o link. Hospedar aula inteira
sairia caro e ainda teria que resolver sozinho legenda, qualidade e conexão
ruim.

## A vitrine se anuncia sozinha

Matéria criada pelo painel aparece em `/materias` e na home sem ninguém editar
código. A vitrine lê de `GET /api/catalog`, uma rota pública que devolve só
nome de matéria e título de lição — enunciado e gabarito continuam atrás da
sessão.

Leva **até um minuto** para aparecer: a página guarda a resposta em cache por
esse tempo, para não bater no backend a cada visita.

Duas coisas continuam vindo do arquivo `frontend/src/lib/site-content.ts`:

- **A frase de vitrine** (`pitch`). É texto de venda, escrito com capricho, e
  não existe no banco: *"A base que volta em toda prova de exatas, explicada do
  começo — inclusive o passo que todo mundo pula"*. Matéria que já tem a sua
  mantém a sua. Matéria nova se anuncia com a própria descrição — então vale
  caprichar na descrição ao criar.
- **A lista inteira, como rede de segurança.** Se a API falhar, demorar mais de
  2,5 s ou responder algo estranho, a página vai ao ar com ela em vez de mostrar
  erro. A vitrine é a porta de entrada e a página que o Google indexa: ela não
  pode depender de o backend estar de pé. Por isso o teste `site-content.test.ts`
  continua exigindo que a lista fique igual aos arquivos do repositório — ela
  iria ao ar exatamente no dia em que a API estivesse fora.

O número "8 questões por lição" também deixou de ser fixo: a rota diz quantas
são, e responde nulo quando não é o mesmo número em toda lição. Aí a vitrine
para de prometer um número, em vez de mentir.

## Como o acesso é barrado

Em camadas, e a que conta é a de baixo:

1. **A API** — toda rota `/api/admin/*` passa por `auth:sanctum` e pelo
   middleware `admin`. É esta que barra de verdade.
2. **O proxy do Next** (`/api/admin/[...path]`) — repassa a chamada com o
   token que está no cookie `httpOnly`. O navegador continua sem falar com a
   API direto, e o token continua fora do alcance do JavaScript. Repassar não
   é autorizar.
3. **A tela** (`(painel)/layout.tsx`) — decide entre mandar para o login e
   explicar que a conta não tem permissão. É conforto, não tranca: sem ela a
   pessoa veria um 403 no meio de uma tela em branco.

## Levar uma matéria para um arquivo

Na tela da matéria, **Baixar esta matéria** entrega o conteúdo inteiro no mesmo
formato da importação: lições, etapas, questões, módulos e data da prova.

É o caminho de volta. Sem ele, matéria escrita aqui fica presa no banco — não dá
para versionar no Git, não passa pelo `scripts/lint-content.mjs` e ninguém
consegue revisar num editor de texto.

O arquivo **entra de volta pela importação sem perda**, e reimportar não duplica
nada (a lição é reconhecida pelo slug, a questão pela posição). Um teste
(`SubjectExportTest`) garante isso comparando exportar → reimportar → exportar.

Dois usos além da cópia de segurança:

- **Editar fora do painel.** Para mexer em muita coisa de uma vez, ou para pôr
  figuras e tabelas em várias lições, é mais rápido no arquivo.
- **Trazer para o repositório.** Uma matéria boa merece virar arquivo em
  `backend/database/seeders/content/`. Atenção: a matéria fica com
  `origin = painel` e o `ContentSeeder` **pula** ela — é assim que o deploy não
  passa por cima das suas edições. Para o arquivo voltar a mandar, a coluna
  precisa voltar para `seed`.

## Por que a sua lição ficou só texto

Escrever pelo painel puxa para o parágrafo: o editor de etapas é um campo de
JSON, então pôr uma figura dá trabalho e escrever mais um parágrafo não dá.

O verificador avisa quando isso acontece ("a lição é só texto corrido"), mas o
aviso não escreve a figura. Os blocos que quebram o paredão são `figure`,
`video`, `table`, `code`, `example`, `bullets` e `terms` — o formato de cada um
está no `README.md` e no modelo comentado.
