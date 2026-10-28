/*
| O convite do navegador para instalar o app.
|
| O Chrome dispara `beforeinstallprompt` UMA vez, logo que a página carrega.
| O botão de instalar mora no Perfil, e escutava só quando o Perfil abria —
| ou seja, quase sempre depois de o evento já ter passado. Era por isso que o
| menu do Chrome oferecia "Instalar app" e o nosso botão nunca aparecia.
|
| Agora quem escuta é este módulo, carregado na abertura do app (ver
| ServiceWorkerRegister), e o evento fica guardado até alguém usá-lo.
*/
export type InstallPromptEvent = Event & { prompt: () => Promise<void> };

let guardado: InstallPromptEvent | null = null;
const ouvintes = new Set<() => void>();

function avisar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Sem isto o Chrome mostra a própria faixa e o evento não pode ser reusado.
    event.preventDefault();
    guardado = event as InstallPromptEvent;
    avisar();
  });
  // Instalado (pelo nosso botão ou pelo menu do Chrome): o convite perde a validade.
  window.addEventListener("appinstalled", () => {
    guardado = null;
    avisar();
  });
}

export function installPrompt(): InstallPromptEvent | null {
  return guardado;
}

/** O convite só pode ser usado uma vez: depois do `prompt()`, some. */
export async function promptInstall(): Promise<void> {
  const evento = guardado;
  if (!evento) return;
  guardado = null;
  avisar();
  await evento.prompt();
}

/** Para o `useSyncExternalStore`. */
export function subscribeInstallPrompt(onChange: () => void): () => void {
  ouvintes.add(onChange);
  return () => ouvintes.delete(onChange);
}
