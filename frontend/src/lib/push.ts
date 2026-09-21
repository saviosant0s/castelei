/*
| Lembretes de revisão, do lado do navegador.
|
| As partes puras ficam aqui, longe do componente: a conversão da chave VAPID é
| o tipo de código que erra em silêncio (uma chave malformada não estoura — o
| navegador só recusa a assinatura) e merece teste direto.
*/

export type PushEstado =
  | "carregando"
  | "indisponivel" // o navegador não sabe fazer isso (iPhone fora da tela de início, por exemplo)
  | "desligado_no_servidor" // sem chaves VAPID: a função não existe neste servidor
  | "negado" // a pessoa bloqueou a permissão, e só ela pode desfazer isso
  | "ligado"
  | "desligado";

/**
 * A chave VAPID vem em base64url e o navegador quer bytes.
 *
 * `atob` não entende `-` e `_`, e não tolera a falta do preenchimento com `=`.
 * Passar a chave crua faz a assinatura falhar sem erro nenhum.
 */
export function chaveParaBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const preenchimento = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + preenchimento).replace(/-/g, "+").replace(/_/g, "/");
  const cru = atob(base64);
  /*
  | O `ArrayBuffer` vem explícito porque `pushManager.subscribe` exige um
  | buffer não compartilhado. `new Uint8Array(n)` tem tipo `ArrayBufferLike`,
  | que inclui `SharedArrayBuffer` e não passa na assinatura da API.
  */
  const bytes = new Uint8Array(new ArrayBuffer(cru.length));

  for (let i = 0; i < cru.length; i++) bytes[i] = cru.charCodeAt(i);

  return bytes;
}

/** O navegador sabe receber notificação? Safari antigo e iPhone fora da tela de início não sabem. */
export function suportado(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * O service worker ativo, ou null se ele não vier.
 *
 * `navigator.serviceWorker.ready` é uma promessa que **nunca** se resolve
 * enquanto não houver um service worker ativo — não rejeita, não expira, só
 * fica pendurada. Sem este prazo, a tela ficaria em "Verificando…" para sempre
 * em toda situação em que o registro falhou: aba anônima, navegador com o
 * recurso desligado, registro que não pegou.
 *
 * Em desenvolvimento isso acontece SEMPRE, porque o registro só roda em
 * produção — e foi assim que o problema apareceu.
 */
export async function registroPronto(prazoMs = 3000): Promise<ServiceWorkerRegistration | null> {
  if (!suportado()) return null;

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), prazoMs)),
  ]);
}

/**
 * A frase que explica o estado para quem está olhando.
 *
 * "negado" é o caso que mais confunde: o app NÃO consegue reverter isso, e
 * fingir que consegue (mostrando um botão que não faz nada) é pior do que
 * dizer onde mexer.
 */
export function explicacao(estado: PushEstado): string {
  switch (estado) {
    case "ligado":
      return "Você recebe um aviso quando tem lição esperando revisão. No máximo um por dia.";
    case "desligado":
      return "Ligue para receber um aviso quando alguma lição vencer. No máximo um por dia.";
    case "negado":
      return "As notificações estão bloqueadas para o Castelei neste aparelho. Só dá para liberar nos ajustes do navegador.";
    case "indisponivel":
      return "Este navegador não recebe notificações. No iPhone, funciona depois de adicionar o Castelei à tela de início.";
    case "desligado_no_servidor":
      return "Os lembretes ainda não estão ligados neste servidor.";
    case "carregando":
      return "Verificando…";
  }
}
