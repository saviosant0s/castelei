/* Service worker mínimo: deixa o app instalável e cacheia só arquivos estáticos.
   Páginas e respostas da API NUNCA são cacheadas (têm dados da conta). */
const CACHE = "castelei-static-v1";

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
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
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
