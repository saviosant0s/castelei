<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Question;
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
            ->join('subjects', 'subjects.id', '=', 'lessons.subject_id')
            ->where('attempts.user_id', $userId)
            ->whereNotNull('attempts.finished_at')
            ->selectRaw('questions.topic as topic, lessons.id as lesson_id, lessons.title as lesson_title, subjects.name as subject_name, COUNT(*) as answered, SUM(CASE WHEN answers.is_correct THEN 1 ELSE 0 END) as correct, AVG(answers.seconds) as avg_seconds, MAX(CASE WHEN questions.format = ? THEN 1 ELSE 0 END) as writing', [Question::FORMAT_WRITING])
            ->groupBy('questions.topic', 'lessons.id', 'lessons.title', 'subjects.name')
            ->get();

        $topics = $rows->map(fn ($row) => [
            'topic' => $row->topic,
            // A tela agrupa os tópicos pela lição: um tópico solto, com uma
            // questão só, não diz nada — a lição inteira diz.
            'lesson_id' => (int) $row->lesson_id,
            'lesson_title' => $row->lesson_title,
            'subject_name' => $row->subject_name,
            'answered' => (int) $row->answered,
            'correct' => (int) $row->correct,
            'accuracy' => (int) round(((int) $row->correct) / max((int) $row->answered, 1) * 100),
            'avg_seconds' => round((float) $row->avg_seconds, 1),
            // Parte de texto, não questão: a tela diz "cumpridas", não "certas".
            'writing' => (bool) $row->writing,
        ])->sortBy([['accuracy', 'asc'], ['topic', 'asc']])->values();

        /*
        | Os números gerais são de QUESTÕES. Uma parte de texto leva dez
        | minutos e não tem certo nem errado: somada ao resto, ela puxava o
        | tempo médio para cima e o acerto para uma conta que não é acerto.
        */
        $questoes = $topics->where('writing', false);
        $answered = $questoes->sum('answered');
        $correct = $questoes->sum('correct');

        $last = Attempt::query()
            ->where('user_id', $userId)
            ->with(['lesson.subject', 'subject'])
            ->latest('id')
            ->first();

        return response()->json([
            'overall' => [
                'attempts' => Attempt::where('user_id', $userId)->whereNotNull('finished_at')->count(),
                'answered' => $answered,
                'accuracy' => $answered > 0 ? (int) round($correct / $answered * 100) : null,
                'avg_seconds' => $answered > 0
                    ? round($questoes->sum(fn ($t) => $t['avg_seconds'] * $t['answered']) / $answered, 1)
                    : null,
            ],
            'topics' => $topics,
            'evolution' => $this->evolution($userId),
            'last_attempt' => $last ? [
                'kind' => $last->kind,
                'lesson_id' => $last->lesson_id,
                // O simulado não tem lição: o título é a própria matéria.
                'lesson_title' => $last->lesson?->title ?? 'Simulado',
                'subject_id' => $last->subject_id,
                'subject_name' => $last->lesson?->subject->name ?? $last->subject?->name,
                // O app precisa do slug para saber para onde levar quem voltar
                // de um simulado: ali não existe lição para onde apontar.
                'subject_slug' => $last->lesson?->subject->slug ?? $last->subject?->slug,
                'finished' => $last->finished_at !== null,
                'percent' => $last->finished_at !== null
                    ? (int) round($last->correct_count / max($last->total_questions, 1) * 100)
                    : null,
            ] : null,
            'gamification' => $this->gamificationFor($request),
        ]);
    }

    /**
     * Histórico para o gráfico de evolução: as últimas tentativas concluídas,
     * da mais antiga para a mais recente, com acerto e tempo médio.
     *
     * @return list<array<string, mixed>>
     */
    private function evolution(int $userId): array
    {
        $tentativas = Attempt::query()
            ->where('user_id', $userId)
            ->whereNotNull('finished_at')
            ->with(['lesson', 'subject'])
            ->latest('finished_at')
            ->latest('id')
            ->limit(30)
            ->get();

        /*
        | A prática de escrita fica fora dos gráficos. Eles medem acerto e tempo
        | por questão, e um texto não tem nenhum dos dois: o tempo de uma parte
        | escrita derrubava a linha de tempo e o gráfico dizia "você está mais
        | rápido" para quem só tinha mudado de matéria.
        */
        $primeiras = $tentativas->map(fn (Attempt $a) => $a->question_ids[0] ?? null)->filter()->all();
        $escrita = Question::query()->whereIn('id', $primeiras)->where('format', Question::FORMAT_WRITING)->pluck('id')->flip();

        return $tentativas
            ->reject(fn (Attempt $a) => isset($escrita[$a->question_ids[0] ?? 0]))
            ->reverse()
            ->map(fn (Attempt $attempt) => [
                'attempt_id' => $attempt->id,
                'kind' => $attempt->kind,
                'title' => $attempt->lesson?->title ?? ('Simulado — '.($attempt->subject?->name ?? 'matéria removida')),
                'finished_at' => $attempt->finished_at?->toIso8601String(),
                'percent' => (int) round($attempt->correct_count / max($attempt->total_questions, 1) * 100),
                'avg_seconds' => $attempt->avg_seconds,
            ])
            ->values()
            ->all();
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
