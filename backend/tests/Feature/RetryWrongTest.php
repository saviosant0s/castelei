<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/**
 * "Refazer só as que errei".
 *
 * Conta a ÚLTIMA resposta de cada questão: a que foi errada e depois acertada
 * já foi aprendida, e não volta.
 */
class RetryWrongTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    /** Responde as questões dadas: acerta as de $certas, erra o resto. */
    private function praticar(int $lessonId, array $certas, ?string $only = null): array
    {
        $inicio = $this->postJson("/api/lessons/{$lessonId}/attempts", $only ? ['only' => $only] : [])->assertCreated()->json();
        $attempt = $inicio['attempt']['id'];

        foreach ($inicio['questions'] as $q) {
            $question = \App\Models\Question::find($q['id']);
            $indice = in_array($question->position, $certas, true)
                ? $question->correct_index
                : ($question->correct_index + 1) % 5;
            $this->postJson("/api/attempts/{$attempt}/answers", [
                'question_id' => $question->id,
                'selected' => $this->naTela($attempt, $question->id, $indice),
                'seconds' => 5,
            ])->assertOk();
        }

        return $this->postJson("/api/attempts/{$attempt}/finish")->assertOk()->json() + ['questions' => $inicio['questions']];
    }

    public function test_so_as_erradas_voltam_e_as_acertadas_depois_saem(): void
    {
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $lesson = $this->makeLesson(4);

        // Primeira vez: acerta 1 e 2, erra 3 e 4.
        $resultado = $this->praticar($lesson->id, [1, 2]);
        $this->assertSame(2, $resultado['wrong_count']);
        $this->getJson("/api/lessons/{$lesson->id}")->assertJsonPath('lesson.wrong_count', 2);

        // Refazer as erradas traz só a 3 e a 4; acertar a 3 tira ela da lista.
        $refazer = $this->praticar($lesson->id, [3], 'wrong');
        $this->assertSame([3, 4], array_column($refazer['questions'], 'position'));
        $this->assertSame(1, $refazer['wrong_count']);
    }

    public function test_sem_erradas_nao_ha_o_que_refazer(): void
    {
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $lesson = $this->makeLesson(2);

        $this->praticar($lesson->id, [1, 2]);

        $this->postJson("/api/lessons/{$lesson->id}/attempts", ['only' => 'wrong'])->assertStatus(422);
    }

    public function test_as_erradas_de_outra_pessoa_nao_contam(): void
    {
        $lesson = $this->makeLesson(2);
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $this->praticar($lesson->id, []);

        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $this->getJson("/api/lessons/{$lesson->id}")->assertJsonPath('lesson.wrong_count', 0);
    }
}
