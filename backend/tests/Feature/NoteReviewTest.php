<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\User;
use App\Support\Notes\ClaudeNoteReviewer;
use App\Support\Notes\LessonText;
use App\Support\Notes\NoteReviewer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class NoteReviewTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private const NOTA = 'Semáforo é um contador que deixa entrar enquanto for maior que zero.';

    private function ligar(int $limite = 2): void
    {
        config(['castelei.notes.ai.key' => 'chave-de-teste', 'castelei.notes.ai.enabled' => true, 'castelei.notes.ai.daily_limit' => $limite]);
    }

    private function revisorFalso(?\Throwable $erro = null): void
    {
        $this->app->instance(NoteReviewer::class, new class($erro) implements NoteReviewer
        {
            public function __construct(private ?\Throwable $erro) {}

            public function review(Lesson $lesson, string $note): array
            {
                if ($this->erro) {
                    throw $this->erro;
                }

                return ['right' => ['Contador certo.'], 'wrong' => [], 'missing' => ['O down e o up.']];
            }
        });
    }

    public function test_sem_chave_a_correcao_nao_existe(): void
    {
        $lesson = $this->makeLesson(1);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/lessons/{$lesson->id}/note")->assertJsonPath('ai', false);
        $this->postJson("/api/lessons/{$lesson->id}/note/review", ['text' => self::NOTA])->assertNotFound();
    }

    public function test_desligada_pela_variavel_tambem_nao_existe(): void
    {
        $this->ligar();
        config(['castelei.notes.ai.enabled' => false]);
        $lesson = $this->makeLesson(1);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/lessons/{$lesson->id}/note/review", ['text' => self::NOTA])->assertNotFound();
    }

    public function test_corrige_com_limite_por_dia(): void
    {
        $this->ligar(2);
        $this->revisorFalso();
        $lesson = $this->makeLesson(1);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/lessons/{$lesson->id}/note")->assertJsonPath('ai', true);
        $this->postJson("/api/lessons/{$lesson->id}/note/review", ['text' => self::NOTA])
            ->assertOk()
            ->assertJsonPath('review.right.0', 'Contador certo.')
            ->assertJsonPath('review.missing.0', 'O down e o up.')
            ->assertJsonPath('remaining', 1);
        $this->postJson("/api/lessons/{$lesson->id}/note/review", ['text' => self::NOTA])->assertOk();
        $this->postJson("/api/lessons/{$lesson->id}/note/review", ['text' => self::NOTA])->assertStatus(429);
    }

    public function test_a_correcao_fica_guardada_para_rever_sem_pagar_de_novo(): void
    {
        $this->ligar(5);
        $this->revisorFalso();
        $lesson = $this->makeLesson(1);
        $eu = User::factory()->create();
        Sanctum::actingAs($eu);

        $this->postJson("/api/lessons/{$lesson->id}/note/review", ['text' => self::NOTA])->assertOk()
            ->assertJsonPath('saved.note_text', self::NOTA);

        $this->getJson("/api/lessons/{$lesson->id}/note")
            ->assertJsonPath('last_review.note_text', self::NOTA)
            ->assertJsonPath('last_review.review.right.0', 'Contador certo.');
        $this->getJson('/api/note-reviews')
            ->assertJsonCount(1, 'reviews')
            ->assertJsonPath('reviews.0.lesson.id', $lesson->id)
            ->assertJsonPath('reviews.0.review.missing.0', 'O down e o up.');

        // A correção de um não aparece para outro.
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/note-reviews')->assertJsonCount(0, 'reviews');
        $this->getJson("/api/lessons/{$lesson->id}/note")->assertJsonPath('last_review', null);
    }

    public function test_anotacao_curta_demais_nao_gasta(): void
    {
        $this->ligar(1);
        $this->revisorFalso();
        $lesson = $this->makeLesson(1);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/lessons/{$lesson->id}/note/review", ['text' => 'oi'])->assertStatus(422);
        $this->postJson("/api/lessons/{$lesson->id}/note/review", ['text' => self::NOTA])->assertOk();
    }

    public function test_falha_da_ia_devolve_a_tentativa(): void
    {
        $this->ligar(1);
        $this->revisorFalso(new \RuntimeException('fora do ar'));
        $lesson = $this->makeLesson(1);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/lessons/{$lesson->id}/note/review", ['text' => self::NOTA])->assertStatus(503);
        $this->postJson("/api/lessons/{$lesson->id}/note/review", ['text' => self::NOTA])->assertStatus(503);
    }

    public function test_separa_as_tres_listas_da_resposta(): void
    {
        $texto = "ACERTOU:\n- O semáforo é um contador.\n\nCORRIGIR:\n- nada\n\nFaltou:\n• O que acontece quando chega a zero.\n";

        $this->assertSame([
            'right' => ['O semáforo é um contador.'],
            'wrong' => [],
            'missing' => ['O que acontece quando chega a zero.'],
        ], ClaudeNoteReviewer::parse($texto));
    }

    public function test_a_licao_vai_inteira_menos_o_codigo(): void
    {
        $lesson = $this->makeLesson(1);
        $lesson->update(['steps' => [[
            'kind' => 'idea', 'title' => 'O contador', 'body' => ['Um semáforo conta vagas.'],
            'code' => ['text' => 'sem_wait(&s);', 'notes' => ['Espera uma vaga.']],
            'terms' => [['word' => 'Semáforo', 'meaning' => 'um contador de vagas.']],
        ]]]);

        $texto = LessonText::of($lesson->fresh());

        $this->assertStringContainsString('Um semáforo conta vagas.', $texto);
        $this->assertStringContainsString('Espera uma vaga.', $texto);
        $this->assertStringContainsString('Semáforo: um contador de vagas.', $texto);
        $this->assertStringNotContainsString('sem_wait', $texto);
    }
}
