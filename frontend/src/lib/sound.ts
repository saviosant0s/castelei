"use client";

/*
| O som de acerto e de erro, na prática.
|
| NÃO HÁ ARQUIVO DE ÁUDIO. Os dois sons são gerados na hora pelo próprio
| navegador (Web Audio). Isso resolve três coisas de uma vez: nada a baixar,
| funciona offline no PWA instalado, e o som é nosso — sem licença de banco
| de efeitos e sem a cara de app genérico.
|
| O TOM FOI ESCOLHIDO, NÃO SORTEADO. O acerto são duas notas subindo, curtas
| e suaves. O erro é UMA nota grave que desce um pouco, e de propósito não é
| aquele "errou!" de programa de auditório: a regra do app vale aqui também —
| erro se mostra sem gritar. Quem está estudando erra o tempo todo, é assim
| que se aprende, e um som humilhante faria a pessoa fechar o app.
|
| Volume baixo (12%), porque isso toca em sala de aula e em ônibus.
|
| DUAS ARMADILHAS DE NAVEGADOR estão tratadas aqui:
|
| 1. O iPhone (e o Chrome) só liberam áudio dentro de um gesto da pessoa. A
|    resposta chega do servidor DEPOIS do toque, quando o gesto já passou —
|    por isso existe `primeSound()`, chamada no começo do clique, antes do
|    await. Ela acorda o áudio enquanto o gesto ainda vale.
| 2. Navegador sem Web Audio, ou com o áudio bloqueado, não pode derrubar a
|    prática. Tudo aqui falha em silêncio.
*/
export type SoundKind = "acerto" | "erro";

export const SOUND_KEY = "castelei:som";

/** Baixo de propósito: isto toca em sala de aula. */
const VOLUME = 0.12;

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    ctx ??= new Ctor();

    return ctx;
  } catch {
    return null;
  }
}

/**
 * Acorda o áudio enquanto o dedo ainda está na tela.
 *
 * Chame no começo do manipulador de clique, antes de qualquer `await`. Sem
 * isso, o primeiro som de toda sessão é engolido no iPhone.
 */
export function primeSound(): void {
  if (!soundOn()) return;

  const a = audio();
  if (a?.state === "suspended") void a.resume().catch(() => {});
}

/** Uma nota. `glide` desliza até outra frequência — é o que dá o "ó-ó" do erro. */
function note(a: AudioContext, at: number, hz: number, dur: number, glide?: number): void {
  const osc = a.createOscillator();
  const gain = a.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(hz, at);
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, at + dur);

  // Sobe e desce em rampa: corte seco vira estalo no alto-falante do celular.
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(VOLUME, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);

  osc.connect(gain).connect(a.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function playSound(kind: SoundKind): void {
  if (!soundOn()) return;

  try {
    const a = audio();
    if (!a) return;

    const t = a.currentTime;

    if (kind === "acerto") {
      // Duas notas subindo: a segunda entra antes de a primeira acabar.
      note(a, t, 660, 0.1);
      note(a, t + 0.085, 988, 0.16);
    } else {
      // Uma nota grave que desce um pouco. Sem estridência.
      note(a, t, 233, 0.26, 175);
    }
  } catch {
    // Áudio bloqueado ou indisponível: a prática segue sem som.
  }
}

/*
| O interruptor.
|
| Ligado por padrão — foi pedido, e é o que dá a resposta imediata que o som
| existe para dar. Vive no navegador, POR APARELHO, como o tema: quem estuda
| de fone em casa e no silêncio da biblioteca quer justamente isso, e não uma
| preferência que persegue a conta.
*/
const SOUND_EVENT = "castelei:som-mudou";

export function soundOn(): boolean {
  try {
    // Ausente = ligado. Só o "0" desliga, então nada a migrar para quem já usa.
    return window.localStorage.getItem(SOUND_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean): void {
  try {
    if (on) {
      window.localStorage.removeItem(SOUND_KEY);
    } else {
      window.localStorage.setItem(SOUND_KEY, "0");
    }
  } catch {
    // Sem armazenamento, a escolha vale só nesta visita.
  }

  // O `storage` do navegador só avisa as OUTRAS abas.
  window.dispatchEvent(new Event(SOUND_EVENT));
}

export function subscribeSound(onChange: () => void): () => void {
  window.addEventListener(SOUND_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(SOUND_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
