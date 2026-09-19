export type Plan = "free" | "plus" | "pro";

export interface User {
  id: number;
  name: string;
  email: string;
  plan: Plan;
  plan_label: string;
  /** null = ilimitado */
  questions_per_lesson: number | null;
}

export interface LessonSummary {
  id: number;
  title: string;
  position: number;
  questions_total: number;
  questions_available: number;
  attempts: number;
  best_percent: number | null;
}

export interface Subject {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  lessons: LessonSummary[];
}

export interface LessonDetail {
  id: number;
  title: string;
  summary: string;
  explanation: string;
  exam_style: string;
  pitfalls: string[];
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

export interface StartAttemptResponse {
  attempt: { id: number; total: number };
  questions: PracticeQuestion[];
  limited_by_plan: boolean;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_index: number;
  explanation: string;
  pitfall: string | null;
}

export interface FinishResult {
  attempt_id: number;
  lesson_id: number;
  total: number;
  correct: number;
  percent: number;
  avg_seconds: number | null;
  previous_best_avg_seconds: number | null;
  is_record: boolean;
  weak_topic: string | null;
  next_lesson: { id: number; title: string } | null;
  limited_by_plan: boolean;
}

export interface TopicStat {
  topic: string;
  lesson_title: string;
  answered: number;
  correct: number;
  accuracy: number;
  avg_seconds: number;
}

export interface ProgressResponse {
  overall: {
    attempts: number;
    answered: number;
    accuracy: number | null;
    avg_seconds: number | null;
  };
  topics: TopicStat[];
  last_attempt: {
    lesson_id: number;
    lesson_title: string;
    subject_name: string;
    finished: boolean;
    percent: number | null;
  } | null;
}
