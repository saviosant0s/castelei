<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/**
 * O cabeçalho fixo e a barra de baixo (`GET /me/bar`).
 */
class AppBarTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    public function test_quem_nunca_estudou_tem_cabecalho_zerado(): void
    {
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));

        $this->getJson('/api/me/bar')
            ->assertOk()
            ->assertJsonPath('gamification.streak', 0)
            ->assertJsonPath('gamification.xp', 0)
            ->assertJsonPath('area', null)
            ->assertJsonPath('reviews_due', 0);
    }

    public function test_mostra_a_area_da_ultima_licao_e_as_revisoes_vencidas(): void
    {
        $user = User::factory()->create(['plan' => 'pro']);
        Sanctum::actingAs($user);
        $licao = $this->makeLesson(2, 1);
        $licao->subject->update(['area' => 'matematica']);

        $inicio = $this->postJson("/api/lessons/{$licao->id}/attempts")->assertCreated()->json();
        $attempt = $inicio['attempt']['id'];
        foreach ($inicio['questions'] as $q) {
            $question = Question::find($q['id']);
            $this->postJson("/api/attempts/{$attempt}/answers", [
                'question_id' => $question->id,
                'selected' => $this->naTela($attempt, $question->id, $question->correct_index),
                'seconds' => 5,
            ])->assertOk();
        }
        $this->postJson("/api/attempts/{$attempt}/finish")->assertOk();
        Review::where('user_id', $user->id)->update(['due_at' => now()->subDay()]);

        $this->getJson('/api/me/bar')
            ->assertOk()
            ->assertJsonPath('area.slug', 'matematica')
            ->assertJsonPath('area.name', 'Matemática')
            ->assertJsonPath('gamification.streak', 1)
            ->assertJsonPath('gamification.studied_today', true)
            ->assertJsonPath('reviews_due', 1);
        $this->assertGreaterThan(0, $this->getJson('/api/me/bar')->json('gamification.xp'));
    }

    public function test_sem_sessao_nao_responde(): void
    {
        $this->getJson('/api/me/bar')->assertUnauthorized();
    }
}
