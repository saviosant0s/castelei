<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\Question;
use App\Models\User;
use App\Services\GamificationService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class AttemptController extends Controller
{
    public function __construct(private GamificationService $gamification)
    {
    }

    /** Inicia uma tentativa e devolve as questões SEM gabarito nem explicação. */
    public function store(Request $request, Lesson $lesson): JsonResponse
    {
        $limit = $request->user()->questionLimit();

        $query = $lesson->questions()->orderBy('position');
        if ($limit !== null) {
            $query->limit($limit);
        }
        $questions = $query->get();

        abort_if($questions->isEmpty(), 422, 'Esta lição ainda não tem questões.');

        $attempt = Attempt::create([
            'user_id' => $request->user()->id,
            'kind' => Attempt::KIND_LESSON,
            'lesson_id' => $lesson->id,
            'subject_id' => $lesson->subject_id,
            'started_at' => now(),
            'total_questions' => $questions->count(),
            'question_ids' => $questions->pluck('id')->all(),
        ]);

        return response()->json([
            'attempt' => ['id' => $attempt->id, 'total' => $attempt->total_questions, 'kind' => $attempt->kind],
            'questions' => $questions->map(fn (Question $question) => [
                'id' => $question->id,
                'position' => $question->position,
                'topic' => $question->topic,
                'statement' => $question->statement,
                'options' => $question->options,
            ])->values(),
            'limited_by_plan' => $lesson->questions()->count() > $questions->count(),
        ], 201);
    }

    public function answer(Request $request, Attempt $attempt): JsonResponse
    {
        $this->ensureOwner($request, $attempt);
        abort_if($attempt->finished_at !== null, 409, 'Esta tentativa já foi finalizada.');

        $data = $request->validate([
            'question_id' => ['required', 'integer'],
            'selected' => ['nullable', 'integer', 'min:0', 'max:4'],
            'seconds' => ['required', 'integer', 'min:0', 'max:7200'],
        ]);

        // Só vale responder as questões entregues no início da tentativa.
        $allowedIds = $attempt->allowedQuestionIds();
        abort_unless(in_array((int) $data['question_id'], $allowedIds, true), 422, 'Questão inválida para esta tentativa.');

        $question = Question::findOrFail($data['question_id']);
        $selected = isset($data['selected']) ? (int) $data['selected'] : null;
        abort_if($selected !== null && $selected >= count($question->options), 422, 'Alternativa inválida.');

        $isCorrect = $selected !== null && $selected === $question->correct_index;
        $xp = $isCorrect ? (int) config('castelei.xp_per_correct_answer') : 0;

        try {
            $attempt->answers()->create([
                'question_id' => $question->id,
                'selected_index' => $selected,
                'is_correct' => $isCorrect,
                'seconds' => (int) $data['seconds'],
                'xp' => $xp,
            ]);
        } catch (UniqueConstraintViolationException) {
            abort(409, 'Questão já respondida.');
        }

        // Gamificação nunca pode atrapalhar o estudo: se falhar, só registramos o erro.
        try {
            $this->gamification->recordStudyToday($request->user());
        } catch (Throwable $e) {
            report($e);
        }

        return response()->json([
            'is_correct' => $isCorrect,
            'correct_index' => $question->correct_index,
            'explanation' => $question->explanation,
            'pitfall' => $question->pitfall,
            // Só aparece para planos com gamificação (o XP é guardado para todos).
            'xp' => $request->user()->hasGamification() ? $xp : null,
        ]);
    }

    public function finish(Request $request, Attempt $attempt): JsonResponse
    {
        $this->ensureOwner($request, $attempt);

        $firstFinish = $attempt->finished_at === null;

        if ($firstFinish) {
            $answers = $attempt->answers()->get();

            $attempt->update([
                'finished_at' => now(),
                'correct_count' => $answers->where('is_correct', true)->count(),
                'avg_seconds' => $answers->isEmpty() ? null : round((float) $answers->avg('seconds'), 1),
            ]);
        }

        $attempt = $attempt->fresh();
        $result = $this->result($attempt);
        $result['gamification'] = $this->gamificationBlock($request->user(), $attempt, $result['is_record'], $firstFinish);

        return response()->json($result);
    }

    /**
     * Streak, XP e conquistas do resultado. Devolve null se o plano não inclui gamificação
     * ou se algo falhar (o resultado da lição é mais importante do que os pontos).
     *
     * @return array<string, mixed>|null
     */
    private function gamificationBlock(User $user, Attempt $attempt, bool $isRecord, bool $firstFinish): ?array
    {
        try {
            if ($firstFinish) {
                $this->gamification->awardBadges($user, $attempt, $isRecord); // ganha para todos, aparece para quem tem o plano
            }

            if (! $user->hasGamification()) {
                return null;
            }

            return [
                'xp_earned' => (int) $attempt->answers()->sum('xp'),
                'xp_total' => $this->gamification->xpTotal($user),
                'streak' => $this->gamification->streak($user),
                'new_badges' => $this->gamification->badgesAwardedIn($attempt),
            ];
        } catch (Throwable $e) {
            report($e);

            return null;
        }
    }

    private function ensureOwner(Request $request, Attempt $attempt): void
    {
        abort_unless((int) $attempt->user_id === (int) $request->user()->id, 404);
    }

    /** @return array<string, mixed> */
    private function result(Attempt $attempt): array
    {
        // O recorde compara com o mesmo desafio: a mesma lição, ou o simulado da mesma matéria.
        $previousBest = Attempt::query()
            ->where('user_id', $attempt->user_id)
            ->where('kind', $attempt->kind)
            ->when(
                $attempt->isExam(),
                fn ($query) => $query->where('subject_id', $attempt->subject_id),
                fn ($query) => $query->where('lesson_id', $attempt->lesson_id),
            )
            ->where('id', '!=', $attempt->id)
            ->whereNotNull('finished_at')
            ->whereNotNull('avg_seconds')
            ->min('avg_seconds');
        $previousBest = $previousBest === null ? null : (float) $previousBest;

        $weakTopic = DB::table('answers')
            ->join('questions', 'questions.id', '=', 'answers.question_id')
            ->where('answers.attempt_id', $attempt->id)
            ->where('answers.is_correct', false)
            ->selectRaw('questions.topic as topic, COUNT(*) as wrong')
            ->groupBy('questions.topic')
            ->orderByDesc('wrong')
            ->orderBy('topic')
            ->value('topic');

        // O simulado não tem "próxima lição": ele já atravessa a matéria toda.
        $lesson = $attempt->lesson;
        $next = $lesson
            ? Lesson::query()
                ->where('subject_id', $lesson->subject_id)
                ->where('position', '>', $lesson->position)
                ->orderBy('position')
                ->first(['id', 'title'])
            : null;

        return [
            'attempt_id' => $attempt->id,
            'kind' => $attempt->kind,
            'lesson_id' => $attempt->lesson_id,
            'subject_id' => $attempt->subject_id,
            'total' => $attempt->total_questions,
            'correct' => $attempt->correct_count,
            'percent' => (int) round($attempt->correct_count / max($attempt->total_questions, 1) * 100),
            'avg_seconds' => $attempt->avg_seconds,
            'previous_best_avg_seconds' => $previousBest,
            'is_record' => $previousBest !== null && $attempt->avg_seconds !== null && $attempt->avg_seconds < $previousBest,
            'weak_topic' => $weakTopic,
            'next_lesson' => $next ? ['id' => $next->id, 'title' => $next->title] : null,
            'limited_by_plan' => $lesson !== null && $lesson->questions()->count() > $attempt->total_questions,
        ];
    }
}
