import type { LessonStep, QuestionFormat } from "@/lib/types";

/**
 * De onde vem o conteúdo de uma matéria.
 *
 * `seed` = dos arquivos do repositório, e o deploy ainda recarrega ela.
 * `painel` = foi editada aqui, e o deploy não encosta mais nela.
 */
export type SubjectOrigin = "seed" | "painel";

export interface AdminSubject {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  exam_date: string | null;
  position: number;
  origin: SubjectOrigin;
  lessons_count: number;
  questions_count: number;
}

export interface AdminLessonRow {
  id: number;
  slug: string;
  title: string;
  position: number;
  module: string | null;
  summary: string;
  steps_count: number;
  questions_count: number;
}

export interface AdminSubjectDetail {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  exam_date: string | null;
  position: number;
  origin: SubjectOrigin;
  lessons: AdminLessonRow[];
}

export interface AdminQuestion {
  id: number;
  position: number;
  /** `choice` (alternativas) ou `order` (pôr os passos na ordem). */
  format: QuestionFormat;
  topic: string;
  statement: string;
  options: string[];
  correct_index: number;
  explanation: string;
  pitfall: string | null;
}

export interface AdminLessonDetail {
  id: number;
  slug: string;
  title: string;
  position: number;
  /** o assunto que agrupa a lição na trilha da matéria */
  module: string | null;
  summary: string;
  steps: LessonStep[];
  subject: { id: number; slug: string; name: string; origin: SubjectOrigin };
  questions: AdminQuestion[];
}

/** Um problema no arquivo, com o endereço dele dentro do JSON. */
export interface ContentIssue {
  path: string;
  message: string;
}

export interface ImportReport {
  subject: { id: number; slug: string; name: string; created: boolean };
  lessons_created: number;
  lessons_updated: number;
  questions_created: number;
  questions_updated: number;
  questions_removed: number;
  orphan_lessons: { title: string; slug: string }[];
  orphan_questions: { lesson: string; slug: string; count: number }[];
  warnings: ContentIssue[];
}

export type MediaKind = "image" | "video";

export interface MediaItem {
  id: number;
  kind: MediaKind;
  url: string;
  original_name: string;
  mime_type: string;
  size: number;
  alt: string | null;
  created_at: string | null;
}
