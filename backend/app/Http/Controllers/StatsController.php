<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Subject;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * As estatísticas que ajudam a decidir o que estudar.
 *
 * Tudo sai da ÚLTIMA resposta de cada questão, e não da média de todas as
 * tentativas. A média diz como a pessoa foi; a última resposta diz o que ela
 * sabe hoje. Quem errou em setembro e acertou ontem domina a questão — e quem
 * acertou em setembro e errou ontem esqueceu, que é justamente o que a média
 * esconderia.
 *
 * Três perguntas, uma por chave:
 * - `subjects`: estou pronto para a prova? (e o mapa da matéria, lição a lição)
 * - `weak_lessons`: onde eu erro, e se está melhorando;
 * - `retention`: o que eu acertei e depois esqueci.
 */
class StatsController extends Controller
{
    /** A mesma régua das outras telas: 80% domina, abaixo de 50% pede revisão. */
    public const MASTERED = 80;

    /** Diferença, em pontos, para dizer que a lição melhorou ou piorou. */
    private const TREND_POINTS = 15;

    public function __construct(private ReviewService $review)
    {
    }

    public function index(Request $request): JsonResponse
    {
        // Em ordem de id: a ordem em que a pessoa respondeu.
        $answers = DB::table('answers')
            ->join('attempts', 'attempts.id', '=', 'answers.attempt_id')
            ->join('questions', 'questions.id', '=', 'answers.question_id')
            ->join('lessons', 'lessons.id', '=', 'questions.lesson_id')
            ->where('attempts.user_id', $request->user()->id)
            ->whereNotNull('attempts.finished_at')
            ->orderBy('answers.id')
            ->get([
                'answers.id', 'answers.question_id', 'answers.is_correct',
                'questions.topic', 'questions.format', 'questions.lesson_id', 'lessons.subject_id',
            ])
            ->map(function ($row) {
                $row->is_correct = (bool) $row->is_correct;
                $row->writing = $row->format === Question::FORMAT_WRITING;

                return $row;
            });

        // Matéria que virou privada sai daqui também: o mapa e as listas são
        // links, e link para lição que responde 404 é pior que nenhum.
        $visiveis = Subject::visibleTo($request->user())->pluck('id')->flip();
        $answers = $answers->filter(fn ($a) => isset($visiveis[$a->subject_id]))->values();

        $porQuestao = $answers->groupBy('question_id');

        return response()->json([
            'subjects' => $this->subjects($answers, $porQuestao),
            'weak_lessons' => $this->weakLessons($answers->reject(fn ($a) => $a->writing)),
            'retention' => $this->retention($porQuestao->reject(fn ($lista) => $lista->first()->writing)),
        ]);
    }

    /**
     * Uma entrada por matéria já praticada, com a lição inteira em ordem.
     *
     * O domínio da lição conta só as questões de base (sem nível e fora do
     * simulado): são elas que toda pessoa recebe. Uma questão nunca respondida
     * conta como não dominada — senão acertar uma de oito daria 100%.
     *
     * @param  Collection<int, object>  $answers
     * @param  Collection<int, Collection<int, object>>  $porQuestao
     * @return list<array<string, mixed>>
     */
    private function subjects(Collection $answers, Collection $porQuestao): array
    {
        if ($answers->isEmpty()) {
            return [];
        }

        // A última atividade de cada matéria desempata a ordem.
        $recente = $answers->groupBy('subject_id')->map(fn ($lista) => $lista->max('id'));

        $subjects = Subject::query()
            ->whereIn('id', $recente->keys())
            ->with(['lessons' => fn ($q) => $q->orderBy('position')->select('id', 'subject_id', 'title', 'position', 'module')])
            ->get();

        $base = DB::table('questions')
            ->whereIn('lesson_id', $subjects->flatMap->lessons->pluck('id'))
            ->where('exam_only', false)
            ->whereNull('difficulty')
            ->get(['id', 'lesson_id'])
            ->groupBy('lesson_id');

        return $subjects
            ->map(function (Subject $subject) use ($base, $porQuestao, $recente) {
                $licoes = $subject->lessons
                    ->filter(fn ($lesson) => $base->has($lesson->id))
                    ->map(function ($lesson) use ($base, $porQuestao) {
                        $ids = $base[$lesson->id]->pluck('id');
                        $respondidas = $ids->filter(fn ($id) => $porQuestao->has($id));
                        $certas = $respondidas->filter(fn ($id) => $porQuestao[$id]->last()->is_correct);

                        return [
                            'id' => $lesson->id,
                            'title' => $lesson->title,
                            'module' => $lesson->module,
                            'mastery' => $respondidas->isEmpty()
                                ? null
                                : (int) round($certas->count() / $ids->count() * 100),
                        ];
                    })
                    ->values();

                return [
                    'id' => $subject->id,
                    'slug' => $subject->slug,
                    'name' => $subject->name,
                    'exam_date' => $subject->exam_date?->format('Y-m-d'),
                    'days_to_exam' => $this->review->daysToExam($subject),
                    'lessons_total' => $licoes->count(),
                    'lessons_started' => $licoes->whereNotNull('mastery')->count(),
                    'lessons_mastered' => $licoes->where('mastery', '>=', self::MASTERED)->count(),
                    'lessons' => $licoes->all(),
                    '_recente' => $recente[$subject->id],
                ];
            })
            // Prova mais perto primeiro; sem prova, a matéria mexida por último.
            ->sortBy([
                fn ($a, $b) => ($a['days_to_exam'] ?? PHP_INT_MAX) <=> ($b['days_to_exam'] ?? PHP_INT_MAX),
                fn ($a, $b) => $b['_recente'] <=> $a['_recente'],
            ])
            ->map(fn ($s) => collect($s)->except('_recente')->all())
            ->values()
            ->all();
    }

    /**
     * As lições mais fracas HOJE, e para onde estão indo.
     *
     * Por lição, e não por tópico: no conteúdo, o tópico é quase sempre uma
     * questão só, e "0%, piorando" por causa de UMA questão errada é ruído —
     * uma questão errada não é um ponto fraco. A lição é o assunto.
     *
     * "Hoje" é a última resposta de cada questão respondida. A tendência
     * compara com a PRIMEIRA resposta das mesmas questões: subiu, a revisão
     * está funcionando; caiu, a lição está escapando. Sem questão respondida
     * duas vezes não há tendência — e a tela diz isso em vez de inventar seta.
     *
     * @param  Collection<int, object>  $answers
     * @return list<array<string, mixed>>
     */
    private function weakLessons(Collection $answers): array
    {
        $lessons = DB::table('lessons')
            ->join('subjects', 'subjects.id', '=', 'lessons.subject_id')
            ->whereIn('lessons.id', $answers->pluck('lesson_id')->unique())
            ->get(['lessons.id', 'lessons.title', 'subjects.name as subject_name'])
            ->keyBy('id');

        return $answers
            ->groupBy('lesson_id')
            ->map(function (Collection $lista, $lessonId) use ($lessons) {
                $porQuestao = $lista->groupBy('question_id');
                $ultimas = $porQuestao->map->last();
                $agora = $this->percent($ultimas);
                $primeira = $this->percent($porQuestao->map->first());
                $repetiu = $porQuestao->contains(fn ($l) => $l->count() > 1);

                return [
                    'lesson_id' => (int) $lessonId,
                    'lesson_title' => $lessons[$lessonId]->title,
                    'subject_name' => $lessons[$lessonId]->subject_name,
                    'answered' => $porQuestao->count(),
                    'wrong' => $ultimas->where('is_correct', false)->count(),
                    'accuracy' => $agora,
                    'first_accuracy' => $primeira,
                    'trend' => ! $repetiu ? null : match (true) {
                        $agora - $primeira >= self::TREND_POINTS => 'up',
                        $primeira - $agora >= self::TREND_POINTS => 'down',
                        default => 'flat',
                    },
                ];
            })
            ->filter(fn ($l) => $l['accuracy'] < self::MASTERED)
            ->sortBy([['accuracy', 'asc'], ['wrong', 'desc'], ['lesson_title', 'asc']])
            ->take(5)
            ->values()
            ->all();
    }

    /**
     * O que a pessoa já acertou e, vendo de novo, errou.
     *
     * `kept`/`rechecked` conta as respostas dadas DEPOIS de um acerto na mesma
     * questão: é o teste de memória de verdade. Comparar com o acerto de
     * primeira vez diz se a revisão está segurando o que se aprende.
     *
     * @param  Collection<int, Collection<int, object>>  $porQuestao
     * @return array<string, mixed>
     */
    private function retention(Collection $porQuestao): array
    {
        $primeiras = $porQuestao->map->first();
        $revistas = 0;
        $mantidas = 0;
        $esquecidas = [];

        foreach ($porQuestao as $lista) {
            $jaAcertou = false;
            foreach ($lista as $resposta) {
                if ($jaAcertou) {
                    $revistas++;
                    $mantidas += $resposta->is_correct ? 1 : 0;
                }
                $jaAcertou = $jaAcertou || $resposta->is_correct;
            }

            // Acertou alguma vez e a última resposta foi errada: esqueceu.
            $ultima = $lista->last();
            if (! $ultima->is_correct && $lista->contains('is_correct', true)) {
                $esquecidas[$ultima->lesson_id] = ($esquecidas[$ultima->lesson_id] ?? 0) + 1;
            }
        }

        arsort($esquecidas);
        $titulos = DB::table('lessons')
            ->join('subjects', 'subjects.id', '=', 'lessons.subject_id')
            ->whereIn('lessons.id', array_keys($esquecidas))
            ->get(['lessons.id', 'lessons.title', 'subjects.name as subject_name'])
            ->keyBy('id');

        return [
            'first_answered' => $primeiras->count(),
            'first_accuracy' => $primeiras->isEmpty() ? null : $this->percent($primeiras),
            'rechecked' => $revistas,
            'kept' => $mantidas,
            'kept_accuracy' => $revistas > 0 ? (int) round($mantidas / $revistas * 100) : null,
            'forgotten_lessons' => collect($esquecidas)
                ->take(5)
                ->map(fn ($n, $id) => [
                    'lesson_id' => (int) $id,
                    'lesson_title' => $titulos[$id]->title,
                    'subject_name' => $titulos[$id]->subject_name,
                    'forgotten' => $n,
                ])
                ->values()
                ->all(),
        ];
    }

    /** @param  Collection<int, object>  $respostas */
    private function percent(Collection $respostas): int
    {
        return (int) round($respostas->where('is_correct', true)->count() / max($respostas->count(), 1) * 100);
    }
}
