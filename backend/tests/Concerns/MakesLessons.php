<?php

namespace Tests\Concerns;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\Subject;

trait MakesLessons
{
    /**
     * Cria matéria + lição com $questions questões.
     * A questão de posição i tem gabarito (i % 5) e tópico "Tópico A" (ímpar) ou "Tópico B" (par).
     */
    protected function makeLesson(int $questions = 8, int $lessonPosition = 1, ?Subject $subject = null): Lesson
    {
        $subject ??= Subject::create([
            'slug' => 'materia-'.uniqid(),
            'name' => 'Matéria de teste',
            'description' => 'Descrição',
            'position' => 1,
        ]);

        $lesson = Lesson::create([
            'subject_id' => $subject->id,
            'slug' => 'licao-'.uniqid(),
            'title' => 'Lição '.$lessonPosition,
            'position' => $lessonPosition,
            'summary' => 'Resumo',
            'explanation' => 'Explicação',
            'exam_style' => 'Como cai na prova',
            'pitfalls' => ['Pegadinha 1'],
        ]);

        for ($i = 1; $i <= $questions; $i++) {
            Question::create([
                'lesson_id' => $lesson->id,
                'position' => $i,
                'topic' => $i % 2 === 1 ? 'Tópico A' : 'Tópico B',
                'statement' => "Enunciado {$i}",
                'options' => ['A', 'B', 'C', 'D', 'E'],
                'correct_index' => $i % 5,
                'explanation' => "Explicação {$i}",
                'pitfall' => "Pegadinha {$i}",
            ]);
        }

        return $lesson;
    }
}
