<?php

namespace Tests\Feature;

use App\Models\PushSubscription;
use App\Models\Review;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/**
 * O gatilho de cron por HTTP.
 *
 * É uma rota SEM LOGIN que faz trabalho de verdade, então os testes aqui são
 * sobre quem NÃO pode entrar tanto quanto sobre quem pode.
 */
class CronTriggerTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private const SEGREDO = 'segredo-de-teste-bem-comprido-123456';

    private function comSegredo(): void
    {
        config(['castelei.cron.secret' => self::SEGREDO]);
    }

    /** Sem segredo configurado, a rota não existe — 404, não 403. */
    public function test_sem_segredo_configurado_a_rota_nao_existe(): void
    {
        config(['castelei.cron.secret' => '']);

        $this->postJson('/api/cron/lembretes')->assertNotFound();
        $this->postJson('/api/cron/lembretes', [], ['X-Castelei-Cron' => 'qualquer'])->assertNotFound();
    }

    /**
     * Segredo errado também devolve 404, e isso é decisão: 403 confirmaria que
     * a rota existe e convidaria a tentar de novo.
     */
    public function test_segredo_errado_devolve_404_e_nao_403(): void
    {
        $this->comSegredo();

        $resposta = $this->postJson('/api/cron/lembretes', [], ['X-Castelei-Cron' => 'chute']);

        $resposta->assertNotFound();
        $this->assertNotSame(403, $resposta->status());
    }

    public function test_sem_cabecalho_nenhum_devolve_404(): void
    {
        $this->comSegredo();

        $this->postJson('/api/cron/lembretes')->assertNotFound();
    }

    public function test_o_segredo_certo_roda_o_comando(): void
    {
        $this->comSegredo();

        $this->postJson('/api/cron/lembretes', [], ['X-Castelei-Cron' => self::SEGREDO])
            ->assertOk()
            ->assertJsonPath('ok', true);
    }

    /** O que o gatilho existe para fazer: avisar quem tem lição vencida. */
    public function test_o_gatilho_avisa_quem_tem_licao_vencida(): void
    {
        $this->comSegredo();

        $user = User::factory()->create();
        $subject = Subject::create(['slug' => 's-'.uniqid(), 'name' => 'Matéria', 'position' => 1]);
        $lesson = $this->makeLesson(8, 1, $subject);
        Review::create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'due_at' => now()->subDays(2),
            'reviewed_at' => now()->subDays(10),
            'interval_days' => 8,
        ]);
        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://push.exemplo/1',
            'endpoint_hash' => PushSubscription::hashOf('https://push.exemplo/1'),
            'p256dh' => 'p',
            'auth' => 'a',
        ]);

        $resposta = $this->postJson('/api/cron/lembretes', [], ['X-Castelei-Cron' => self::SEGREDO])->assertOk();

        // Sem chaves VAPID nos testes, o comando avisa e sai limpo em vez de estourar.
        $this->assertStringContainsString('VAPID', $resposta->json('output'));
    }

    /** GET não serve: o gatilho muda estado, e link clicável dispara sozinho. */
    public function test_get_nao_dispara(): void
    {
        $this->comSegredo();

        $this->get('/api/cron/lembretes')->assertStatus(405);
    }
}
