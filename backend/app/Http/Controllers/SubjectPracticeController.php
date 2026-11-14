<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Question;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Praticar a MATÉRIA, não a lição: a aba Questões.
 *
 * Pedido do Sávio, novembro de 2026: a aba mostrava cada lição com as suas
 * oito questões e os níveis de duas em duas, e o app parecia ter pouca
 * coisa. Agora a pessoa escolhe a matéria (e, no Pro, o nível) e recebe uma
 * rodada sorteada da matéria inteira.
 *
 * Diferente do simulado (Pro), a rodada é curta, mostra o gabarito a cada
 * questão como a prática comum, e é para todo mundo. Três regras:
 *
 * - Sem nível, só as questões de BASE; com nível, só as daquele nível (Pro).
 * - O corte do plano vale por lição: o grátis sorteia entre as oito de base
 *   de cada lição, as mesmas que ele já tem na prática da lição.
 * - As que a pessoa nunca respondeu vêm primeiro. Sorteio puro numa matéria
 *   de 200 questões repetiria as mesmas cedo demais.
 *
 * A trava entre lições não vale aqui: ela ordena a LEITURA da matéria, e
 * treinar questão é o caminho de quem já sabe e quer conferir.
 */
class SubjectPracticeController extends Controller
{
    public function store(Request $request, Subject $subject): JsonResponse
    {
        $user = $request->user();
        $nivel = $request->input('level');

        if ($nivel !== null) {
            abort_unless(in_array($nivel, Question::LEVELS, true), 422, 'Nível inválido.');
            abort_unless($user->hasLevels(), 403, 'Praticar por nível faz parte do plano Pro.');
        }

        $pool = $this->pool($subject, $nivel, $nivel === null ? $user->questionLimit() : null);
        abort_if($pool->isEmpty(), 422, 'Esta matéria ainda não tem questões para treinar.');

        $respondidas = DB::table('answers')
            ->join('attempts', 'attempts.id', '=', 'answers.attempt_id')
            ->where('attempts.user_id', $user->id)
            ->whereIn('answers.question_id', $pool->pluck('id'))
            ->distinct()
            ->pluck('answers.question_id')
            ->flip();

        [$novas, $vistas] = $pool->shuffle()->partition(fn (Question $q) => ! isset($respondidas[$q->id]));
        $questions = $novas->concat($vistas)->take((int) config('castelei.subject_practice.questions'))->values();

        $attempt = Attempt::create([
            'user_id' => $user->id,
            'kind' => Attempt::KIND_PRACTICE,
            'lesson_id' => null,
            'subject_id' => $subject->id,
            'started_at' => now(),
            'total_questions' => $questions->count(),
            'question_ids' => $questions->pluck('id')->all(),
        ]);

        return response()->json([
            'attempt' => ['id' => $attempt->id, 'total' => $attempt->total_questions, 'kind' => $attempt->kind],
            'subject' => ['id' => $subject->id, 'slug' => $subject->slug, 'name' => $subject->name],
            'questions' => $questions->map(fn (Question $question) => AttemptController::payload($question, $attempt->id))->values(),
            'limited_by_plan' => false,
        ], 201);
    }

    /**
     * As questões que podem entrar na rodada.
     *
     * @return Collection<int, Question>
     */
    private function pool(Subject $subject, ?string $nivel, ?int $limitePorLicao): Collection
    {
        return Question::query()
            ->whereIn('lesson_id', $subject->lessons()->pluck('id'))
            ->where('exam_only', false)
            ->where('format', '!=', Question::FORMAT_WRITING)
            ->when($nivel !== null, fn ($q) => $q->where('difficulty', $nivel), fn ($q) => $q->whereNull('difficulty'))
            ->orderBy('lesson_id')
            ->orderBy('position')
            ->get()
            ->groupBy('lesson_id')
            ->flatMap(fn (Collection $daLicao) => $limitePorLicao === null ? $daLicao : $daLicao->take($limitePorLicao))
            ->values();
    }
}
