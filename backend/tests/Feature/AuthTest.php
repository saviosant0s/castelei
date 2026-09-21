<?php

namespace Tests\Feature;

use App\Models\Attempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use MakesLessons, RefreshDatabase;

    public function test_cadastro_cria_usuario_no_plano_gratis_e_devolve_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Sávio',
            'email' => 'Savio@Example.com',
            'password' => 'senha-segura-123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.name', 'Sávio')
            ->assertJsonPath('user.email', 'savio@example.com')
            ->assertJsonPath('user.plan', 'free')
            ->assertJsonPath('user.questions_per_lesson', 5)
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('users', ['email' => 'savio@example.com', 'plan' => 'free']);
        $this->assertNotSame('senha-segura-123', User::first()->password);
    }

    public function test_cadastro_valida_campos(): void
    {
        $this->postJson('/api/register', ['name' => '', 'email' => 'nao-e-email', 'password' => '123'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_cadastro_recusa_email_repetido_ignorando_maiusculas(): void
    {
        User::factory()->create(['email' => 'savio@example.com']);

        $this->postJson('/api/register', [
            'name' => 'Outro',
            'email' => 'SAVIO@example.com',
            'password' => 'senha-segura-123',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }

    public function test_login_com_credenciais_corretas(): void
    {
        User::factory()->create(['email' => 'ana@example.com', 'password' => 'minha-senha-1']);

        $this->postJson('/api/login', ['email' => 'ana@example.com', 'password' => 'minha-senha-1'])
            ->assertOk()
            ->assertJsonPath('user.email', 'ana@example.com')
            ->assertJsonStructure(['token']);
    }

    public function test_login_com_senha_errada_falha_com_mensagem(): void
    {
        User::factory()->create(['email' => 'ana@example.com', 'password' => 'minha-senha-1']);

        $this->postJson('/api/login', ['email' => 'ana@example.com', 'password' => 'errada'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'E-mail ou senha incorretos.');
    }

    public function test_me_devolve_o_usuario_do_token(): void
    {
        $token = $this->postJson('/api/register', [
            'name' => 'Ana', 'email' => 'ana@example.com', 'password' => 'minha-senha-1',
        ])->json('token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'ana@example.com')
            ->assertJsonPath('user.plan_label', 'Grátis');
    }

    public function test_logout_revoga_o_token(): void
    {
        $token = $this->postJson('/api/register', [
            'name' => 'Ana', 'email' => 'ana@example.com', 'password' => 'minha-senha-1',
        ])->json('token');
        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_excluir_a_conta_apaga_o_usuario_o_historico_e_os_tokens(): void
    {
        $token = $this->postJson('/api/register', [
            'name' => 'Ana', 'email' => 'ana@example.com', 'password' => 'minha-senha-1',
        ])->json('token');

        $user = User::firstWhere('email', 'ana@example.com');
        $lesson = $this->makeLesson();
        Attempt::create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'started_at' => now(),
            'total_questions' => 3,
        ]);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson('/api/me')
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        // O histórico cai por cascata; o token sai na mão, porque o Sanctum
        // guarda o dono por relação polimórfica e o banco não apaga sozinho.
        $this->assertDatabaseMissing('attempts', ['user_id' => $user->id]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_ninguem_exclui_conta_sem_estar_autenticado(): void
    {
        $this->deleteJson('/api/me')->assertUnauthorized();
    }
}
