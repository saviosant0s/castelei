/*
| Turmas: os tipos que a API devolve e as contas pequenas da tela.
|
| A tela do professor responde a três perguntas, nesta ordem: quem está
| parado, onde a turma erra e quem já estudou. Por isso as contas daqui
| ordenam, e não só formatam.
*/

export interface ClassroomSummary {
  id: number;
  name: string;
  subject: { id: number; name: string; slug: string } | null;
  created_at: string | null;
}

export interface ClassroomsIndex {
  owned: (ClassroomSummary & { members_count: number })[];
  joined: (ClassroomSummary & { owner: { name: string } })[];
  can_create: boolean;
  subjects: { id: number; name: string }[];
}

export interface ClassroomMember {
  id: number;
  name: string;
  practiced: number;
  total_lessons: number;
  accuracy: number | null;
  last_studied_at: string | null;
  days_inactive: number | null;
}

export interface ClassroomLesson {
  id: number;
  title: string;
  position: number;
  practiced: number;
  accuracy: number | null;
}

export interface ClassroomDetail {
  classroom: ClassroomSummary & { owner: { name: string }; is_owner: boolean; code?: string };
  members?: ClassroomMember[];
  lessons?: ClassroomLesson[];
}

export interface ClassroomPreview {
  classroom: ClassroomSummary & { owner: { name: string }; is_owner: boolean; is_member: boolean };
}

/** O código como se fala em sala: em dois blocos de três (ABC-DEF). */
export function formatCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

/** O que a pessoa digitou, limpo: só letras e números, em maiúscula. */
export function cleanCode(typed: string): string {
  return typed.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Uma semana sem estudar já é sinal; antes disso, é só a vida. */
export const PARADO_DIAS = 7;

/** A frase da última vez que a pessoa estudou. */
export function ultimaVez(days: number | null): string {
  if (days === null) return "Ainda não estudou";
  if (days === 0) return "Estudou hoje";
  if (days === 1) return "Estudou ontem";
  return `Estudou há ${days} dias`;
}

/** Quem precisa de atenção vem antes: nunca estudou, depois o mais parado. */
export function precisamDeAtencao(members: ClassroomMember[]): ClassroomMember[] {
  return members
    .filter((m) => m.days_inactive === null || m.days_inactive >= PARADO_DIAS)
    .sort((a, b) => (b.days_inactive ?? Infinity) - (a.days_inactive ?? Infinity));
}

/** As lições em que a turma mais erra: só as já praticadas, da pior para a melhor. */
export function licoesMaisFracas(lessons: ClassroomLesson[], limite = 5): (ClassroomLesson & { accuracy: number })[] {
  return lessons
    .filter((l): l is ClassroomLesson & { accuracy: number } => l.accuracy !== null)
    .sort((a, b) => a.accuracy - b.accuracy || a.position - b.position)
    .slice(0, limite);
}
