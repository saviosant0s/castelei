/* Service worker do Castelei.

   Três trabalhos:
   1. deixar o app instalável e guardar os arquivos estáticos (/_next/static);
   2. guardar as PÁGINAS DE ESTUDO (lição, matéria, vocabulário, início) para
      abrirem sem internet — é o que salva quem estuda no ônibus;
   3. os lembretes de revisão (push), lá embaixo.

   O que NUNCA é guardado: respostas da API e as rotas de prática. O gabarito
   mora no servidor de propósito, então responder questão exige conexão, e a
   tela diz isso em vez de fingir que funciona.

   As páginas guardadas têm dados da conta (o progresso aparece nelas). Por isso
   o cache de páginas é APAGADO ao sair da conta, ao entrar em outra e ao
   excluir a conta — ver lib/offline.ts. Num aparelho emprestado, o próximo a
   usar não abre o que o anterior estudou. */
const CACHE = "castelei-static-v2";
const PAGINAS = "castelei-paginas-v1";

/* As telas que valem guardar: são as de LER. Prática, perfil e painel ficam de fora. */
const GUARDAVEL = /^\/(inicio|revisar|progresso|licao\/\d+|materia\/[^/]+(\/vocabulario(\/cartoes)?)?)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["/offline.html", "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== PAGINAS).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

/** Guarda um arquivo estático (nome com hash: nunca muda, pode ficar para sempre). */
async function guardarEstatico(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/*
| Uma página guardada só serve se os scripts dela também estiverem guardados:
| sem eles, a lição abre na primeira etapa e o botão "Continuar" não faz
| nada. Então, ao guardar a página, guardamos junto todo /_next/static/ que o
| HTML cita.
*/
async function guardarPagina(url) {
  const response = await fetch(url, { credentials: "same-origin", redirect: "follow" });
  if (!response.ok || response.redirected) return false;

  const html = await response.clone().text();
  const cache = await caches.open(PAGINAS);
  await cache.put(url, response);

  const estaticos = [...new Set(html.match(/\/_next\/static\/[^"'\\\s)]+/g) || [])];
  await Promise.all(estaticos.map((caminho) => guardarEstatico(new Request(caminho)).catch(() => null)));
  return true;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(guardarEstatico(request));
    return;
  }

  if (request.mode === "navigate") {
    const guardavel = GUARDAVEL.test(url.pathname) && !url.search;

    /*
    | Rede primeiro, sempre: a página guardada é o PLANO B. Com internet, a
    | pessoa vê o progresso de agora; sem internet, vê a última versão que
    | abriu — melhor que a tela de "sem conexão".
    */
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (guardavel && response.ok && !response.redirected) {
            const copia = response.clone();
            caches.open(PAGINAS).then((cache) => cache.put(url.pathname, copia));
          }
          return response;
        })
        .catch(async () => (guardavel && (await caches.match(url.pathname, { cacheName: PAGINAS }))) || caches.match("/offline.html")),
    );
  }
});

/*
| Pedidos da página:
| - "guardar": baixa uma lista de páginas (a matéria inteira) e vai contando.
| - "limpar": apaga as páginas guardadas (saiu da conta).
*/
self.addEventListener("message", (event) => {
  const dados = event.data || {};
  const responder = (m) => event.source && event.source.postMessage(m);

  if (dados.type === "limpar") {
    event.waitUntil(caches.delete(PAGINAS).then(() => responder({ type: "limpo" })));
    return;
  }

  if (dados.type === "guardar" && Array.isArray(dados.urls)) {
    event.waitUntil(
      (async () => {
        let feitas = 0;
        let falhas = 0;
        for (const url of dados.urls) {
          const ok = await guardarPagina(url).catch(() => false);
          feitas += 1;
          if (!ok) falhas += 1;
          responder({ type: "progresso", feitas, total: dados.urls.length });
        }
        responder({ type: "guardado", total: dados.urls.length, falhas });
      })(),
    );
  }
});

/*
| Lembretes de revisão.
|
| O `push` chega com o app FECHADO — é o único código do Castelei que roda sem
| ninguém olhando. Por isso tudo aqui tem plano B: payload que não é JSON,
| campo faltando, versão velha do servidor. Notificação que falha em silêncio é
| ruim; service worker que estoura no `push` pode ser desligado pelo navegador.
*/
self.addEventListener("push", (event) => {
  let aviso = {};
  try {
    aviso = event.data ? event.data.json() : {};
  } catch {
    aviso = {};
  }

  const titulo = aviso.title || "Hora de revisar";
  const opcoes = {
    body: aviso.body || "Você tem lição esperando revisão.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    /*
      A mesma etiqueta todo dia: o aviso de hoje SUBSTITUI o de ontem em vez de
      empilhar. Cinco avisos parados na barra é o que faz alguém desligar tudo.
    */
    tag: aviso.tag || "castelei-revisao",
    data: { url: aviso.url || "/revisar" },
    /*
      Sem vibração e sem som próprio: isto toca no bolso de alguém em sala de
      aula. O padrão do sistema já basta.
    */
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || "/revisar";

  /*
  | Se o app já estiver aberto numa aba, REAPROVEITA em vez de abrir outra.
  | Sem isto, quem toca no aviso todo dia acumula abas do mesmo app.
  */
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((abas) => {
      for (const aba of abas) {
        if (new URL(aba.url).origin === self.location.origin && "focus" in aba) {
          aba.navigate(destino);
          return aba.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});

/*
| O navegador pode trocar as chaves da assinatura sozinho. Quando isso acontece,
| a assinatura antiga para de funcionar em silêncio — e a pessoa acha que
| desligou o lembrete sem ter desligado.
*/
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const antiga = event.oldSubscription;
        const nova =
          event.newSubscription ||
          (await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: antiga && antiga.options && antiga.options.applicationServerKey,
          }));

        await fetch("/api/push/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nova.toJSON()),
        });
      } catch {
        // Sem app aberto não há a quem avisar: na próxima visita o Perfil reassina.
      }
    })(),
  );
});
