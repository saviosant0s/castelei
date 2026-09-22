export type Plan = "free" | "plus" | "pro";

export interface User {
  id: number;
  name: string;
  email: string;
  /** o plano guardado na conta */
  plan: Plan;
  /** administra o conteúdo em /admin. Nada a ver com plano. */
  is_admin: boolean;
  /** o plano que vale na prática — durante os testes, todo mundo estuda como Pro */
  effective_plan: Plan;
  /** rótulo do plano efetivo */
  plan_label: string;
  /** null = ilimitado */
  questions_per_lesson: number | null;
  /** fase de testes: tudo liberado, seja qual for o plano guardado */
  unlocked_for_testing: boolean;
}

export interface LessonSummary {
  id: number;
  title: string;
  position: number;
  /** o assunto que agrupa a lição na trilha. null = matéria sem módulos */
  module: string | null;
  questions_total: number;
  questions_available: number;
  attempts: number;
  best_percent: number | null;
}

/** Situação do simulado de uma matéria. `unlocked` false = existe, mas o plano não inclui. */
export interface ExamAvailability {
  available: boolean;
  unlocked: boolean;
  questions: number;
}

export interface Subject {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  /** Data da prova do semestre (AAAA-MM-DD), ou null. É o prazo de onde sai o ritmo das revisões. */
  exam_date: string | null;
  exam: ExamAvailability;
  /** Quantas palavras o vocabulário da matéria tem. 0 = a tela não oferece a página. */
  vocabulary_terms: number;
  lessons: LessonSummary[];
}

/** Uma palavra nova da matéria, com a lição em que ela estreia. */
export interface VocabularyTerm {
  word: string;
  meaning: string;
  lesson: { id: number; title: string; position: number };
}

export interface VocabularyResponse {
  subject: { id: number; slug: string; name: string };
  terms: VocabularyTerm[];
}

export type StepKind = "idea" | "explain" | "exam" | "pitfall" | "recap";

export interface LessonStep {
  kind: StepKind;
  title: string;
  /** parágrafos curtos, um por item */
  body: string[];
  bullets?: string[];
  /** exemplo resolvido, uma linha por passo */
  example?: { label: string; lines: string[] };
  /** palavras novas explicadas nesta etapa */
  terms?: { word: string; meaning: string }[];
  /** figura (SVG do próprio app), com texto alternativo e legenda */
  figure?: { src: string; alt: string; caption?: string };
  /** trecho de código, mostrado em fonte monoespaçada */
  code?: { label?: string; text: string };
  /** vídeo: arquivo enviado pelo painel ou link do YouTube */
  video?: { src: string; title?: string; caption?: string; poster?: string };
  /** tabela (ex.: comandos no Linux e no Windows). Com mono, as colunas depois da primeira usam fonte de código */
  table?: { label?: string; headers: string[]; rows: string[][]; mono?: boolean };
}

export interface LessonDetail {
  id: number;
  title: string;
  summary: string;
  steps: LessonStep[];
  subject: { id: number; slug: string; name: string };
  questions_total: number;
  questions_available: number;
  limited_by_plan: boolean;
}

export interface PracticeQuestion {
  id: number;
  position: number;
  topic: string;
  statement: string;
  options: string[];
}

export type AttemptKind = "lesson" | "exam";

export interface StartAttemptResponse {
  attempt: { id: number; total: number; kind: AttemptKind };
  questions: PracticeQuestion[];
  limited_by_plan: boolean;
}

export interface StartExamResponse extends StartAttemptResponse {
  subject: { id: number; slug: string; name: string };
}

export interface AnswerResult {
  is_correct: boolean;
  correct_index: number;
  explanation: string;
  pitfall: string | null;
  /** XP ganho nesta resposta; null quando o plano não mostra gamificação */
  xp?: number | null;
}

export interface StreakInfo {
  current: number;
  longest: number;
  studied_today: boolean;
}

export interface BadgeInfo {
  key: string;
  name: string;
  description: string;
}

export interface BadgeStatus extends BadgeInfo {
  earned: boolean;
  earned_at: string | null;
}

export interface GamificationSnapshot {
  xp_total: number;
  streak: StreakInfo;
  /** últimos 7 dias, do mais antigo até hoje */
  week: { date: string; studied: boolean }[];
  badges: BadgeStatus[];
}

export interface ResultGamification {
  xp_earned: number;
  xp_total: number;
  streak: StreakInfo;
  new_badges: BadgeInfo[];
}

export interface FinishResult {
  attempt_id: number;
  kind: AttemptKind;
  /** null no simulado: ele atravessa várias lições */
  lesson_id: number | null;
  subject_id: number | null;
  total: number;
  correct: number;
  percent: number;
  avg_seconds: number | null;
  previous_best_avg_seconds: number | null;
  is_record: boolean;
  weak_topic: string | null;
  next_lesson: { id: number; title: string } | null;
  limited_by_plan: boolean;
  gamification: ResultGamification | null;
}

export interface TopicStat {
  topic: string;
  lesson_title: string;
  answered: number;
  correct: number;
  accuracy: number;
  avg_seconds: number;
}

/** Um ponto do gráfico de evolução: uma tentativa concluída. */
export interface EvolutionPoint {
  attempt_id: number;
  kind: AttemptKind;
  title: string;
  finished_at: string | null;
  percent: number;
  avg_seconds: number | null;
}

export interface ProgressResponse {
  overall: {
    attempts: number;
    answered: number;
    accuracy: number | null;
    avg_seconds: number | null;
  };
  topics: TopicStat[];
  /** da tentativa mais antiga para a mais recente */
  evolution: EvolutionPoint[];
  last_attempt: {
    kind: AttemptKind;
    lesson_id: number | null;
    lesson_title: string;
    subject_id: number | null;
    subject_name: string | null;
    /** para onde voltar quando a última prática foi um simulado (não há lição) */
    subject_slug: string | null;
    finished: boolean;
    percent: number | null;
  } | null;
  gamification: GamificationSnapshot | null;
}

/**
 * Uma lição esperando revisão.
 *
 * O intervalo entre revisões é uma fatia do tempo que falta até a prova
 * (Cepeda et al., 2008) — ver docs/revisao-espacada.md.
 */
export interface ReviewItem {
  lesson_id: number | null;
  lesson_title: string | null;
  subject_name: string | null;
  subject_slug: string | null;
  due_at: string;
  /** Positivo = atrasada; negativo = ainda vai vencer. Em dias de calendário. */
  days_late: number;
  last_percent: number | null;
  interval_days: number;
  days_to_exam: number | null;
}

export interface ReviewResponse {
  due: ReviewItem[];
  /** A próxima marcada, quando não há nenhuma vencida. Serve para a tela não dizer "acabou". */
  next: ReviewItem | null;
}
