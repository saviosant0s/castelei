<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\User;
use App\Support\Notes\DoubtAnswerer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class LessonDoubtTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private function ligar(int $limite = 2, ?\Throwable $erro = null): void
    {
        config(['castelei.notes.ai.key' => 'chave-de-teste', 'castelei.notes.ai.enabled' => true, 'castelei.notes.ai.doubt_daily_limit' => $limite]);
        $this->app->instance(DoubtAnswerer::class, new class($erro) implements DoubtAnswerer
        {
            public function __construct(private ?\Throwable $erro) {}

            public function answer(Lesson $lesson, string $question): string
            {
                if ($this->erro) {
                    throw $this->erro;
                }

                return 'O PCB é a ficha do processo.';
            }
        });
    }

    public function test_sem_chave_a_duvida_nao_existe(): void
    {
        $lesson = $this->makeLesson(1);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/lessons/{$lesson->id}/doubts")->assertJsonPath('ai', false);
        $this->postJson("/api/lessons/{$lesson->id}/doubts", ['question' => 'O que é PCB?'])->assertNotFound();
    }

    public function test_responde_guarda_e_tem_limite_por_dia(): void
    {
        $this->ligar(2);
        $lesson = $this->makeLesson(1);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/lessons/{$lesson->id}/doubts", ['question' => 'O que é PCB?'])
            ->assertOk()
            ->assertJsonPath('doubt.answer', 'O PCB é a ficha do processo.')
            ->assertJsonPath('remaining', 1);
        $this->postJson("/api/lessons/{$lesson->id}/doubts", ['question' => 'E o contexto?'])->assertOk();
        $this->postJson("/api/lessons/{$lesson->id}/doubts", ['question' => 'Mais uma?'])->assertStatus(429);

        $this->getJson("/api/lessons/{$lesson->id}/doubts")
            ->assertJsonPath('ai', true)
            ->assertJsonCount(2, 'doubts')
            ->assertJsonPath('doubts.0.question', 'E o contexto?');
        $this->getJson('/api/doubts')->assertJsonCount(2, 'doubts')->assertJsonPath('doubts.0.lesson.id', $lesson->id);

        // A dúvida de um não aparece para outro.
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/doubts')->assertJsonCount(0, 'doubts');
    }

    public function test_falha_da_ia_devolve_a_tentativa_e_nao_guarda(): void
    {
        $this->ligar(1, new \RuntimeException('fora do ar'));
        $lesson = $this->makeLesson(1);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/lessons/{$lesson->id}/doubts", ['question' => 'O que é PCB?'])->assertStatus(503);
        $this->postJson("/api/lessons/{$lesson->id}/doubts", ['question' => 'O que é PCB?'])->assertStatus(503);
        $this->assertDatabaseCount('lesson_doubts', 0);
    }
}
