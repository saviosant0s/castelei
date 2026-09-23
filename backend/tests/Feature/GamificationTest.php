<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\StudyDay;
use App\Models\User;
use App\Services\GamificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class GamificationTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private function plus(): User
    {
        $user = User::factory()->create(['plan' => 'plus']);
        Sanctum::actingAs($user);

        return $user;
    }

    /** Faz a lição inteira e devolve [resposta do início, resposta do resultado]. */
    private function play(Lesson $lesson, bool $correct, int $seconds = 10): array
    {
        $start = $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated();
        $attemptId = $start->json('attempt.id');

        foreach ($start->json('questions') as $question) {
            $model = Question::find($question['id']);
            $this->postJson("/api/attempts/{$attemptId}/answers", [
                'question_id' => $question['id'],
                'selected' => $this->naTela($attemptId, $model->id, $correct ? $model->correct_index : ($model->correct_index + 1) % 5),
                'seconds' => $seconds,
            ])->assertOk();
        }

        return [$start, $this->postJson("/api/attempts/{$attemptId}/finish")->assertOk()];
    }

    private function badgeKeys($finishResponse): array
    {
        return array_column($finishResponse->json('gamification.new_badges') ?? [], 'key');
    }

    public function test_resposta_certa_da_20_xp_e_errada_da_0(): void
    {
        $lesson = $this->makeLesson(8);
        $this->plus();
        $start = $this->postJson("/api/lessons/{$lesson->id}/attempts");
        $id = $start->json('attempt.id');

        // questão 1 tem gabarito 1; questão 2 tem gabarito 2
        $q1 = $start->json('questions.0.id');
        $q2 = $start->json('questions.1.id');
        $this->postJson("/api/attempts/{$id}/answers", ['question_id' => $q1, 'selected' => $this->naTela($id, $q1, 1), 'seconds' => 5])
            ->assertJsonPath('xp', 20);
        $this->postJson("/api/attempts/{$id}/answers", ['question_id' => $q2, 'selected' => $this->naTela($id, $q2, 0), 'seconds' => 5])
            ->assertJsonPath('xp', 0);
    }

    public function test_plano_gratis_acumula_dados_mas_nao_mostra_gamificacao(): void
    {
        $lesson = $this->makeLesson(8);
        $user = User::factory()->create(['plan' => 'free']);
        Sanctum::actingAs($user);

        [, $finish] = $this->play($lesson, true);

        $finish->assertJsonPath('gamification', null);
        $this->getJson('/api/progress')->assertJsonPath('gamification', null);
        // os dados ficam guardados, prontos para quando a pessoa assinar
        $this->assertSame(5 * 20, (int) DB::table('answers')->sum('xp'));
        $this->assertDatabaseHas('study_days', ['user_id' => $user->id]);
        $this->assertDatabaseHas('user_badges', ['user_id' => $user->id, 'badge' => 'primeira-licao']);
    }

    public function test_chave_de_teste_libera_gamificacao_para_o_plano_gratis(): void
    {
        config(['castelei.gamification_for_all' => true]);
        $lesson = $this->makeLesson(8);
        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));

        [, $finish] = $this->play($lesson, true);

        $finish->assertJsonPath('gamification.xp_earned', 100);
    }

    public function test_resultado_do_plus_traz_xp_streak_e_conquistas(): void
    {
        $lesson = $this->makeLesson(8);
        $this->plus();

        [, $finish] = $this->play($lesson, true);

        $finish->assertJsonPath('gamification.xp_earned', 160)
            ->assertJsonPath('gamification.xp_total', 160)
            ->assertJsonPath('gamification.streak.current', 1)
            ->assertJsonPath('gamification.streak.studied_today', true);
        $keys = $this->badgeKeys($finish);
        $this->assertContains('primeira-licao', $keys);
        $this->assertContains('gabarito-limpo', $keys);
    }

    public function test_streak_soma_dias_anteriores_e_libera_a_conquista_de_3_dias(): void
    {
        $lesson = $this->makeLesson(8);
        $user = $this->plus();
        $today = app(GamificationService::class)->today();
        foreach ([1, 2] as $daysAgo) {
            StudyDay::create(['user_id' => $user->id, 'day' => date('Y-m-d', strtotime("{$today} -{$daysAgo} days"))]);
        }

        [, $finish] = $this->play($lesson, true);

        $finish->assertJsonPath('gamification.streak.current', 3);
        $this->assertContains('streak-3', $this->badgeKeys($finish));
    }

    public function test_progresso_mantem_o_streak_vivo_se_estudou_ontem(): void
    {
        $user = $this->plus();
        $today = app(GamificationService::class)->today();
        foreach ([1, 2] as $daysAgo) {
            StudyDay::create(['user_id' => $user->id, 'day' => date('Y-m-d', strtotime("{$today} -{$daysAgo} days"))]);
        }

        $this->getJson('/api/progress')
            ->assertOk()
            ->assertJsonPath('gamification.streak.current', 2)
            ->assertJsonPath('gamification.streak.studied_today', false)
            ->assertJsonCount(7, 'gamification.week')
            ->assertJsonPath('gamification.week.6.studied', false)
            ->assertJsonPath('gamification.week.5.studied', true);
    }

    public function test_progresso_lista_o_catalogo_com_o_que_ja_foi_ganho(): void
    {
        $lesson = $this->makeLesson(8);
        $this->plus();
        $this->play($lesson, true);

        $response = $this->getJson('/api/progress')->assertOk();

        $response->assertJsonCount(10, 'gamification.badges')
            ->assertJsonPath('gamification.xp_total', 160)
            ->assertJsonPath('gamification.week.6.studied', true);
        $earned = collect($response->json('gamification.badges'))->where('earned', true)->pluck('key')->all();
        $this->assertContains('primeira-licao', $earned);
        $this->assertNotContains('streak-7', $earned);
    }

    public function test_virou_o_jogo_ao_acertar_o_que_errou_antes(): void
    {
        $lesson = $this->makeLesson(8);
        $this->plus();

        [, $first] = $this->play($lesson, false);
        $this->assertNotContains('virou-o-jogo', $this->badgeKeys($first));

        [, $second] = $this->play($lesson, true);
        $this->assertContains('virou-o-jogo', $this->badgeKeys($second));
    }

    public function test_bater_o_recorde_de_tempo_libera_a_conquista(): void
    {
        $lesson = $this->makeLesson(8);
        $this->plus();

        [, $first] = $this->play($lesson, false, 30);
        $this->assertNotContains('recorde-de-tempo', $this->badgeKeys($first));

        [, $second] = $this->play($lesson, false, 20);
        $this->assertContains('recorde-de-tempo', $this->badgeKeys($second));
    }

    public function test_conquista_nao_e_dada_duas_vezes(): void
    {
        $lesson = $this->makeLesson(8);
        $this->plus();

        $this->play($lesson, true);
        [, $second] = $this->play($lesson, true);

        $this->assertNotContains('primeira-licao', $this->badgeKeys($second));
        $this->assertSame(1, DB::table('user_badges')->where('badge', 'primeira-licao')->count());
    }

    public function test_finalizar_de_novo_repete_as_mesmas_conquistas_sem_duplicar(): void
    {
        $lesson = $this->makeLesson(8);
        $this->plus();
        [$start, $finish] = $this->play($lesson, true);
        $before = $this->badgeKeys($finish);

        $again = $this->postJson('/api/attempts/'.$start->json('attempt.id').'/finish')->assertOk();

        $this->assertSame($before, $this->badgeKeys($again));
        $this->assertSame(count($before), DB::table('user_badges')->count());
    }

    public function test_terminar_licoes_de_duas_materias_libera_explorador(): void
    {
        $first = $this->makeLesson(6);
        $second = $this->makeLesson(6); // outra matéria (cada chamada cria a sua)
        $this->plus();

        [, $one] = $this->play($first, true);
        $this->assertNotContains('duas-materias', $this->badgeKeys($one));

        [, $two] = $this->play($second, true);
        $this->assertContains('duas-materias', $this->badgeKeys($two));
    }

    public function test_conquista_de_500_xp_chega_na_quarta_licao_completa(): void
    {
        $lesson = $this->makeLesson(8); // 8 acertos = 160 XP por rodada
        $this->plus();

        foreach ([1, 2, 3] as $round) {
            [, $finish] = $this->play($lesson, true);
            $this->assertNotContains('xp-500', $this->badgeKeys($finish), "rodada {$round}");
        }

        [, $fourth] = $this->play($lesson, true);
        $this->assertContains('xp-500', $this->badgeKeys($fourth));
        $fourth->assertJsonPath('gamification.xp_total', 640);
    }
}
