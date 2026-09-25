<?php

namespace App\Support\Writing;

use App\Models\Question;

/**
 * Quem lê o texto e comenta o SENTIDO: se a tese se sustenta, se os
 * argumentos defendem a tese, se a conclusão fecha o que foi aberto.
 *
 * É uma interface para que o app não dependa de um fornecedor, e para que os
 * testes não gastem crédito: no teste, um leitor falso devolve um comentário
 * fixo. A implementação de verdade é `ClaudeWritingReviewer`.
 */
interface WritingReviewer
{
    public function review(Question $question, string $text): string;
}
