<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class PracticeFlowTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private function start(User $user, Lesson $lesson)
    {
        Sanctum::actingAs($user);

        return $this->postJson("/api/lessons/{$lesson->id}/attempts");
    }

    /** Responde todas as questões entregues, todas certas ou todas erradas. */
    private function answerAll(int $attemptId, array $questions, bool $correct, int $seconds): void
    {
        foreach ($questions as $question) {
            $model = \App\Models\Question::find($question['id']);
            $selected = $correct ? $model->correct_index : ($model->correct_index + 1) % 5;

            $this->postJson("/api/attempts/{$attemptId}/answers", [
                'question_id' => $question['id'],
                'selected' => $selected,
                'seconds' => $seconds,
            ])->assertOk();
        }
    }

    public function test_tentativa_entrega_so_5_questoes_no_plano_gratis_sem_vazar_gabarito(): void
    {
        $lesson = $this->makeLesson(8);

        $response = $this->start(User::factory()->create(['plan' => 'free']), $lesson)->assertCreated();

        $response->assertJsonCount(5, 'questions')
            ->assertJsonPath('attempt.total', 5)
            ->assertJsonPath('limited_by_plan', true)
            ->assertJsonMissingPath('questions.0.correct_index')
            ->assertJsonMissingPath('questions.0.explanation')
            ->assertJsonMissingPath('questions.0.pitfall');
    }

    public function test_plano_plus_recebe_todas_as_questoes(): void
    {
        $lesson = $this->makeLesson(8);

        $this->start(User::factory()->create(['plan' => 'plus']), $lesson)
            ->assertCreated()
            ->assertJsonCount(8, 'questions')
            ->assertJsonPath('limited_by_plan', false);
    }

    public function test_licao_sem_questoes_devolve_422(): void
    {
        $lesson = $this->makeLesson(0);

        $this->start(User::factory()->create(), $lesson)->assertUnprocessable();
    }

    public function test_resposta_certa_revela_gabarito_explicacao_e_pegadinha(): void
    {
        $lesson = $this->makeLesson(8);
        $start = $this->start(User::factory()->create(), $lesson);
        $question = $start->json('questions.0'); // posição 1 → gabarito 1

        $this->postJson('/api/attempts/'.$start->json('attempt.id').'/answers', [
            'question_id' => $question['id'], 'selected' => 1, 'seconds' => 12,
        ])->assertOk()
            ->assertJsonPath('is_correct', true)
            ->assertJsonPath('correct_index', 1)
            ->assertJsonPath('explanation', 'Explicação 1')
            ->assertJsonPath('pitfall', 'Pegadinha 1');
    }

    public function test_resposta_errada_e_pular_contam_como_erro_e_revelam_o_gabarito(): void
    {
        $lesson = $this->makeLesson(8);
        $start = $this->start(User::factory()->create(), $lesson);
        $attemptId = $start->json('attempt.id');

        $this->postJson("/api/attempts/{$attemptId}/answers", [
            'question_id' => $start->json('questions.0.id'), 'selected' => 0, 'seconds' => 5,
        ])->assertOk()->assertJsonPath('is_correct', false)->assertJsonPath('correct_index', 1);

        $this->postJson("/api/attempts/{$attemptId}/answers", [
            'question_id' => $start->json('questions.1.id'), 'selected' => null, 'seconds' => 5,
        ])->assertOk()->assertJsonPath('is_correct', false)->assertJsonPath('correct_index', 2);
    }

    public function test_nao_da_para_responder_questao_alem_do_limite_do_plano(): void
    {
        $lesson = $this->makeLesson(8);
        $start = $this->start(User::factory()->create(['plan' => 'free']), $lesson);
        $sixth = $lesson->questions()->where('position', 6)->first();

        $this->postJson('/api/attempts/'.$start->json('attempt.id').'/answers', [
            'question_id' => $sixth->id, 'selected' => 1, 'seconds' => 5,
        ])->assertUnprocessable();
    }

    public function test_nao_da_para_responder_a_mesma_questao_duas_vezes(): void
    {
        $lesson = $this->makeLesson(8);
        $start = $this->start(User::factory()->create(), $lesson);
        $payload = ['question_id' => $start->json('questions.0.id'), 'selected' => 1, 'seconds' => 5];
        $url = '/api/attempts/'.$start->json('attempt.id').'/answers';

        $this->postJson($url, $payload)->assertOk();
        $this->postJson($url, $payload)->assertStatus(409);
    }

    public function test_alternativa_e_tempo_sao_validados(): void
    {
        $lesson = $this->makeLesson(8);
        $start = $this->start(User::factory()->create(), $lesson);
        $url = '/api/attempts/'.$start->json('attempt.id').'/answers';
        $id = $start->json('questions.0.id');

        $this->postJson($url, ['question_id' => $id, 'selected' => 9, 'seconds' => 5])->assertUnprocessable();
        $this->postJson($url, ['question_id' => $id, 'selected' => 1, 'seconds' => -1])->assertUnprocessable();
        $this->postJson($url, ['question_id' => $id, 'selected' => 1])->assertUnprocessable();
    }

    public function test_ninguem_mexe_na_tentativa_de_outro_usuario(): void
    {
        $lesson = $this->makeLesson(8);
        $start = $this->start(User::factory()->create(), $lesson);
        $attemptId = $start->json('attempt.id');

        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/attempts/{$attemptId}/answers", [
            'question_id' => $start->json('questions.0.id'), 'selected' => 1, 'seconds' => 5,
        ])->assertNotFound();
        $this->postJson("/api/attempts/{$attemptId}/finish")->assertNotFound();
    }

    public function test_finalizar_calcula_resultado_media_de_tempo_e_ponto_fraco(): void
    {
        $lesson = $this->makeLesson(8);
        $start = $this->start(User::factory()->create(['plan' => 'free']), $lesson);
        $attemptId = $start->json('attempt.id');
        $questions = $start->json('questions');

        // Gabaritos: q1→1, q2→2, q3→3, q4→4, q5→0. Tópicos: q1 A, q2 B, q3 A, q4 B, q5 A.
        $answers = [
            [0, 1, 10], // q1 certa
            [1, 2, 20], // q2 certa
            [2, 0, 30], // q3 errada (A)
            [3, 0, 40], // q4 errada (B)
            [4, null, 50], // q5 pulada (A)
        ];
        foreach ($answers as [$index, $selected, $seconds]) {
            $this->postJson("/api/attempts/{$attemptId}/answers", [
                'question_id' => $questions[$index]['id'], 'selected' => $selected, 'seconds' => $seconds,
            ])->assertOk();
        }

        $this->postJson("/api/attempts/{$attemptId}/finish")
            ->assertOk()
            ->assertJsonPath('total', 5)
            ->assertJsonPath('correct', 2)
            ->assertJsonPath('percent', 40)
            ->assertJsonPath('avg_seconds', fn ($v) => (float) $v === 30.0)
            ->assertJsonPath('weak_topic', 'Tópico A')
            ->assertJsonPath('previous_best_avg_seconds', null)
            ->assertJsonPath('is_record', false)
            ->assertJsonPath('limited_by_plan', true);
    }

    public function test_finalizar_duas_vezes_devolve_o_mesmo_resultado(): void
    {
        $lesson = $this->makeLesson(8);
        $start = $this->start(User::factory()->create(), $lesson);
        $attemptId = $start->json('attempt.id');
        $this->answerAll($attemptId, $start->json('questions'), true, 10);

        $first = $this->postJson("/api/attempts/{$attemptId}/finish")->assertOk()->json();
        $second = $this->postJson("/api/attempts/{$attemptId}/finish")->assertOk()->json();

        $this->assertSame($first, $second);
        $this->assertSame(100, $first['percent']);
    }

    public function test_nao_da_para_responder_depois_de_finalizar(): void
    {
        $lesson = $this->makeLesson(8);
        $start = $this->start(User::factory()->create(), $lesson);
        $attemptId = $start->json('attempt.id');
        $this->postJson("/api/attempts/{$attemptId}/finish")->assertOk();

        $this->postJson("/api/attempts/{$attemptId}/answers", [
            'question_id' => $start->json('questions.0.id'), 'selected' => 1, 'seconds' => 5,
        ])->assertStatus(409);
    }

    public function test_bater_o_recorde_de_tempo_e_detectado(): void
    {
        $lesson = $this->makeLesson(8);
        $user = User::factory()->create();

        $first = $this->start($user, $lesson);
        $this->answerAll($first->json('attempt.id'), $first->json('questions'), false, 30);
        $this->postJson('/api/attempts/'.$first->json('attempt.id').'/finish')
            ->assertJsonPath('is_record', false);

        $second = $this->postJson("/api/lessons/{$lesson->id}/attempts");
        $this->answerAll($second->json('attempt.id'), $second->json('questions'), false, 20);
        $this->postJson('/api/attempts/'.$second->json('attempt.id').'/finish')
            ->assertOk()
            ->assertJsonPath('previous_best_avg_seconds', fn ($v) => (float) $v === 30.0)
            ->assertJsonPath('avg_seconds', fn ($v) => (float) $v === 20.0)
            ->assertJsonPath('is_record', true);
    }

    public function test_resultado_indica_a_proxima_licao_da_materia(): void
    {
        $first = $this->makeLesson(6, 1);
        $second = $this->makeLesson(6, 2, $first->subject);
        $start = $this->start(User::factory()->create(), $first);

        $this->postJson('/api/attempts/'.$start->json('attempt.id').'/finish')
            ->assertOk()
            ->assertJsonPath('next_lesson.id', $second->id);
    }

    public function test_progresso_agrega_por_topico_e_lembra_da_ultima_licao(): void
    {
        $lesson = $this->makeLesson(8);
        $user = User::factory()->create();
        $start = $this->start($user, $lesson);
        $attemptId = $start->json('attempt.id');
        $this->answerAll($attemptId, $start->json('questions'), true, 10);
        $this->postJson("/api/attempts/{$attemptId}/finish")->assertOk();

        $this->getJson('/api/progress')
            ->assertOk()
            ->assertJsonPath('overall.attempts', 1)
            ->assertJsonPath('overall.answered', 5)
            ->assertJsonPath('overall.accuracy', 100)
            ->assertJsonPath('overall.avg_seconds', fn ($v) => (float) $v === 10.0)
            ->assertJsonCount(2, 'topics')
            ->assertJsonPath('topics.0.lesson_id', $lesson->id)
            ->assertJsonPath('topics.0.subject_name', $lesson->subject->name)
            ->assertJsonPath('last_attempt.lesson_id', $lesson->id)
            ->assertJsonPath('last_attempt.finished', true)
            ->assertJsonPath('last_attempt.percent', 100);
    }

    public function test_progresso_vazio_para_usuario_novo(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/progress')
            ->assertOk()
            ->assertJsonPath('overall.attempts', 0)
            ->assertJsonPath('overall.accuracy', null)
            ->assertJsonPath('last_attempt', null)
            ->assertJsonCount(0, 'topics');
    }
}
