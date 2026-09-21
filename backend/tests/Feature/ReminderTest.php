<?php

namespace Tests\Feature;

use App\Models\PushSubscription;
use App\Models\Review;
use App\Models\Subject;
use App\Models\User;
use App\Support\Review\ReminderText;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class ReminderTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private function assinante(User $user, string $endpoint = 'https://push.exemplo/1', ?Carbon $avisadoEm = null): PushSubscription
    {
        return PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => $endpoint,
            'endpoint_hash' => PushSubscription::hashOf($endpoint),
            'p256dh' => 'p',
            'auth' => 'a',
            'last_notified_at' => $avisadoEm,
        ]);
    }

    /** Cria uma revisão já vencida para a lição. */
    private function vencida(User $user, string $titulo): Review
    {
        $subject = Subject::create(['slug' => 's-'.uniqid(), 'name' => 'Matéria', 'position' => 1]);
        $lesson = $this->makeLesson(8, 1, $subject);
        $lesson->update(['title' => $titulo]);

        return Review::create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'due_at' => now()->subDays(2),
            'reviewed_at' => now()->subDays(10),
            'last_percent' => 60,
            'interval_days' => 8,
        ]);
    }

    // ---- O texto ----

    public function test_uma_licao_fala_no_singular(): void
    {
        $user = User::factory()->create();
        $this->vencida($user, 'Escalonamento');

        $texto = ReminderText::build(Review::with('lesson')->get());

        $this->assertSame('Uma lição esperando revisão', $texto['title']);
        $this->assertSame('Escalonamento', $texto['body']);
    }

    public function test_varias_licoes_citam_as_primeiras_e_contam_o_resto(): void
    {
        $user = User::factory()->create();
        $this->vencida($user, 'Escalonamento');
        $this->vencida($user, 'Semáforos');
        $this->vencida($user, 'Memória virtual');
        $this->vencida($user, 'Paginação');

        $texto = ReminderText::build(Review::with('lesson')->orderBy('id')->get());

        $this->assertSame('4 lições esperando revisão', $texto['title']);
        $this->assertSame('Escalonamento · Semáforos e mais 2', $texto['body']);
    }

    /** "e mais 1", nunca "e mais 1 lições". */
    public function test_o_resto_de_uma_so_fala_no_singular(): void
    {
        $user = User::factory()->create();
        $this->vencida($user, 'Escalonamento');
        $this->vencida($user, 'Semáforos');
        $this->vencida($user, 'Memória virtual');

        $texto = ReminderText::build(Review::with('lesson')->orderBy('id')->get());

        $this->assertStringEndsWith('e mais 1', $texto['body']);
    }

    /** Lição apagada no painel não pode virar aviso com corpo vazio. */
    public function test_licao_apagada_nao_deixa_o_aviso_vazio(): void
    {
        $user = User::factory()->create();
        $review = $this->vencida($user, 'Escalonamento');
        $review->lesson->delete();

        $texto = ReminderText::build(Review::with('lesson')->get());

        $this->assertNotSame('', trim($texto['body']));
    }

    // ---- O comando ----

    public function test_avisa_quem_tem_licao_vencida(): void
    {
        $user = User::factory()->create();
        $this->vencida($user, 'Escalonamento');
        $this->assinante($user);

        $this->artisan('castelei:lembretes --seco')
            ->expectsOutputToContain('Uma lição esperando revisão')
            ->assertSuccessful();
    }

    public function test_nao_avisa_quem_nao_tem_nada_vencido(): void
    {
        $user = User::factory()->create();
        $this->assinante($user);

        $this->artisan('castelei:lembretes --seco')
            ->expectsOutputToContain('0 pessoa(s)')
            ->assertSuccessful();
    }

    /** Revisão que ainda não venceu não gera aviso. */
    public function test_nao_avisa_revisao_do_futuro(): void
    {
        $user = User::factory()->create();
        $this->vencida($user, 'Escalonamento')->update(['due_at' => now()->addDays(5)]);
        $this->assinante($user);

        $this->artisan('castelei:lembretes --seco')
            ->expectsOutputToContain('0 pessoa(s)')
            ->assertSuccessful();
    }

    /**
     * No máximo um por dia. Rodar o comando duas vezes (repetição do agendador,
     * execução à mão) não pode mandar dois avisos.
     */
    public function test_quem_ja_foi_avisado_hoje_fica_de_fora(): void
    {
        $user = User::factory()->create();
        $this->vencida($user, 'Escalonamento');
        $this->assinante($user, avisadoEm: now());

        $this->artisan('castelei:lembretes --seco')
            ->expectsOutputToContain('0 pessoa(s)')
            ->assertSuccessful();
    }

    public function test_quem_foi_avisado_ontem_entra_de_novo(): void
    {
        $user = User::factory()->create();
        $this->vencida($user, 'Escalonamento');
        $this->assinante($user, avisadoEm: now()->subDays(2));

        $this->artisan('castelei:lembretes --seco')
            ->expectsOutputToContain('1 pessoa(s)')
            ->assertSuccessful();
    }

    /** Quem nunca assinou não é avisado, mesmo com lição vencida. */
    public function test_sem_assinatura_nao_ha_aviso(): void
    {
        $user = User::factory()->create();
        $this->vencida($user, 'Escalonamento');

        $this->artisan('castelei:lembretes --seco')
            ->expectsOutputToContain('0 pessoa(s)')
            ->assertSuccessful();
    }

    /** Dois aparelhos da mesma pessoa são uma pessoa avisada, não duas. */
    public function test_dois_aparelhos_contam_uma_pessoa(): void
    {
        $user = User::factory()->create();
        $this->vencida($user, 'Escalonamento');
        $this->assinante($user, 'https://push.exemplo/1');
        $this->assinante($user, 'https://push.exemplo/2');

        $this->artisan('castelei:lembretes --seco')
            ->expectsOutputToContain('1 pessoa(s)')
            ->assertSuccessful();
    }

    /** Sem chaves VAPID o comando avisa e sai limpo, em vez de estourar de madrugada. */
    public function test_sem_chaves_o_comando_nao_quebra(): void
    {
        config(['castelei.push.public_key' => '', 'castelei.push.private_key' => '']);
        $user = User::factory()->create();
        $this->vencida($user, 'Escalonamento');
        $this->assinante($user);

        $this->artisan('castelei:lembretes')
            ->expectsOutputToContain('Sem chaves VAPID')
            ->assertSuccessful();
    }
}
