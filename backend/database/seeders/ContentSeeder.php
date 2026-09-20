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
    /**
     * As colunas antigas continuam preenchidas (derivadas das etapas) enquanto o app antigo
     * ainda pode estar no ar durante um deploy.
     *
     * @param  list<array<string, mixed>>  $steps
     * @return array{explanation: string, exam_style: string, pitfalls: list<string>}
     */
    private function legacyFields(array $steps): array
    {
        $explanation = [];
        $exam = [];
        $pitfalls = [];

        foreach ($steps as $step) {
            $body = $step['body'] ?? [];
            $bullets = $step['bullets'] ?? [];

            match ($step['kind']) {
                'exam' => $exam = [...$exam, ...$body, ...$bullets],
                'pitfall' => $pitfalls = [...$pitfalls, ...$bullets],
                'recap' => null,
                default => $explanation = [...$explanation, ...$body],
            };
        }

        return [
            'explanation' => implode("\n\n", $explanation),
            'exam_style' => implode("\n\n", $exam),
            'pitfalls' => $pitfalls,
        ];
    }

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
                        'source' => $lessonData['source'] ?? null,
                        'steps' => $lessonData['steps'],
                    ] + $this->legacyFields($lessonData['steps']),
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
