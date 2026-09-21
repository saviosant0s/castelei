<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Plans;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/**
 * Fase de testes: `unlock_all` faz todo mundo estudar como Pro. O plano
 * guardado no usuário não muda, então desligar a chave devolve os limites.
 */
class UnlockAllTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private function unlocked(): void
    {
        config(['castelei.unlock_all' => true]);
    }

    public function test_liberado_o_plano_gratis_recebe_todas_as_questoes(): void
    {
        $this->unlocked();
        $lesson = $this->makeLesson(12);

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $this->postJson("/api/lessons/{$lesson->id}/attempts")
            ->assertCreated()
            ->assertJsonCount(12, 'questions')
            ->assertJsonPath('limited_by_plan', false);
    }

    public function test_liberado_o_plano_gratis_abre_o_simulado(): void
    {
        $this->unlocked();
        $first = $this->makeLesson(8, 1);
        $this->makeLesson(8, 2, $first->subject);

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $this->postJson("/api/subjects/{$first->subject->id}/exams")->assertCreated();
    }

    public function test_liberado_o_plano_gratis_ve_gamificacao(): void
    {
        $this->unlocked();
        $lesson = $this->makeLesson(5);
        $user = User::factory()->create(['plan' => 'free']);

        Sanctum::actingAs($user);
        $start = $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated();
        $this->postJson('/api/attempts/'.$start->json('attempt.id').'/finish')
            ->assertOk()
            ->assertJsonPath('gamification.streak.current', 0);
    }

    public function test_liberado_o_usuario_aparece_como_pro(): void
    {
        $this->unlocked();

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $this->getJson('/api/me')
            ->assertOk()
            // O plano guardado continua sendo o grátis: só a leitura vira Pro.
            ->assertJsonPath('user.plan', 'free')
            ->assertJsonPath('user.effective_plan', 'pro')
            ->assertJsonPath('user.plan_label', 'Pro')
            ->assertJsonPath('user.questions_per_lesson', null)
            ->assertJsonPath('user.unlocked_for_testing', true);
    }

    public function test_desligar_a_chave_devolve_os_limites(): void
    {
        config(['castelei.unlock_all' => false]);
        $lesson = $this->makeLesson(12);

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $this->postJson("/api/lessons/{$lesson->id}/attempts")
            ->assertCreated()
            ->assertJsonCount(5, 'questions')
            ->assertJsonPath('limited_by_plan', true);

        $this->assertSame(5, Plans::questionLimit('free'));
        $this->assertFalse(Plans::hasExam('free'));
        $this->assertFalse(Plans::unlockedForEveryone());
    }

    public function test_o_comando_de_plano_continua_gravando_o_plano_real(): void
    {
        $this->unlocked();
        $user = User::factory()->create(['plan' => 'free', 'email' => 'aluno@exemplo.com']);

        $this->artisan('castelei:plan aluno@exemplo.com plus')->assertSuccessful();

        // Grava de verdade, mesmo com tudo liberado: a chave não mexe no banco.
        $this->assertSame('plus', $user->fresh()->plan);
    }
}
