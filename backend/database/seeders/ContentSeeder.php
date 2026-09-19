<?php

namespace Database\Seeders;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\Subject;
use Illuminate\Database\Seeder;

/**
 * Carrega matérias, lições e questões de database/seeders/content/*.json.
 * É idempotente: pode rodar a cada deploy sem duplicar nada.
 * Lições são identificadas por (matéria, slug) e questões por (lição, posição).
 */
class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $files = glob(__DIR__.'/content/*.json') ?: [];
        sort($files);

        foreach ($files as $index => $file) {
            $data = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);

            $subject = Subject::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'description' => $data['description'] ?? null,
                    'position' => $index + 1,
                ],
            );

            foreach ($data['lessons'] as $lessonIndex => $lessonData) {
                $lesson = Lesson::updateOrCreate(
                    ['subject_id' => $subject->id, 'slug' => $lessonData['slug']],
                    [
                        'title' => $lessonData['title'],
                        'position' => $lessonIndex + 1,
                        'summary' => $lessonData['summary'],
                        'explanation' => $lessonData['explanation'],
                        'exam_style' => $lessonData['exam_style'],
                        'pitfalls' => $lessonData['pitfalls'],
                    ],
                );

                foreach ($lessonData['questions'] as $questionIndex => $questionData) {
                    Question::updateOrCreate(
                        ['lesson_id' => $lesson->id, 'position' => $questionIndex + 1],
                        [
                            'topic' => $questionData['topic'],
                            'statement' => $questionData['statement'],
                            'options' => $questionData['options'],
                            'correct_index' => $questionData['correct_index'],
                            'explanation' => $questionData['explanation'],
                            'pitfall' => $questionData['pitfall'] ?? null,
                        ],
                    );
                }
            }
        }
    }
}
