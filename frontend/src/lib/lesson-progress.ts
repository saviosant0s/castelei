"use client";

/*
| Onde a pessoa parou dentro de uma lição.
|
| O módulo é do cliente por declaração, e não por tabela: ele só fala de
| `window` e exporta um hook. Sem a diretiva, o empacotador pode alcançá-lo
| primeiro pelo lado do servidor e o hook chega à tela como indefinido.
|
| Fica no navegador, de propósito. É uma conveniência de leitura, não um dado
| de estudo: o que conta para progresso são as questões respondidas, e isso já
| vive no servidor. Guardar a etapa no banco custaria uma rota, uma tabela e
| uma escrita a cada toque em "Continuar" para resolver algo que o aparelho
| resolve sozinho.
|
| O preço é honesto e está escrito na tela: a retomada vale naquele aparelho.
| Quem estuda como visitante já está nesse regime de qualquer jeito.
|
| Todo acesso é protegido: em aba anônima, com dados de site bloqueados ou em
| navegador antigo, ler ou escrever no localStorage lança exceção. Falhar aqui
| nunca pode derrubar a lição.
*/
import { useCallback, useSyncExternalStore } from "react";

const KEY = (lessonId: number) => `castelei:licao:${lessonId}:etapa`;

export interface LessonSpot {
  /** Índice da etapa (base zero), como o componente conta. */
  step: number;
  /** Quantas etapas a lição tinha quando isso foi salvo. */
  total: number;
}

function parse(raw: string | null): LessonSpot | null {
  if (!raw) return null;

  // Formato "7/11": legível de olho e imune a JSON quebrado.
  const [step, total] = raw.split("/").map(Number);
  // `step` é índice base zero, então a última etapa é `total - 1`.
  if (!Number.isInteger(step) || !Number.isInteger(total) || step < 1 || step >= total - 1) return null;

  return { step, total };
}

export function readSpot(lessonId: number): LessonSpot | null {
  try {
    return parse(window.localStorage.getItem(KEY(lessonId)));
  } catch {
    return null;
  }
}

/*
| A versão para renderizar.
|
| É `useSyncExternalStore`, e não estado com efeito, porque o problema é
| exatamente o que ele resolve: um valor que só existe no navegador, dentro de
| uma tela que o servidor também renderiza. O `getServerSnapshot` devolve null,
| então o HTML do servidor e a primeira renderização do cliente combinam, e o
| valor de verdade entra na renderização seguinte — sem erro de hidratação e
| sem cascata de renderizações.
*/
function subscribe(onChange: () => void): () => void {
  // Cobre o caso de a pessoa estudar em duas abas ao mesmo tempo.
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function useSpot(lessonId: number): LessonSpot | null {
  const snapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(KEY(lessonId));
    } catch {
      return null;
    }
  }, [lessonId]);

  // O que atravessa é a string: comparada por valor, ela não cria um objeto
  // novo a cada leitura, que faria o React renderizar em laço.
  return parse(useSyncExternalStore(subscribe, snapshot, () => null));
}

export function saveSpot(lessonId: number, step: number, total: number): void {
  try {
    // A primeira etapa não é "onde parei": é o começo. A última também não,
    // porque quem chegou ao fim terminou de ler. (Índice base zero: a última
    // etapa de uma lição de 11 é a de número 10.)
    if (step < 1 || step >= total - 1) {
      window.localStorage.removeItem(KEY(lessonId));
      return;
    }
    window.localStorage.setItem(KEY(lessonId), `${step}/${total}`);
  } catch {
    // Sem armazenamento, a lição simplesmente sempre começa do início.
  }
}

export function clearSpot(lessonId: number): void {
  try {
    window.localStorage.removeItem(KEY(lessonId));
  } catch {
    // Idem.
  }
}
