<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_painel_exige_login(): void
    {
        $this->getJson('/api/admin/subjects')->assertUnauthorized();
    }

    public function test_aluno_comum_nao_entra_no_painel(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/admin/subjects')
            ->assertForbidden()
            ->assertJsonPath('message', 'Esta área é só para quem administra o conteúdo do Castelei.');
    }

    /** Plano Pro é sobre estudar, não sobre publicar: uma coisa não dá a outra. */
    public function test_plano_pro_nao_da_acesso_ao_painel(): void
    {
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));

        $this->getJson('/api/admin/subjects')->assertForbidden();
    }

    public function test_coluna_is_admin_abre_o_painel(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));

        $this->getJson('/api/admin/subjects')->assertOk();
    }

    /** A porta de entrada: sem ela não haveria como criar o primeiro administrador no Railway. */
    public function test_lista_admin_emails_abre_o_painel(): void
    {
        config(['castelei.admin_emails' => 'outro@exemplo.com, DONO@Exemplo.com ']);

        Sanctum::actingAs(User::factory()->create(['email' => 'dono@exemplo.com']));

        $this->getJson('/api/admin/subjects')->assertOk();
    }

    public function test_escrita_tambem_e_barrada_para_aluno_comum(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/admin/subjects', [
            'slug' => 'invadida',
            'name' => 'Invadida',
        ])->assertForbidden();

        $this->assertDatabaseMissing('subjects', ['slug' => 'invadida']);
    }

    public function test_comando_da_e_tira_acesso(): void
    {
        $user = User::factory()->create(['email' => 'savio@exemplo.com']);

        $this->artisan('castelei:admin', ['email' => 'SAVIO@exemplo.com'])->assertSuccessful();
        $this->assertTrue($user->fresh()->isAdmin());

        $this->artisan('castelei:admin', ['email' => 'savio@exemplo.com', '--remover' => true])->assertSuccessful();
        $this->assertFalse($user->fresh()->isAdmin());
    }

    public function test_comando_avisa_quando_a_conta_nao_existe(): void
    {
        $this->artisan('castelei:admin', ['email' => 'ninguem@exemplo.com'])->assertFailed();
    }

    public function test_perfil_diz_se_a_pessoa_administra(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $this->getJson('/api/me')->assertOk()->assertJsonPath('user.is_admin', true);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/me')->assertOk()->assertJsonPath('user.is_admin', false);
    }
}
