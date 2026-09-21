<?php

namespace App\Support\Content;

/**
 * O que a importação fez, em números — é isto que o painel mostra depois do
 * envio. Separa criado de atualizado de propósito: "8 questões atualizadas"
 * quando você esperava 8 criadas quer dizer que o slug já existia, e esse é
 * justamente o erro que passa despercebido.
 */
class ImportReport
{
    public bool $subjectCreated = false;

    public string $subjectSlug = '';

    public string $subjectName = '';

    public int $subjectId = 0;

    public int $lessonsCreated = 0;

    public int $lessonsUpdated = 0;

    public int $questionsCreated = 0;

    public int $questionsUpdated = 0;

    public int $questionsRemoved = 0;

    /** Lições que estão no app e não vieram no arquivo. */
    public array $orphanLessons = [];

    /** Lições em que sobraram questões além das que o arquivo trouxe. */
    public array $orphanQuestions = [];

    /** @var list<array{path: string, message: string}> */
    public array $warnings = [];

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'subject' => [
                'id' => $this->subjectId,
                'slug' => $this->subjectSlug,
                'name' => $this->subjectName,
                'created' => $this->subjectCreated,
            ],
            'lessons_created' => $this->lessonsCreated,
            'lessons_updated' => $this->lessonsUpdated,
            'questions_created' => $this->questionsCreated,
            'questions_updated' => $this->questionsUpdated,
            'questions_removed' => $this->questionsRemoved,
            'orphan_lessons' => $this->orphanLessons,
            'orphan_questions' => $this->orphanQuestions,
            'warnings' => $this->warnings,
        ];
    }
}
