<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Question;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /** Inicia um simulado da matéria: questões sorteadas de várias lições, sem gabarito. */
    public function store(Request $request, Subject $subject): JsonResponse
    {
        abort_unless($request->user()->hasExam(), 403, 'O simulado faz parte do plano Pro.');

        /*
        | Matéria de escrita tem outro simulado: um texto inteiro, do zero,
        | sem o roteiro por partes da lição. As propostas dele são as questões
        | marcadas `exam_only`, e sai uma só, sorteada.
        */
        $propostas = Question::query()
            ->whereIn('lesson_id', $subject->lessons()->pluck('id'))
            ->where('exam_only', true)
            ->get();

        $questions = $propostas->isNotEmpty()
            ? collect([$propostas->random()])
            : $this->draw($subject);

        abort_if(
            $propostas->isEmpty() && $questions->count() < (int) config('castelei.exam.min_questions'),
            422,
            'Esta matéria ainda não tem questões suficientes para um simulado.',
        );

        $attempt = Attempt::create([
            'user_id' => $request->user()->id,
            'kind' => Attempt::KIND_EXAM,
            'lesson_id' => null,
            'subject_id' => $subject->id,
            'started_at' => now(),
            'total_questions' => $questions->count(),
            'question_ids' => $questions->pluck('id')->all(),
        ]);

        return response()->json([
            'attempt' => [
                'id' => $attempt->id,
                'total' => $attempt->total_questions,
                'kind' => $attempt->kind,
            ],
            'subject' => ['id' => $subject->id, 'slug' => $subject->slug, 'name' => $subject->name],
            'questions' => $questions->map(fn (Question $question) => AttemptController::payload($question, $attempt->id))->values(),
            'limited_by_plan' => false,
        ], 201);
    }

    /**
     * Sorteia as questões percorrendo as lições em rodízio: assim o simulado
     * cobre a matéria inteira em vez de concentrar tudo numa lição só.
     *
     * @return \Illuminate\Support\Collection<int, Question>
     */
    private function draw(Subject $subject): \Illuminate\Support\Collection
    {
        $target = (int) config('castelei.exam.questions');

        // Embaralha dentro de cada lição e mantém as lições na ordem do curso.
        $byLesson = Question::query()
            ->whereIn('lesson_id', $subject->lessons()->pluck('id'))
            ->get()
            ->shuffle()
            ->groupBy('lesson_id')
            ->sortKeys()
            ->map(fn ($questions) => $questions->values()) // o rodízio indexa por posição
            ->values();

        $drawn = collect();
        $round = 0;

        while ($drawn->count() < $target) {
            $tookOne = false;

            foreach ($byLesson as $questions) {
                if ($drawn->count() >= $target) {
                    break;
                }
                if ($questions->has($round)) {
                    $drawn->push($questions[$round]);
                    $tookOne = true;
                }
            }

            if (! $tookOne) {
                break; // acabaram as questões da matéria
            }
            $round++;
        }

        return $drawn->values();
    }
}
