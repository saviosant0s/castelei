<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function subjects(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = $user->questionLimit();

        // Melhor resultado e nº de tentativas concluídas por lição.
        $stats = Attempt::query()
            ->where('user_id', $user->id)
            ->whereNotNull('finished_at')
            ->selectRaw('lesson_id, COUNT(*) as attempts, MAX(correct_count * 100.0 / NULLIF(total_questions, 0)) as best_percent')
            ->groupBy('lesson_id')
            ->get()
            ->keyBy('lesson_id');

        $subjects = Subject::query()
            ->with(['lessons' => fn ($query) => $query->withCount('questions')])
            ->orderBy('position')
            ->get();

        return response()->json([
            'subjects' => $subjects->map(fn (Subject $subject) => [
                'id' => $subject->id,
                'slug' => $subject->slug,
                'name' => $subject->name,
                'description' => $subject->description,
                'lessons' => $subject->lessons->map(function (Lesson $lesson) use ($stats, $limit) {
                    $stat = $stats->get($lesson->id);

                    return [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'position' => $lesson->position,
                        'questions_total' => $lesson->questions_count,
                        'questions_available' => $limit === null ? $lesson->questions_count : min($limit, $lesson->questions_count),
                        'attempts' => $stat ? (int) $stat->attempts : 0,
                        'best_percent' => $stat && $stat->best_percent !== null ? (int) round((float) $stat->best_percent) : null,
                    ];
                })->values(),
            ])->values(),
        ]);
    }

    public function lesson(Request $request, Lesson $lesson): JsonResponse
    {
        $lesson->load('subject')->loadCount('questions');
        $limit = $request->user()->questionLimit();
        $available = $limit === null ? $lesson->questions_count : min($limit, $lesson->questions_count);

        return response()->json([
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'summary' => $lesson->summary,
                'steps' => $lesson->stepsOrFallback(),
                'explanation' => $lesson->explanation,
                'exam_style' => $lesson->exam_style,
                'pitfalls' => $lesson->pitfalls,
                'subject' => [
                    'id' => $lesson->subject->id,
                    'slug' => $lesson->subject->slug,
                    'name' => $lesson->subject->name,
                ],
                'questions_total' => $lesson->questions_count,
                'questions_available' => $available,
                'limited_by_plan' => $available < $lesson->questions_count,
            ],
        ]);
    }
}
