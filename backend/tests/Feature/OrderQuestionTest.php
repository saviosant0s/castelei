<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\User;
use App\Support\Practice\StepShuffle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/**
 * A questão de ordenar.
 *
 * O que estes testes protegem é a coisa que quebra em silêncio: o gabarito
 * de uma questão de ordenar é a PRÓPRIA lista de passos, na ordem certa.
 * Entregá-la sem embaralhar não dá erro nenhum — só entrega a resposta a
 * quem abrir as ferramentas do desenvolvedor.
 */
class OrderQuestionTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private const PASSOS = ['primeiro', 'segundo', 'terceiro', 'quarto'];

    private function comOrdenar(): array
    {
        $lesson = $this->makeLesson(8);
        $question = $lesson->questions()->where('position', 1)->first();
        $question->update([
            'format' => Question::FORMAT_ORDER,
            'options' => self::PASSOS,
            'correct_index' => 0,
        ]);

        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $resposta = $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated();

        return [$resposta, $question->fresh()];
    }

    public function test_os_passos_chegam_embaralhados_a_tela(): void
    {
        [$resposta, $question] = $this->comOrdenar();

        $entregues = $resposta->json('questions.0.options');

        $this->assertSame('order', $resposta->json('questions.0.format'));
        // Os mesmos passos, em outra ordem: nada some e nada aparece.
        $this->assertEqualsCanonicalizing(self::PASSOS, $entregues);
        $this->assertNotSame(self::PASSOS, $entregues);
    }

    public function test_a_sequencia_certa_acerta_e_a_trocada_erra(): void
    {
        [$resposta, $question] = $this->comOrdenar();

        $attemptId = $resposta->json('attempt.id');
        $entregues = $resposta->json('questions.0.options');

        // A resposta é a ordem DO QUE ESTÁ NA TELA: onde está "primeiro", etc.
        $certa = array_map(
            fn (string $passo) => array_search($passo, $entregues, true),
            self::PASSOS,
        );

        $this->postJson("/api/attempts/{$attemptId}/answers", [
            'question_id' => $question->id,
            'ordering' => $certa,
            'seconds' => 10,
        ])->assertOk()
            ->assertJsonPath('is_correct', true)
            ->assertJsonPath('correct_order', self::PASSOS);

        // A mesma tentativa não aceita responder duas vezes; vale outra.
        [$resposta2, $question2] = $this->comOrdenar();
        $attempt2 = $resposta2->json('attempt.id');
        $entregues2 = $resposta2->json('questions.0.options');
        $trocada = array_map(
            fn (string $passo) => array_search($passo, $entregues2, true),
            array_reverse(self::PASSOS),
        );

        $this->postJson("/api/attempts/{$attempt2}/answers", [
            'question_id' => $question2->id,
            'ordering' => $trocada,
            'seconds' => 10,
        ])->assertOk()->assertJsonPath('is_correct', false);
    }

    public function test_lista_vazia_e_pular_e_fica_registrado_como_tal(): void
    {
        /*
        | Pular não é errar. No banco, a diferença aparece em
        | `selected_order`: quem arriscou deixa a sequência que tentou; quem
        | pulou deixa nulo.
        */
        [$resposta, $question] = $this->comOrdenar();
        $attemptId = $resposta->json('attempt.id');

        $this->postJson("/api/attempts/{$attemptId}/answers", [
            'question_id' => $question->id,
            'ordering' => [],
            'seconds' => 3,
        ])->assertOk()->assertJsonPath('is_correct', false);

        $answer = \App\Models\Answer::where('attempt_id', $attemptId)->firstOrFail();

        $this->assertNull($answer->selected_order);
        $this->assertNull($answer->selected_index);
    }

    public function test_a_alternativa_nao_vale_numa_questao_de_ordenar(): void
    {
        // Mandar `selected` numa questão de ordenar não pode virar acerto por
        // acaso: o `correct_index` dela é zero só porque a coluna exige um.
        [$resposta, $question] = $this->comOrdenar();
        $attemptId = $resposta->json('attempt.id');

        $this->postJson("/api/attempts/{$attemptId}/answers", [
            'question_id' => $question->id,
            'selected' => 0,
            'seconds' => 3,
        ])->assertOk()->assertJsonPath('is_correct', false);
    }

    public function test_a_questao_de_associar_entrega_a_direita_embaralhada(): void
    {
        /*
        | Mesma armadilha da questão de ordenar: o gabarito é o alinhamento
        | entre as duas colunas. Entregar a direita na ordem em que foi
        | escrita mostraria os pares prontos.
        */
        $lesson = $this->makeLesson(8);
        $question = $lesson->questions()->where('position', 1)->first();
        $question->update([
            'format' => Question::FORMAT_MATCH,
            'options' => [],
            'pairs' => [
                ['left' => 'open', 'right' => 'CreateFile'],
                ['left' => 'read', 'right' => 'ReadFile'],
                ['left' => 'close', 'right' => 'CloseHandle'],
            ],
        ]);

        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $resposta = $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated();

        $direita = ['CreateFile', 'ReadFile', 'CloseHandle'];

        $this->assertSame(['open', 'read', 'close'], $resposta->json('questions.0.prompts'));
        $this->assertEqualsCanonicalizing($direita, $resposta->json('questions.0.options'));
        $this->assertNotSame($direita, $resposta->json('questions.0.options'));

        // Ligar cada esquerda ao seu par acerta.
        $entregues = $resposta->json('questions.0.options');
        $certa = array_map(fn (string $par) => array_search($par, $entregues, true), $direita);

        $this->postJson("/api/attempts/{$resposta->json('attempt.id')}/answers", [
            'question_id' => $question->id,
            'ordering' => $certa,
            'seconds' => 12,
        ])->assertOk()
            ->assertJsonPath('is_correct', true)
            ->assertJsonPath('correct_pairs.0.right', 'CreateFile');
    }

    public function test_o_embaralhamento_nunca_devolve_a_ordem_certa(): void
    {
        // 1 em 24 dos sorteios de quatro passos cai na ordem certa. Sem a
        // proteção, uma pessoa a cada 24 ganharia a resposta de graça.
        for ($attempt = 1; $attempt <= 300; $attempt++) {
            $this->assertNotSame([0, 1, 2, 3], StepShuffle::display($attempt, 7, 4));
        }
    }

    public function test_sequencia_incompleta_ou_repetida_nao_passa(): void
    {
        $this->assertFalse(StepShuffle::isCorrect([0, 1, 2], 1, 1, 4));
        $this->assertFalse(StepShuffle::isCorrect([0, 0, 1, 2], 1, 1, 4));
        $this->assertFalse(StepShuffle::isCorrect([0, 1, 2, 9], 1, 1, 4));
    }
}
