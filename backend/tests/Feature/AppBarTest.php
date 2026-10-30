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
            ->assertJsonPath('gamification.level', ['current' => 1, 'floor' => 0, 'next' => 100])
            ->assertJsonCount(7, 'gamification.week')
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

    public function test_a_meta_do_dia_conta_o_xp_de_hoje(): void
    {
        $user = User::factory()->create(['plan' => 'pro']);
        Sanctum::actingAs($user);
        $licao = $this->makeLesson(3, 1);

        $this->getJson('/api/me/bar')
            ->assertJsonPath('gamification.goal.target', 120)
            ->assertJsonPath('gamification.goal.today', 0);

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

        $this->assertSame(60, $this->getJson('/api/me/bar')->json('gamification.goal.today'));
    }

    public function test_troca_a_meta_so_entre_as_opcoes(): void
    {
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));

        $this->putJson('/api/me/daily-goal', ['goal' => 'puxada'])->assertOk()->assertJsonPath('daily_goal', 240);
        $this->getJson('/api/me/bar')->assertJsonPath('gamification.goal.target', 240);
        $this->getJson('/api/me')->assertJsonPath('user.daily_goal', 240);

        $this->putJson('/api/me/daily-goal', ['goal' => '5'])->assertUnprocessable();
    }

    public function test_a_semana_vai_de_domingo_a_sabado_e_marca_hoje(): void
    {
        $this->travelTo(\Carbon\CarbonImmutable::parse('2026-10-28 12:00', 'America/Sao_Paulo')); // quarta
        $user = User::factory()->create(['plan' => 'pro']);
        Sanctum::actingAs($user);
        app(\App\Services\GamificationService::class)->recordStudyToday($user);

        $semana = $this->getJson('/api/me/bar')->assertOk()->json('gamification.week');

        $this->assertSame('2026-10-25', $semana[0]['date']);
        $this->assertSame('2026-10-31', $semana[6]['date']);
        $this->assertTrue($semana[3]['studied']);
        $this->assertFalse($semana[3]['future']);
        $this->assertTrue($semana[4]['future']);
        $this->assertFalse($semana[2]['studied']);
    }

    public function test_o_nivel_sai_do_xp(): void
    {
        $this->assertSame(['current' => 1, 'floor' => 0, 'next' => 100], \App\Support\Gamification\Level::fromXp(99));
        $this->assertSame(['current' => 2, 'floor' => 100, 'next' => 250], \App\Support\Gamification\Level::fromXp(100));
        $this->assertSame(['current' => 4, 'floor' => 450, 'next' => 700], \App\Support\Gamification\Level::fromXp(600));
    }
}
