<?php

namespace Tests\Feature;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PushTest extends TestCase
{
    use RefreshDatabase;

    /** Um par VAPID de teste. Não vale nada fora daqui: nada é enviado nestes testes. */
    private function comChaves(): void
    {
        config([
            'castelei.push.public_key' => 'BJxKIiSn1U0k8ZkQ1BvDA0CkPGLPqPIXuV3PbZBRXCfSjnPRHFNHTWO5kiwFtLcEjHMlHGKQqZjnKPWQvpEhpAI',
            'castelei.push.private_key' => 'kaTIuIuqHRTxKO8pS0TwMSQ0Vp0PSjDIUEO2SxNz3ow',
        ]);
    }

    private function semChaves(): void
    {
        config(['castelei.push.public_key' => '', 'castelei.push.private_key' => '']);
    }

    private function assinatura(): array
    {
        return [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc123',
            'keys' => ['p256dh' => 'chave-publica-do-aparelho', 'auth' => 'segredo-do-aparelho'],
        ];
    }

    public function test_a_rota_exige_login(): void
    {
        $this->getJson('/api/push/key')->assertUnauthorized();
        $this->postJson('/api/push/subscriptions', $this->assinatura())->assertUnauthorized();
    }

    /**
     * Sem chaves no servidor a função não existe, e a tela precisa saber disso.
     * Botão que promete o que não funciona é pior do que botão nenhum.
     */
    public function test_sem_chaves_a_funcao_se_declara_desligada(): void
    {
        $this->semChaves();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/push/key')->assertOk()
            ->assertJsonPath('enabled', false)
            ->assertJsonPath('public_key', null);

        $this->postJson('/api/push/subscriptions', $this->assinatura())->assertStatus(503);
    }

    public function test_com_chaves_entrega_a_chave_publica(): void
    {
        $this->comChaves();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/push/key')->assertOk()
            ->assertJsonPath('enabled', true)
            ->assertJsonPath('public_key', config('castelei.push.public_key'));
    }

    /** A chave PRIVADA nunca pode sair do servidor. */
    public function test_a_chave_privada_nunca_e_devolvida(): void
    {
        $this->comChaves();
        Sanctum::actingAs(User::factory()->create());

        $corpo = $this->getJson('/api/push/key')->assertOk()->content();

        $this->assertStringNotContainsString((string) config('castelei.push.private_key'), $corpo);
    }

    public function test_assina_o_aparelho(): void
    {
        $this->comChaves();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/push/subscriptions', $this->assinatura())->assertCreated();

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $user->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/abc123',
        ]);
    }

    /**
     * O navegador reapresenta a MESMA assinatura a cada visita. Sem
     * `updateOrCreate`, o aparelho acumularia linhas e receberia o aviso
     * várias vezes.
     */
    public function test_assinar_de_novo_nao_duplica(): void
    {
        $this->comChaves();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/push/subscriptions', $this->assinatura())->assertCreated();
        $this->postJson('/api/push/subscriptions', $this->assinatura())->assertOk();

        $this->assertSame(1, PushSubscription::count());
    }

    /** O mesmo aparelho pode trocar de dono: a pessoa sai da conta e entra em outra. */
    public function test_o_mesmo_aparelho_troca_de_dono_sem_duplicar(): void
    {
        $this->comChaves();
        $primeiro = User::factory()->create();
        $segundo = User::factory()->create();

        Sanctum::actingAs($primeiro);
        $this->postJson('/api/push/subscriptions', $this->assinatura())->assertCreated();

        Sanctum::actingAs($segundo);
        $this->postJson('/api/push/subscriptions', $this->assinatura())->assertOk();

        $this->assertSame(1, PushSubscription::count());
        $this->assertSame($segundo->id, PushSubscription::first()->user_id);
    }

    public function test_desliga_o_aparelho(): void
    {
        $this->comChaves();
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/push/subscriptions', $this->assinatura())->assertCreated();

        $this->deleteJson('/api/push/subscriptions', ['endpoint' => $this->assinatura()['endpoint']])
            ->assertOk()
            ->assertJsonPath('subscribed', false);

        $this->assertSame(0, PushSubscription::count());
    }

    /**
     * Saber o endpoint de alguém não pode bastar para desligar o lembrete dessa
     * pessoa.
     */
    public function test_ninguem_desliga_o_lembrete_de_outro(): void
    {
        $this->comChaves();
        $dono = User::factory()->create();
        Sanctum::actingAs($dono);
        $this->postJson('/api/push/subscriptions', $this->assinatura())->assertCreated();

        Sanctum::actingAs(User::factory()->create());
        $this->deleteJson('/api/push/subscriptions', ['endpoint' => $this->assinatura()['endpoint']])->assertOk();

        $this->assertSame(1, PushSubscription::count());
    }

    public function test_assinatura_sem_chaves_do_aparelho_e_recusada(): void
    {
        $this->comChaves();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/push/subscriptions', ['endpoint' => 'https://fcm.googleapis.com/x'])
            ->assertStatus(422);
    }

    /** Apagar a conta leva as assinaturas junto: ninguém continua recebendo aviso de conta morta. */
    public function test_apagar_a_conta_apaga_as_assinaturas(): void
    {
        $this->comChaves();
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->postJson('/api/push/subscriptions', $this->assinatura())->assertCreated();

        $user->delete();

        $this->assertSame(0, PushSubscription::count());
    }
}
