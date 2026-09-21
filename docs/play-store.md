# Lançar o Castelei na Google Play

Guia de ponta a ponta. O caminho é **TWA** (Trusted Web Activity): o app da loja
é uma casca fina do Android que abre o PWA em tela cheia, sem barra de
navegador. Não é WebView velha — é o próprio Chrome do aparelho, então o app é
o mesmo que já está no ar e uma correção entra sem passar pela loja de novo.

O que está marcado **🧑 Sávio** só você pode fazer: envolve dinheiro, documento,
senha ou a sua identidade. O resto já está pronto no código.

---

## Antes de tudo: duas decisões

### 1. O domínio

O TWA amarra o app a **um domínio**, e essa amarração é a prova de que o app e
o site são da mesma pessoa. Hoje o app vive em
`frontend-production-3c7da.up.railway.app`.

Funciona, mas tem dois problemas: se a Railway trocar esse subdomínio, o app da
loja quebra na mão de quem já instalou; e o endereço aparece para o usuário em
alguns momentos, o que não ajuda a parecer produto sério.

**Recomendação:** registrar um domínio (`castelei.com.br` no Registro.br custa
cerca de R$ 40/ano) e apontar para a Railway antes de publicar. Trocar de
domínio **depois** de publicado dá trabalho: exige nova verificação e uma
atualização do app na loja.

### 2. O nome do pacote (`applicationId`)

É o identificador permanente do app no Android. **Não dá para mudar depois de
publicado** — mudar significa publicar outro app e perder instalações e
avaliações.

Sugestão: `br.com.castelei.app`.

### 3. O e-mail de contato

A Play exige um e-mail de suporte público na ficha do app. Ele também aparece
na Política de Privacidade (variável `CONTACT_EMAIL`).

---

## O que já está pronto no código

| Item | Onde | Estado |
|---|---|---|
| PWA instalável, `display: standalone` | `frontend/src/app/manifest.ts` | ✅ |
| Ícones 192, 512 e maskable | `frontend/public/icons/` | ✅ |
| Atalhos de ícone (long-press) | `manifest.ts` | ✅ |
| Abertura sem tela branca | `components/AppLaunch.tsx` | ✅ |
| Service worker e tela offline | `public/sw.js`, `public/offline.html` | ✅ |
| Política de Privacidade pública | `/privacidade` | ✅ |
| Excluir a conta pelo app | Perfil → Sua conta | ✅ |
| Página pública de exclusão | `/excluir-conta` | ✅ |
| Digital Asset Links | `/.well-known/assetlinks.json` | ✅ (falta a impressão digital) |

O `assetlinks.json` lê duas variáveis de ambiente e devolve 404 enquanto elas
não existirem — de propósito, porque um arquivo vazio o Android leria como
"não confere".

---

## Passo a passo

### 1. 🧑 Conta de desenvolvedor

1. <https://play.google.com/console/signup>
2. Pague a taxa única de **US$ 25**.
3. Escolha o tipo de conta:
   - **Pessoal:** mais simples, mas cai na regra dos 12 testadores (passo 6).
   - **Organização:** exige CNPJ e número D-U-N-S, demora mais para verificar,
     mas **fica isenta** da regra dos 12 testadores.
4. Verificação de identidade: documento com foto e endereço. Pode levar dias.

> Se você tem (ou consegue) CNPJ de MEI, a conta de organização economiza duas
> semanas de espera e o trabalho de arrumar 12 testadores. Vale pensar.

### 2. 🧑 Criar o app no Play Console

Criar app → nome **Castelei**, idioma padrão **Português (Brasil)**, tipo
**Aplicativo**, **Gratuito**.

> Marcar como gratuito é definitivo: um app gratuito nunca vira pago. Os planos
> pagos entram depois como compras dentro do app, o que não exige mudar isso.

### 3. Gerar o pacote (.aab)

Dois caminhos. O primeiro é mais simples e é o que eu recomendo para começar.

**Caminho A — PWABuilder (mais simples)**

1. <https://www.pwabuilder.com> → cole a URL do app → **Package for stores** →
   **Android**.
2. Preencha:
   - Package ID: `br.com.castelei.app`
   - App name: `Castelei`
   - Launcher name: `Castelei`
   - Start URL: `/inicio`
   - Signing key: **Create new** (o PWABuilder cria e devolve junto)
3. Baixe o `.zip`. Dentro vêm o `.aab`, o **keystore** e um
   `signing-key-info.txt` com as senhas.

> ⚠️ **Guarde o keystore e as senhas em lugar seguro** (gerenciador de senhas,
> não no repositório e não no Git). Perder o keystore significa não conseguir
> mais atualizar o app. Nunca commite esses arquivos.

**Caminho B — Bubblewrap (mais controle)**

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://SEU-DOMINIO/manifest.webmanifest
bubblewrap build
```

Ele baixa o JDK e o Android SDK sozinho na primeira vez (~1 GB) e pergunta as
mesmas coisas do caminho A, incluindo a senha do keystore.

**⚠️ Vale para os dois caminhos:** desde 31/08/2026 a Play exige
`targetSdkVersion 36` (Android 16) em envio novo, e o modelo do Bubblewrap
ainda vinha com 35. Confira em `android/app/build.gradle` e, se estiver 35,
troque para 36 e gere de novo. Se travar, dá para pedir prorrogação no próprio
Play Console (disponível até 01/11/2026).

### 4. 🧑 Ligar o Digital Asset Links

É o passo que tira a barra do navegador de cima do app. Sem ele, o Castelei
abre parecendo um site dentro de uma janela — exatamente o que não queremos.

1. No Play Console: **Configuração → Integridade do app → Assinatura de app**.
2. Copie o **SHA-256 do certificado de assinatura do app** (o do Google, não o
   do seu keystore — com o App Signing ligado, quem assina o que chega ao
   celular é o Google).
3. Na Railway, no serviço **frontend**, crie:

   | Variável | Valor |
   |---|---|
   | `ANDROID_CERT_FINGERPRINTS` | o SHA-256 copiado (`AB:CD:...`) |
   | `ANDROID_PACKAGE_NAME` | `br.com.castelei.app` |

4. Espere o redeploy e confira:

```bash
curl https://SEU-DOMINIO/.well-known/assetlinks.json
```

5. Valide no verificador do Google:
   <https://developers.google.com/digital-asset-links/tools/generator>

> Se você também for testar o `.apk` assinado localmente, junte a sua própria
> impressão digital à do Google, separadas por vírgula — a variável aceita
> várias.

### 5. Ficha da loja

| Item | Requisito | Situação |
|---|---|---|
| Ícone | 512×512 PNG, sem transparência | usar `frontend/public/icons/icon-512.png` |
| Gráfico de destaque | **1024×500**, PNG ou JPEG, **sem transparência** | modelo em `docs/play-store/feature-graphic.html` |
| Capturas de tela | 2 a 8, celular | 🧑 tirar no seu celular |
| Descrição curta | até 80 caracteres | texto abaixo |
| Descrição completa | até 4000 caracteres | texto abaixo |
| Política de Privacidade | URL pública | `https://SEU-DOMINIO/privacidade` |

**Descrição curta** (73 caracteres):

```
Estude do jeito que a prova pergunta: explicação humana e treino real.
```

**Descrição completa:**

```
O Castelei ensina o conteúdo e a linguagem da prova.

Cada lição é uma sequência de telas curtas, uma ideia por vez, escrita para
quem está começando do zero. Sem decoreba, sem parágrafo gigante: analogia
antes de definição, exemplo antes de regra.

Depois de entender, você treina no Modo Prova — questões no formato que as
bancas usam, com cronômetro e, no fim, a explicação de cada resposta e a
pegadinha que costuma derrubar.

O que você encontra:

• Lições em etapas, feitas para iniciante
• Modo Prova com cronômetro e correção comentada
• Simulado da matéria inteira, com questões sorteadas entre as lições
• Progresso por tópico: o que você já domina e o que vale revisar
• Gráficos de evolução de acerto e de tempo
• Dias seguidos de estudo, XP e conquistas
• Funciona como aplicativo, direto na tela inicial

Matérias disponíveis: Matemática Básica, Português e Sistemas Operacionais.
Novas matérias entram sempre.
```

**Capturas de tela — as 4 telas que valem a pena mostrar**, nesta ordem:

1. `/inicio` — a cara do app e as matérias
2. uma lição aberta, numa etapa com figura
3. o Modo Prova com o cronômetro rodando
4. `/progresso/evolucao` — os gráficos

Tire com a tela do celular já no app instalado (sem a barra do navegador), em
retrato. Mínimo de 320 px e máximo de 3840 px no lado maior.

### 6. 🧑 Teste fechado — a parte mais demorada

Se a conta for **pessoal criada depois de 13/11/2023**, a Play exige, antes de
liberar a produção:

- **12 testadores** inscritos no teste fechado;
- **14 dias seguidos** com esses 12 inscritos, sem cair abaixo disso.

Conta de organização não passa por isso.

Como fazer: **Teste → Teste fechado → criar uma versão**, subir o `.aab`, criar
uma lista de e-mails (precisam ser contas Google) e mandar o link de adesão.
Peça para a galera do IFBA — 12 pessoas que aceitem instalar e deixar instalado
por duas semanas.

> Comece esse relógio cedo. É o que separa "tudo pronto" de "publicado".

### 7. 🧑 Formulário de Segurança de Dados

**Política do app → Segurança de dados.** As respostas, conferidas contra o que
o sistema realmente faz hoje:

| Pergunta | Resposta |
|---|---|
| O app coleta ou compartilha dados? | **Sim, coleta** |
| Os dados são criptografados em trânsito? | **Sim** (todo o tráfego é HTTPS) |
| Dá para pedir exclusão dos dados? | **Sim** |
| Compartilha dados com terceiros? | **Não** |

Tipos de dados a marcar:

| Tipo | Coletado | Obrigatório | Finalidade |
|---|---|---|---|
| Nome | Sim | Sim | Funcionalidade do app, Gerenciamento de conta |
| E-mail | Sim | Sim | Funcionalidade do app, Gerenciamento de conta |
| Interações no app | Sim | Sim | Funcionalidade do app, Análises |

**Não** marque: localização, contatos, fotos, arquivos, mensagens, saúde,
financeiro, identificadores de publicidade, histórico de navegação. O app não
toca em nada disso.

> As fontes são servidas pelo próprio app (`@fontsource`), não por CDN de
> terceiros. Isso é o que permite responder "não compartilha" com sinceridade.

### 8. 🧑 Classificação de conteúdo

**Política do app → Classificação de conteúdo.** Categoria: **Referência,
notícias ou educação**. Responda **Não** para violência, sexo, linguagem
imprópria, drogas, jogos de azar e compras dentro do app (enquanto não houver
pagamento integrado). O resultado deve sair **Livre**.

### 9. 🧑 Publicar

Depois dos 14 dias, **Teste fechado → Aplicar para produção**. A primeira
revisão costuma levar de alguns dias a duas semanas.

---

### Exclusão de conta — onde declarar

A Play cobra isso em dois lugares, e os dois já têm resposta:

- **Segurança de dados → "Os usuários podem solicitar a exclusão dos dados?"**
  → Sim. URL: `https://SEU-DOMINIO/excluir-conta`
- **Ficha do app → URL de exclusão de conta** → a mesma URL.

Dentro do app o caminho é **Perfil → Sua conta → Excluir minha conta**, com
confirmação em dois passos. Apaga cadastro, histórico, XP, streak e conquistas.

---

## O que ainda não existe e pode ser cobrado

- **Termos de Uso.** Não é obrigatório agora, mas passa a ser quando houver
  cobrança.

---

## Pagamento: decisão tomada

**O Sávio decidiu usar o faturamento do próprio Google Play** — aquele pop-up
que abre por cima do app, sem sair dele. Não é só preferência: para venda de
conteúdo digital dentro de um app da loja, o Google **exige** o faturamento
dele, com taxa. Gateway por fora dá remoção do app.

Isso entra **depois do lançamento**, e não agora. O que fica registrado aqui é
o que a decisão implica, para quando chegar a hora.

### O detalhe que muda tudo: dentro de um TWA é diferente

O Castelei na loja é um TWA — uma página web em tela cheia. O jeito normal de
cobrar no Android (a biblioteca Play Billing, em Kotlin/Java) **não existe**
numa página web. O caminho para TWA é outro:

- **Digital Goods API + Payment Request**, que é a ponte do navegador para o
  faturamento do Play. É oficial e funciona, mas **só dentro do app da loja**.
- O app precisa ser gerado **com o faturamento ligado**. No Bubblewrap, são
  duas chaves no `twa-manifest.json`: `alphaDependencies` e o recurso
  `playBilling`, seguidas de `bubblewrap update` e `bubblewrap build`. É isso
  que acrescenta a permissão `com.android.vending.BILLING`. Ou seja: **gerar o
  `.aab` de novo** — mais um motivo para guardar o keystore.
- **No site aberto no navegador não há Play Billing.** Quem entrar pelo
  endereço web não vê botão de comprar, ou vê um aviso mandando usar o app.
  O código vai precisar detectar isso: `'getDigitalGoodsService' in window`.

### O que vai precisar ser feito, na ordem

1. 🧑 Criar os produtos (assinaturas Plus e Pro) no Play Console, com preço em
   real e o mesmo identificador que o código vai usar.
2. Ligar o faturamento no `twa-manifest.json` e gerar um `.aab` novo.
3. Escrever a tela de compra usando a Digital Goods API, com o caminho
   alternativo para quem está no navegador.
4. **Validar a compra no servidor.** O aplicativo manda o *purchase token*
   para a API do Castelei, e o Laravel confere esse token na Google Play
   Developer API antes de mudar o plano do usuário. Sem essa conferência, o
   plano é liberável por qualquer um que mexa no navegador — o cliente nunca
   é fonte de verdade para pagamento.
5. Tratar a renovação e o cancelamento (a assinatura vence, o Google avisa por
   *Real-time developer notifications*).
6. 🧑 Preencher os **Termos de Uso** e refazer a **Classificação de conteúdo**
   e a ficha de **Segurança de Dados**, que mudam quando existe compra.

A parte boa do desenho atual: o plano já está guardado em cada usuário e o
limite de questões já é decidido no servidor (`Plans::effective()`). O dia da
cobrança não mexe nas telas de estudo — mexe em quem tem direito a quê.

Documentação para consultar na hora:
[Play Billing em TWA](https://developer.chrome.com/docs/android/trusted-web-activity/play-billing/),
[receber pagamentos com Digital Goods API](https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing)
e o [exemplo completo do Google](https://github.com/chromeos/pwa-play-billing).

---

## Resumo do que é seu

1. Decidir domínio, nome de pacote e e-mail de contato
2. Criar e verificar a conta de desenvolvedor (US$ 25)
3. Gerar o `.aab` e **guardar o keystore em lugar seguro**
4. Copiar o SHA-256 e criar as duas variáveis na Railway
5. Tirar as 4 capturas de tela no celular
6. Juntar 12 testadores e segurar 14 dias
7. Preencher Segurança de Dados e Classificação de Conteúdo
8. Aplicar para produção

O resto eu faço.
