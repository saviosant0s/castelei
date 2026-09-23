<?php

namespace Tests;

use App\Models\Question;
use App\Support\Practice\StepShuffle;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * A posição NA TELA de uma alternativa da múltipla escolha.
     *
     * As alternativas vão embaralhadas para cada tentativa (StepShuffle), e a
     * API recebe a posição que a pessoa tocou. O teste pensa no índice do
     * conteúdo, então traduz aqui.
     */
    protected function naTela(int $attemptId, int $questionId, ?int $original): ?int
    {
        if ($original === null) {
            return null;
        }

        $total = count(Question::findOrFail($questionId)->options);
        $posicao = array_search($original, StepShuffle::display($attemptId, $questionId, $total), true);

        return $posicao === false ? null : $posicao;
    }
}
