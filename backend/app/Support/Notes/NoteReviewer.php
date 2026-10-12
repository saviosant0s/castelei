<?php

namespace App\Support\Notes;

use App\Models\Lesson;

/**
 * Quem confere a "explicação para si mesmo" contra o conteúdo da lição.
 *
 * Interface pelo mesmo motivo da escrita: o app não depende de um fornecedor,
 * e os testes não gastam crédito. A de verdade é `ClaudeNoteReviewer`.
 */
interface NoteReviewer
{
    /**
     * @return array{right: list<string>, wrong: list<string>, missing: list<string>}
     */
    public function review(Lesson $lesson, string $note): array;
}
