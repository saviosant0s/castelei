<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_comando_troca_o_plano_do_usuario(): void
    {
        $user = User::factory()->create(['email' => 'ana@example.com']);

        $this->artisan('castelei:plan', ['email' => 'ANA@example.com', 'plan' => 'plus'])->assertSuccessful();

        $this->assertSame('plus', $user->fresh()->plan);
    }

    public function test_comando_recusa_plano_invalido_e_usuario_inexistente(): void
    {
        User::factory()->create(['email' => 'ana@example.com']);

        $this->artisan('castelei:plan', ['email' => 'ana@example.com', 'plan' => 'ouro'])->assertFailed();
        $this->artisan('castelei:plan', ['email' => 'ninguem@example.com', 'plan' => 'plus'])->assertFailed();
    }
}
