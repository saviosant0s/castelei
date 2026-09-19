<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\Question;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttemptController extends Controller
{
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
            'lesson_id' => $lesson->id,
            'started_at' => now(),
            'total_questions' => $questions->count(),
        ]);

        return response()->json([
            'attempt' => ['id' => $attempt->id, 'total' => $attempt->total_questions],
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
        $allowedIds = $attempt->lesson->questions()
            ->limit($attempt->total_questions)
            ->pluck('id');
        abort_unless($allowedIds->contains($data['question_id']), 422, 'Questão inválida para esta tentativa.');

        $question = Question::findOrFail($data['question_id']);
        $selected = isset($data['selected']) ? (int) $data['selected'] : null;
        abort_if($selected !== null && $selected >= count($question->options), 422, 'Alternativa inválida.');

        $isCorrect = $selected !== null && $selected === $question->correct_index;

        try {
            $attempt->answers()->create([
                'question_id' => $question->id,
                'selected_index' => $selected,
                'is_correct' => $isCorrect,
                'seconds' => (int) $data['seconds'],
            ]);
        } catch (UniqueConstraintViolationException) {
            abort(409, 'Questão já respondida.');
        }

        return response()->json([
            'is_correct' => $isCorrect,
            'correct_index' => $question->correct_index,
            'explanation' => $question->explanation,
            'pitfall' => $question->pitfall,
        ]);
    }

    public function finish(Request $request, Attempt $attempt): JsonResponse
    {
        $this->ensureOwner($request, $attempt);

        if ($attempt->finished_at === null) {
            $answers = $attempt->answers()->get();

            $attempt->update([
                'finished_at' => now(),
                'correct_count' => $answers->where('is_correct', true)->count(),
                'avg_seconds' => $answers->isEmpty() ? null : round((float) $answers->avg('seconds'), 1),
            ]);
        }

        return response()->json($this->result($attempt->fresh()));
    }

    private function ensureOwner(Request $request, Attempt $attempt): void
    {
        abort_unless((int) $attempt->user_id === (int) $request->user()->id, 404);
    }

    /** @return array<string, mixed> */
    private function result(Attempt $attempt): array
    {
        $previousBest = Attempt::query()
            ->where('user_id', $attempt->user_id)
            ->where('lesson_id', $attempt->lesson_id)
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

        $lesson = $attempt->lesson;
        $next = Lesson::query()
            ->where('subject_id', $lesson->subject_id)
            ->where('position', '>', $lesson->position)
            ->orderBy('position')
            ->first(['id', 'title']);

        return [
            'attempt_id' => $attempt->id,
            'lesson_id' => $attempt->lesson_id,
            'total' => $attempt->total_questions,
            'correct' => $attempt->correct_count,
            'percent' => (int) round($attempt->correct_count / max($attempt->total_questions, 1) * 100),
            'avg_seconds' => $attempt->avg_seconds,
            'previous_best_avg_seconds' => $previousBest,
            'is_record' => $previousBest !== null && $attempt->avg_seconds !== null && $attempt->avg_seconds < $previousBest,
            'weak_topic' => $weakTopic,
            'next_lesson' => $next ? ['id' => $next->id, 'title' => $next->title] : null,
            'limited_by_plan' => $lesson->questions()->count() > $attempt->total_questions,
        ];
    }
}
