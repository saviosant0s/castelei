<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/**
 * As estatísticas de "o que estudar" (`GET /progress/stats`).
 *
 * Tudo sai da ÚLTIMA resposta de cada questão: é o que a pessoa sabe hoje.
 */
class StatsTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    /** Responde a lição inteira: acerta as posições de $certas, erra o resto. */
    private function praticar(int $lessonId, array $certas, ?string $only = null): void
    {
        $inicio = $this->postJson("/api/lessons/{$lessonId}/attempts", $only ? ['only' => $only] : [])->assertCreated()->json();
        $attempt = $inicio['attempt']['id'];

        foreach ($inicio['questions'] as $q) {
            $question = Question::find($q['id']);
            $indice = in_array($question->position, $certas, true)
                ? $question->correct_index
                : ($question->correct_index + 1) % 5;
            $this->postJson("/api/attempts/{$attempt}/answers", [
                'question_id' => $question->id,
                'selected' => $this->naTela($attempt, $question->id, $indice),
                'seconds' => 5,
            ])->assertOk();
        }

        $this->postJson("/api/attempts/{$attempt}/finish")->assertOk();
    }

    public function test_sem_pratica_nao_ha_numeros(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/progress/stats')
            ->assertOk()
            ->assertJsonPath('subjects', [])
            ->assertJsonPath('weak_lessons', [])
            ->assertJsonPath('retention.first_accuracy', null)
            ->assertJsonPath('retention.kept_accuracy', null);
    }

    public function test_o_mapa_traz_a_materia_inteira_e_o_dominio_conta_a_ultima_resposta(): void
    {
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $primeira = $this->makeLesson(4, 1);
        $segunda = $this->makeLesson(4, 2, $primeira->subject);
        $primeira->subject->update(['exam_date' => Carbon::now('America/Sao_Paulo')->addDays(10)->format('Y-m-d')]);

        // Errou duas; refazer as erradas e acertar sobe o domínio para 100%.
        $this->praticar($primeira->id, [1, 2]);
        $this->getJson('/api/progress/stats')->assertJsonPath('subjects.0.lessons.0.mastery', 50);
        $this->praticar($primeira->id, [3, 4], 'wrong');

        $this->getJson('/api/progress/stats')
            ->assertOk()
            ->assertJsonPath('subjects.0.days_to_exam', 10)
            ->assertJsonPath('subjects.0.lessons_total', 2)
            ->assertJsonPath('subjects.0.lessons_started', 1)
            ->assertJsonPath('subjects.0.lessons_mastered', 1)
            ->assertJsonPath('subjects.0.lessons.0.mastery', 100)
            // A lição ainda não praticada aparece, sem nota: é o buraco do mapa.
            ->assertJsonPath('subjects.0.lessons.1.id', $segunda->id)
            ->assertJsonPath('subjects.0.lessons.1.mastery', null);
    }

    public function test_questao_de_nivel_nao_entra_no_dominio(): void
    {
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $lesson = $this->makeLesson(2);
        Question::create([
            'lesson_id' => $lesson->id, 'position' => 3, 'topic' => 'Extra', 'statement' => 'Difícil',
            'options' => ['A', 'B', 'C', 'D', 'E'], 'correct_index' => 0, 'explanation' => 'x', 'difficulty' => 'dificil',
        ]);

        $this->praticar($lesson->id, [1, 2]);

        $this->getJson('/api/progress/stats')->assertJsonPath('subjects.0.lessons.0.mastery', 100);
    }

    public function test_onde_eu_erro_mostra_a_licao_fraca_e_a_tendencia(): void
    {
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $caindo = $this->makeLesson(4, 1);
        $parada = $this->makeLesson(4, 2, $caindo->subject);
        $boa = $this->makeLesson(4, 3, $caindo->subject);

        // A primeira começa em 75% e cai para 25%; a segunda fica em 25%.
        $this->praticar($caindo->id, [1, 2, 3]);
        $this->praticar($caindo->id, [1]);
        $this->praticar($parada->id, [1]);
        $this->praticar($parada->id, [1]);
        $this->praticar($boa->id, [1, 2, 3, 4]);

        $fracas = $this->getJson('/api/progress/stats')->json('weak_lessons');

        // A dominada não aparece; empate no acerto vai pelo título.
        $this->assertSame([$caindo->id, $parada->id], array_column($fracas, 'lesson_id'));
        $this->assertSame([25, 'down', 75, 3], [$fracas[0]['accuracy'], $fracas[0]['trend'], $fracas[0]['first_accuracy'], $fracas[0]['wrong']]);
        $this->assertSame('flat', $fracas[1]['trend']);
    }

    public function test_uma_pratica_so_nao_tem_tendencia(): void
    {
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $lesson = $this->makeLesson(4);

        $this->praticar($lesson->id, []);

        $this->getJson('/api/progress/stats')
            ->assertJsonPath('weak_lessons.0.accuracy', 0)
            ->assertJsonPath('weak_lessons.0.trend', null);
    }

    public function test_o_que_estou_esquecendo_conta_o_acerto_que_virou_erro(): void
    {
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $lesson = $this->makeLesson(4);

        $this->praticar($lesson->id, [1, 2, 3]);
        // Vendo de novo: manteve a 1 e a 2, esqueceu a 3.
        $this->praticar($lesson->id, [1, 2]);

        $this->getJson('/api/progress/stats')
            ->assertJsonPath('retention.first_accuracy', 75)
            ->assertJsonPath('retention.rechecked', 3)
            ->assertJsonPath('retention.kept', 2)
            ->assertJsonPath('retention.kept_accuracy', 67)
            ->assertJsonPath('retention.forgotten_lessons.0.lesson_id', $lesson->id)
            ->assertJsonPath('retention.forgotten_lessons.0.forgotten', 1);
    }

    public function test_os_numeros_de_outra_pessoa_nao_contam(): void
    {
        $lesson = $this->makeLesson(2);
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $this->praticar($lesson->id, []);

        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $this->getJson('/api/progress/stats')->assertJsonPath('subjects', []);
    }
}
