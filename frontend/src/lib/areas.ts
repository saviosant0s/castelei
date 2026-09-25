import {
  Atom,
  BookOpen,
  BookOpenText,
  Brain,
  Calculator,
  Cpu,
  Dna,
  Dumbbell,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  MessagesSquare,
  Monitor,
  Palette,
  PenLine,
  Server,
  Shapes,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Area, Subject } from "./types";

/*
| Áreas do conhecimento.
|
| A lista (nome e ordem) vem do backend, em `GET /subjects` — é de lá que o
| painel e o importador conferem a área de cada matéria. Aqui mora só o que é
| da tela: o ícone.
*/

const icones: Record<string, LucideIcon> = {
  portugues: BookOpenText,
  matematica: Calculator,
  fisica: Atom,
  quimica: FlaskConical,
  biologia: Dna,
  historia: Landmark,
  geografia: Globe,
  filosofia: Brain,
  sociologia: Users,
  ingles: Languages,
  espanhol: MessagesSquare,
  artes: Palette,
  "educacao-fisica": Dumbbell,
  informatica: Monitor,
  outras: Shapes,
};

/** Área de reserva para matéria sem área (ou com uma que a tela não conhece). */
export const OUTRAS: Area = { slug: "outras", name: "Outras matérias" };

export function areaIcon(slug: string): LucideIcon {
  return icones[slug] ?? BookOpen;
}

const iconesDeMateria: Record<string, LucideIcon> = {
  "matematica-basica": Calculator,
  portugues: Languages,
  "sistemas-operacionais": Cpu,
  "servidores-vps": Server,
  refatoracao: Wrench,
  "producao-textual": PenLine,
};

/** Ícone da matéria; a que não tem um próprio usa o da área. */
export function subjectIcon(subject: Pick<Subject, "slug" | "area">): LucideIcon {
  return iconesDeMateria[subject.slug] ?? areaIcon(subject.area ?? OUTRAS.slug);
}

export interface AreaGroup extends Area {
  subjects: Subject[];
}

/**
 * Separa as áreas que já têm matéria das que ainda não têm.
 *
 * A ordem é a da lista oficial, não a das matérias: a pessoa acha Português
 * sempre no mesmo lugar. Matéria sem área conhecida não some — vai para
 * "Outras matérias", no fim. Some é o que a pessoa não encontra.
 */
export function groupByArea(areas: Area[], subjects: Subject[]): { ativas: AreaGroup[]; emBreve: Area[] } {
  const conhecidas = new Set(areas.map((a) => a.slug));
  const porArea = new Map<string, Subject[]>();

  for (const subject of subjects) {
    const slug = subject.area && conhecidas.has(subject.area) ? subject.area : OUTRAS.slug;
    porArea.set(slug, [...(porArea.get(slug) ?? []), subject]);
  }

  const ativas: AreaGroup[] = [];
  const emBreve: Area[] = [];

  for (const area of areas) {
    const lista = porArea.get(area.slug);
    if (lista) ativas.push({ ...area, subjects: lista });
    else emBreve.push(area);
  }

  const outras = porArea.get(OUTRAS.slug);
  if (outras) ativas.push({ ...OUTRAS, subjects: outras });

  return { ativas, emBreve };
}

/** Lições praticadas e total, somando as matérias da área. */
export function areaProgress(subjects: Subject[]): { practiced: number; total: number } {
  let practiced = 0;
  let total = 0;
  for (const subject of subjects) {
    total += subject.lessons.length;
    practiced += subject.lessons.filter((lesson) => lesson.attempts > 0).length;
  }
  return { practiced, total };
}
