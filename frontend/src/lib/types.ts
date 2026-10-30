import type { WritingBrief } from "@/lib/writing";

export type Plan = "free" | "plus" | "pro";

export interface User {
  id: number;
  name: string;
  email: string;
  /** o plano guardado na conta */
  plan: Plan;
  /** administra o conteúdo em /admin. Nada a ver com plano. */
  is_admin: boolean;
  /** Conta de visitante: o progresso mora só neste navegador até virar conta de verdade. */
  is_guest?: boolean;
  /** o plano que vale na prática — durante os testes, todo mundo estuda como Pro */
  effective_plan: Plan;
  /** rótulo do plano efetivo */
  plan_label: string;
  /** a meta de XP por dia (60, 120 ou 240) */
  daily_goal?: number;
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
  /** leu até a última etapa (com ou sem prática): a trilha mostra pela metade */
  read?: boolean;
}

/** Situação do simulado de uma matéria. `unlocked` false = existe, mas o plano não inclui. */
export interface ExamAvailability {
  available: boolean;
  unlocked: boolean;
  questions: number;
  /** Matéria de escrita: o simulado é um texto inteiro, do zero, e não uma mistura de questões. */
  writing?: boolean;
}

/** Área do conhecimento: a porta de entrada da tela inicial. */
export interface Area {
  slug: string;
  name: string;
}

/** Um passo de uma trilha: uma matéria, na ordem de estudo. */
export interface TrailStep {
  /** Slug da matéria. Pode ainda não existir: aí o passo aparece como "Em breve". */
  subject: string;
  name: string;
  /** Por que este passo vem aqui, numa frase. */
  why: string;
}

/** Uma ordem de estudo que atravessa áreas, como "LLMs do zero". */
export interface Trail {
  slug: string;
  name: string;
  /** Trilha que só quem administra vê. */
  private?: boolean;
  description: string;
  steps: TrailStep[];
}

/** Resposta de `GET /subjects`. */
export interface SubjectsResponse {
  /** Todas as áreas, na ordem da tela — inclusive as que ainda não têm matéria. */
  areas: Area[];
  /** As trilhas de estudo, com os passos já na ordem. */
  trails?: Trail[];
  subjects: Subject[];
}

export interface Subject {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  /** Slug da área do conhecimento (`informatica`, `portugues`…), ou null. */
  area: string | null;
  /** Só chega verdadeiro para quem administra: a matéria que ninguém mais vê. */
  private?: boolean;
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
  /** A lição que explica esta palavra já foi praticada por quem está lendo. */
  seen: boolean;
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
  example?: {
    label: string;
    lines: string[];
    /**
     * As linhas são uma SEQUÊNCIA, e não uma lista.
     *
     * Trocar duas de lugar estragaria o exemplo? Então é `ordered`, e a tela
     * desenha a escada numerada em vez de linhas soltas. Ver `StepExample`.
     */
    ordered?: boolean;
  };
  /** palavras novas explicadas nesta etapa */
  terms?: { word: string; meaning: string }[];
  /** figura (SVG do próprio app), com texto alternativo e legenda */
  figure?: { src: string; alt: string; caption?: string };
  /** trecho de código, mostrado em fonte monoespaçada */
  /** `notes`: uma tradução por linha de código, na ordem. Ver `StepCode`. */
  code?: { label?: string; text: string; notes?: string[] };
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
  /** Lição de escrita: a prática é escrever o texto por partes, não responder questões. */
  practice?: "questions" | "writing";
  /** Questões cuja última resposta foi errada: a lição oferece refazer só elas. */
  wrong_count?: number;
  /** Domínio da pessoa nesta lição, pela última resposta (0–100). null = nunca praticada. */
  mastery?: number | null;
  /** Quantas questões em cada nível. Vazio = a lição não tem níveis. */
  levels?: Partial<Record<Difficulty, number>>;
  /** Praticar por nível é do Pro. */
  can_use_levels?: boolean;
}

/** Nível de dificuldade de uma questão. */
export type Difficulty = "facil" | "media" | "dificil";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { facil: "Fácil", media: "Média", dificil: "Difícil" };

/**
 * `choice`: cinco alternativas, uma certa. O formato da prova.
 * `order`: pôr os passos na ordem. As opções chegam EMBARALHADAS pelo
 * servidor — a ordem certa é o gabarito, e não pode viajar até o navegador.
 * `match`: ligar cada item de `prompts` ao seu par em `options`, que também
 * chega embaralhado.
 * `writing`: escrever uma parte de um texto. Não tem gabarito: o roteiro vem
 * em `writing`, e o texto-modelo só chega depois de a pessoa conferir.
 */
export type QuestionFormat = "choice" | "order" | "match" | "writing";

export interface PracticeQuestion {
  id: number;
  position: number;
  format: QuestionFormat;
  /** O nível, mostrado como etiqueta na questão. Sem nível, nada aparece. */
  difficulty?: Difficulty | null;
  topic: string;
  statement: string;
  options: string[];
  /** Só na questão de associar: a coluna da esquerda, na ordem escrita. */
  prompts?: string[];
  /** Só na questão de escrita: o roteiro, o tamanho e as conferências da forma. */
  writing?: WritingBrief;
}

/** O que a conferência de um texto devolve. Não grava nada: dá para conferir de novo. */
export interface WritingCheckResponse {
  language: {
    /** false = o corretor estava fora do ar ou está desligado. Não quer dizer "nenhum erro". */
    available: boolean;
    issues: LanguageIssue[];
  };
  model: string | null;
  checklist: string[];
  /** A correção por IA existe neste servidor (há chave configurada). */
  ai: boolean;
}

export interface LanguageIssue {
  /** Posição no texto, contada como o JavaScript conta (UTF-16). */
  offset: number;
  length: number;
  message: string;
  replacements: string[];
  group: "ortografia" | "pontuação" | "gramática" | "estilo";
}

export interface WritingReviewResponse {
  feedback: string;
  remaining: number;
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
  /** null na questão de escrita, que não tem gabarito. */
  correct_index: number | null;
  /** Na questão de ordenar, a sequência certa por extenso. Null nas outras. */
  correct_order: string[] | null;
  /** Na questão de associar, os pares certos. Null nas outras. */
  correct_pairs: { left: string; right: string }[] | null;
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
  /** Quantas questões desta lição estão erradas agora, contando esta tentativa. */
  wrong_count?: number;
}

export interface TopicStat {
  topic: string;
  lesson_id: number;
  lesson_title: string;
  subject_name: string;
  answered: number;
  correct: number;
  accuracy: number;
  avg_seconds: number;
  /** Parte de texto (Produção Textual): conta como cumprida, não como certa. */
  writing?: boolean;
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

/** Uma lição no mapa da matéria. `mastery` nulo = ainda não praticada. */
export interface StatsLesson {
  id: number;
  title: string;
  module: string | null;
  /** parte das questões de base cuja ÚLTIMA resposta está certa, em % */
  mastery: number | null;
}

export interface StatsSubject {
  id: number;
  slug: string;
  name: string;
  exam_date: string | null;
  /** nulo quando não há prova marcada ou ela já passou */
  days_to_exam: number | null;
  lessons_total: number;
  lessons_started: number;
  lessons_mastered: number;
  /** na ordem da matéria */
  lessons: StatsLesson[];
}

export interface WeakLesson {
  lesson_id: number;
  lesson_title: string;
  subject_name: string;
  /** questões diferentes já respondidas */
  answered: number;
  /** questões cuja última resposta está errada */
  wrong: number;
  /** acerto pela última resposta de cada questão */
  accuracy: number;
  /** acerto pela primeira resposta das mesmas questões */
  first_accuracy: number;
  /** nulo quando nenhuma questão foi respondida duas vezes */
  trend: "up" | "down" | "flat" | null;
}

export interface StatsResponse {
  subjects: StatsSubject[];
  weak_lessons: WeakLesson[];
  retention: {
    first_answered: number;
    first_accuracy: number | null;
    /** respostas dadas depois de já ter acertado a mesma questão */
    rechecked: number;
    kept: number;
    kept_accuracy: number | null;
    forgotten_lessons: { lesson_id: number; lesson_title: string; subject_name: string; forgotten: number }[];
  };
  /** Últimos 7 dias (do mais antigo até hoje) e o acerto contra a semana anterior. */
  week: {
    days: { date: string; answered: number; correct: number }[];
    accuracy: number | null;
    previous_accuracy: number | null;
    /** pontos de diferença; nulo sem respostas suficientes nas duas semanas */
    change: number | null;
  };
}

/** O cabeçalho fixo e a barra de baixo (`GET /me/bar`). */
export interface AppBarResponse {
  gamification: {
    streak: number;
    studied_today: boolean;
    xp: number;
    /** a meta do dia: XP ganho hoje contra o escolhido */
    goal: { target: number; today: number };
    /** a semana do calendário, de domingo a sábado (o balão da chama) */
    week: { date: string; studied: boolean; future: boolean }[];
    /** o nível sai do XP: `floor` é onde o nível atual começa, `next` onde o próximo começa */
    level: { current: number; floor: number; next: number };
  } | null;
  area: { slug: string; name: string } | null;
  reviews_due: number;
}
