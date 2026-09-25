<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/**
 * O visitante que cria conta leva o histórico junto.
 *
 * O que quebra em silêncio aqui é criar um usuário NOVO: a conta nasce
 * vazia, e o que a pessoa estudou fica preso no visitante, sem aviso.
 */
class ClaimAccountTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private function visitante(): User
    {
        return User::factory()->create(['name' => 'Visitante', 'email' => 'guest-abc@guest.invalid']);
    }

    public function test_o_visitante_vira_conta_e_o_historico_fica(): void
    {
        $guest = $this->visitante();
        Sanctum::actingAs($guest);

        $lesson = $this->makeLesson(2);
        $attempt = $this->postJson("/api/lessons/{$lesson->id}/attempts")->json('attempt.id');
        $this->postJson("/api/attempts/{$attempt}/finish")->assertOk();

        $this->getJson('/api/me')->assertJsonPath('user.is_guest', true);

        $this->postJson('/api/me/claim', [
            'name' => 'Sávio', 'email' => ' Savio@Exemplo.com ', 'password' => 'senha-segura',
        ])->assertOk()
            ->assertJsonPath('user.is_guest', false)
            ->assertJsonPath('user.email', 'savio@exemplo.com');

        // O mesmo usuário, com o histórico dele.
        $this->assertSame(1, User::count());
        $this->assertDatabaseHas('attempts', ['id' => $attempt, 'user_id' => $guest->id]);

        // E a senha nova funciona para entrar de outro aparelho.
        $this->postJson('/api/login', ['email' => 'savio@exemplo.com', 'password' => 'senha-segura'])->assertOk();
    }

    public function test_conta_de_verdade_nao_usa_este_caminho(): void
    {
        Sanctum::actingAs(User::factory()->create(['email' => 'real@exemplo.com']));

        $this->postJson('/api/me/claim', [
            'name' => 'Outro', 'email' => 'outro@exemplo.com', 'password' => 'senha-segura',
        ])->assertStatus(409);
    }

    public function test_email_ja_usado_manda_entrar(): void
    {
        User::factory()->create(['email' => 'savio@exemplo.com']);
        Sanctum::actingAs($this->visitante());

        $this->postJson('/api/me/claim', [
            'name' => 'Sávio', 'email' => 'savio@exemplo.com', 'password' => 'senha-segura',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_nao_da_para_virar_outro_visitante(): void
    {
        Sanctum::actingAs($this->visitante());

        $this->postJson('/api/me/claim', [
            'name' => 'X', 'email' => 'guest-zzz@guest.invalid', 'password' => 'senha-segura',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }
}
