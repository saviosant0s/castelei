<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\Subject;
use App\Support\Content\Vocabulary;
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

        $minForExam = (int) config('castelei.exam.min_questions');
        $examTarget = (int) config('castelei.exam.questions');

        return response()->json([
            'subjects' => $subjects->map(fn (Subject $subject) => [
                'id' => $subject->id,
                'slug' => $subject->slug,
                'name' => $subject->name,
                'description' => $subject->description,
                /*
                | Data da prova do semestre. A tela usa para dizer quanto falta,
                | e o agendamento de revisão usa como prazo — ver
                | docs/revisao-espacada.md.
                */
                'exam_date' => $subject->exam_date?->format('Y-m-d'),
                'exam' => $this->examBlock($subject, $user->hasExam(), $minForExam, $examTarget),
                /*
                | Quantas palavras o vocabulário da matéria tem. Vem de graça:
                | as lições já estão carregadas com as etapas, e é a contagem
                | que decide se a tela da matéria oferece a página ou fica
                | calada. Link para uma página vazia é pior que link nenhum.
                */
                'vocabulary_terms' => count(Vocabulary::fromLessons($subject->lessons)),
                'lessons' => $subject->lessons->map(function (Lesson $lesson) use ($stats, $limit) {
                    $stat = $stats->get($lesson->id);

                    return [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'position' => $lesson->position,
                        // Nome do módulo, sem número: a trilha numera pela ordem.
                        'module' => $lesson->module,
                        'questions_total' => $lesson->questions_count,
                        'questions_available' => $limit === null ? $lesson->questions_count : min($limit, $lesson->questions_count),
                        'attempts' => $stat ? (int) $stat->attempts : 0,
                        'best_percent' => $stat && $stat->best_percent !== null ? (int) round((float) $stat->best_percent) : null,
                    ];
                })->values(),
            ])->values(),
        ]);
    }

    /**
     * Situação do simulado desta matéria: quantas questões ele teria e se o
     * aluno pode fazer. `unlocked` false = existe, mas o plano não inclui.
     *
     * @return array<string, mixed>
     */
    private function examBlock(Subject $subject, bool $unlocked, int $min, int $target): array
    {
        $pool = $subject->lessons->sum('questions_count');

        return [
            'available' => $pool >= $min,
            'unlocked' => $unlocked,
            'questions' => min($target, $pool),
        ];
    }

    /**
     * O vocabulário da matéria: as palavras novas de todas as lições.
     *
     * Vem do bloco `terms` das etapas, não de uma tabela — ver
     * App\Support\Content\Vocabulary para o porquê.
     */
    public function vocabulary(Subject $subject): JsonResponse
    {
        $subject->load('lessons');

        return response()->json([
            'subject' => [
                'id' => $subject->id,
                'slug' => $subject->slug,
                'name' => $subject->name,
            ],
            'terms' => Vocabulary::fromLessons($subject->lessons),
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
