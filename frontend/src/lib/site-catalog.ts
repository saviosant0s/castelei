import { apiBase } from "@/lib/proxy";
import { CATALOG, SUBJECTS, type SiteSubject } from "@/lib/site-content";

/*
| O catálogo que a vitrine mostra.
|
| Ele vem do backend, para uma matéria criada no painel aparecer sem ninguém
| editar código. Mas a vitrine é a porta de entrada e a página que o Google
| indexa: ela não pode mostrar "não deu para carregar" nem ficar pendurada
| esperando um backend lento. Então a lista escrita à mão em site-content.ts
| continua existindo, agora no papel de rede de segurança — se a API demorar,
| falhar ou responder algo estranho, a página sai com ela e ninguém percebe.
|
| A frase de vitrine (`pitch`) fica de fora dessa troca de propósito: ela é
| texto de venda, escrito com capricho, e não existe no banco. Matéria que já
| tem a sua continua com ela; matéria nova usa a própria descrição.
*/

/** Quanto tempo esperar pelo backend antes de desistir e usar a reserva. */
const TIMEOUT_MS = 2500;

/*
| De quanto em quanto tempo buscar de novo.
|
| Um minuto é curto para uma página que muda pouco, e é de propósito: o que se
| está comprando aqui não é carga no servidor, é a sensação de que o painel
| funciona. Com cinco minutos, quem importa uma matéria e abre a vitrine não a
| encontra, e conclui que a importação falhou. No pior caso isto custa uma
| requisição por minuto.
*/
const REVALIDATE_S = 60;

export interface SiteCatalog {
  subjects: SiteSubject[];
  totals: { subjects: number; lessons: number; questions: number };
  /** null = as lições não têm todas o mesmo número, então a vitrine não promete um. */
  questionsPerLesson: number | null;
  /** true = veio da lista de reserva, porque a API não respondeu a tempo. */
  fallback: boolean;
}

interface RespostaApi {
  subjects: { slug: string; name: string; description: string | null; lessons: string[] }[];
  totals: { subjects: number; lessons: number; questions: number };
  questions_per_lesson: number | null;
}

/** A vitrine escrita à mão, no formato do catálogo. */
function reserva(): SiteCatalog {
  return {
    subjects: SUBJECTS,
    totals: { subjects: CATALOG.subjects, lessons: CATALOG.lessons, questions: CATALOG.questions },
    questionsPerLesson: CATALOG.questionsPerLesson,
    fallback: true,
  };
}

/**
 * Confere que a resposta tem a forma esperada.
 *
 * Uma API que responde 200 com outra coisa é pior do que uma que cai: a página
 * quebraria na renderização, já em produção. Aqui, qualquer surpresa vira
 * simplesmente a lista de reserva.
 */
function pareceCatalogo(data: unknown): data is RespostaApi {
  if (typeof data !== "object" || data === null) return false;

  const { subjects, totals } = data as Partial<RespostaApi>;

  if (!Array.isArray(subjects) || typeof totals !== "object" || totals === null) return false;
  if (typeof totals.lessons !== "number" || typeof totals.questions !== "number") return false;

  return subjects.every(
    (subject) =>
      typeof subject?.slug === "string" &&
      typeof subject?.name === "string" &&
      Array.isArray(subject?.lessons) &&
      subject.lessons.every((lesson) => typeof lesson === "string"),
  );
}

export async function getSiteCatalog(): Promise<SiteCatalog> {
  let data: unknown;

  try {
    const response = await fetch(`${apiBase()}/catalog`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_S },
    });

    if (!response.ok) return reserva();
    data = await response.json();
  } catch {
    return reserva();
  }

  if (!pareceCatalogo(data)) return reserva();

  // Catálogo vazio quase sempre é banco ainda não carregado, não um app sem
  // conteúdo. Anunciar "0 matérias" na porta de entrada é o pior resultado
  // possível, então a reserva vale mais.
  if (data.subjects.length === 0) return reserva();

  const pitches = new Map(SUBJECTS.map((subject) => [subject.slug, subject.pitch]));

  return {
    subjects: data.subjects.map((subject) => ({
      slug: subject.slug,
      name: subject.name,
      pitch: pitches.get(subject.slug) ?? subject.description ?? "",
      lessons: subject.lessons,
    })),
    totals: data.totals,
    questionsPerLesson: data.questions_per_lesson,
    fallback: false,
  };
}
