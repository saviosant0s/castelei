<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class ProgressController extends Controller
{
    public function __construct(private GamificationService $gamification)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $rows = DB::table('answers')
            ->join('attempts', 'attempts.id', '=', 'answers.attempt_id')
            ->join('questions', 'questions.id', '=', 'answers.question_id')
            ->join('lessons', 'lessons.id', '=', 'questions.lesson_id')
            ->where('attempts.user_id', $userId)
            ->whereNotNull('attempts.finished_at')
            ->selectRaw('questions.topic as topic, lessons.title as lesson_title, COUNT(*) as answered, SUM(CASE WHEN answers.is_correct THEN 1 ELSE 0 END) as correct, AVG(answers.seconds) as avg_seconds')
            ->groupBy('questions.topic', 'lessons.title')
            ->get();

        $topics = $rows->map(fn ($row) => [
            'topic' => $row->topic,
            'lesson_title' => $row->lesson_title,
            'answered' => (int) $row->answered,
            'correct' => (int) $row->correct,
            'accuracy' => (int) round(((int) $row->correct) / max((int) $row->answered, 1) * 100),
            'avg_seconds' => round((float) $row->avg_seconds, 1),
        ])->sortBy([['accuracy', 'asc'], ['topic', 'asc']])->values();

        $answered = $topics->sum('answered');
        $correct = $topics->sum('correct');

        $last = Attempt::query()
            ->where('user_id', $userId)
            ->with('lesson.subject')
            ->latest('id')
            ->first();

        return response()->json([
            'overall' => [
                'attempts' => Attempt::where('user_id', $userId)->whereNotNull('finished_at')->count(),
                'answered' => $answered,
                'accuracy' => $answered > 0 ? (int) round($correct / $answered * 100) : null,
                'avg_seconds' => $answered > 0
                    ? round($topics->sum(fn ($t) => $t['avg_seconds'] * $t['answered']) / $answered, 1)
                    : null,
            ],
            'topics' => $topics,
            'last_attempt' => $last ? [
                'lesson_id' => $last->lesson_id,
                'lesson_title' => $last->lesson->title,
                'subject_name' => $last->lesson->subject->name,
                'finished' => $last->finished_at !== null,
                'percent' => $last->finished_at !== null
                    ? (int) round($last->correct_count / max($last->total_questions, 1) * 100)
                    : null,
            ] : null,
            'gamification' => $this->gamificationFor($request),
        ]);
    }

    /** @return array<string, mixed>|null */
    private function gamificationFor(Request $request): ?array
    {
        $user = $request->user();
        if (! $user->hasGamification()) {
            return null;
        }

        try {
            return $this->gamification->snapshot($user);
        } catch (Throwable $e) {
            report($e);

            return null;
        }
    }
}
