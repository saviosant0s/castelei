<?php

namespace App\Support\Notes;

use App\Models\Lesson;

/**
 * Quem responde a dúvida que a pessoa teve no fim da lição.
 *
 * Interface pelo mesmo motivo do `NoteReviewer`: os testes não gastam
 * crédito. A de verdade é `ClaudeDoubtAnswerer`.
 */
interface DoubtAnswerer
{
    public function answer(Lesson $lesson, string $question): string;
}
