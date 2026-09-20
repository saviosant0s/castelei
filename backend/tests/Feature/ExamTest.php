<?php

namespace Tests\Feature;

use App\Models\Attempt;
use App\Models\Question;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class ExamTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    /** Matéria com $lessons lições de $perLesson questões cada. */
    private function makeSubject(int $lessons = 3, int $perLesson = 8): Subject
    {
        $first = $this->makeLesson($perLesson, 1);
        for ($i = 2; $i <= $lessons; $i++) {
            $this->makeLesson($perLesson, $i, $first->subject);
        }

        return $first->subject;
    }

    private function startExam(User $user, Subject $subject)
    {
        Sanctum::actingAs($user);

        return $this->postJson("/api/subjects/{$subject->id}/exams");
    }

    public function test_simulado_exige_login(): void
    {
        $subject = $this->makeSubject();

        $this->postJson("/api/subjects/{$subject->id}/exams")->assertUnauthorized();
    }

    public function test_plano_gratis_e_plus_nao_abrem_simulado(): void
    {
        $subject = $this->makeSubject();

        $this->startExam(User::factory()->create(['plan' => 'free']), $subject)->assertForbidden();
        $this->startExam(User::factory()->create(['plan' => 'plus']), $subject)->assertForbidden();
    }

    public function test_plano_pro_abre_simulado_sem_vazar_gabarito(): void
    {
        $subject = $this->makeSubject(3, 8); // 24 questões, alvo 20

        $response = $this->startExam(User::factory()->create(['plan' => 'pro']), $subject)
            ->assertCreated()
            ->assertJsonCount(20, 'questions')
            ->assertJsonPath('attempt.total', 20)
            ->assertJsonPath('attempt.kind', 'exam')
            ->assertJsonPath('subject.id', $subject->id)
            ->assertJsonPath('limited_by_plan', false)
            ->assertJsonMissingPath('questions.0.correct_index')
            ->assertJsonMissingPath('questions.0.explanation')
            ->assertJsonMissingPath('questions.0.pitfall');

        $attempt = Attempt::find($response->json('attempt.id'));
        $this->assertSame(Attempt::KIND_EXAM, $attempt->kind);
        $this->assertNull($attempt->lesson_id);
        $this->assertSame($subject->id, $attempt->subject_id);
        $this->assertCount(20, $attempt->question_ids);
    }

    public function test_chave_de_teste_libera_simulado_para_o_plano_gratis(): void
    {
        config(['castelei.exam_for_all' => true]);
        $subject = $this->makeSubject();

        $this->startExam(User::factory()->create(['plan' => 'free']), $subject)->assertCreated();
    }

    public function test_simulado_cobre_varias_licoes_da_materia(): void
    {
        $subject = $this->makeSubject(3, 8);

        $response = $this->startExam(User::factory()->create(['plan' => 'pro']), $subject)->assertCreated();

        $lessonIds = Question::whereIn('id', collect($response->json('questions'))->pluck('id'))
            ->pluck('lesson_id')
            ->unique();

        $this->assertCount(3, $lessonIds, 'O simulado deveria sortear questões das três lições.');
    }

    public function test_simulado_nao_repete_questao(): void
    {
        $subject = $this->makeSubject(3, 8);

        $ids = collect($this->startExam(User::factory()->create(['plan' => 'pro']), $subject)
            ->assertCreated()
            ->json('questions'))->pluck('id');

        $this->assertSame($ids->count(), $ids->unique()->count());
    }

    public function test_materia_pequena_entrega_o_que_tem(): void
    {
        $subject = $this->makeSubject(1, 6); // 6 questões só

        $this->startExam(User::factory()->create(['plan' => 'pro']), $subject)
            ->assertCreated()
            ->assertJsonCount(6, 'questions');
    }

    public function test_materia_sem_questoes_suficientes_devolve_422(): void
    {
        $subject = $this->makeSubject(1, 3); // abaixo do mínimo de 5

        $this->startExam(User::factory()->create(['plan' => 'pro']), $subject)->assertStatus(422);
    }

    public function test_responder_e_finalizar_simulado(): void
    {
        $subject = $this->makeSubject(3, 8);
        $user = User::factory()->create(['plan' => 'pro']);

        $start = $this->startExam($user, $subject)->assertCreated();
        $attemptId = $start->json('attempt.id');

        foreach ($start->json('questions') as $question) {
            $model = Question::find($question['id']);
            $this->postJson("/api/attempts/{$attemptId}/answers", [
                'question_id' => $question['id'],
                'selected' => $model->correct_index,
                'seconds' => 15,
            ])->assertOk();
        }

        $this->postJson("/api/attempts/{$attemptId}/finish")
            ->assertOk()
            ->assertJsonPath('kind', 'exam')
            ->assertJsonPath('total', 20)
            ->assertJsonPath('correct', 20)
            ->assertJsonPath('percent', 100)
            ->assertJsonPath('lesson_id', null)
            ->assertJsonPath('subject_id', $subject->id)
            ->assertJsonPath('next_lesson', null)
            ->assertJsonPath('limited_by_plan', false)
            ->assertJsonPath('avg_seconds', fn ($v) => (float) $v === 15.0);
    }

    public function test_nao_da_para_responder_questao_de_fora_do_simulado(): void
    {
        $subject = $this->makeSubject(3, 8);
        $outra = $this->makeLesson(4, 1); // outra matéria

        $start = $this->startExam(User::factory()->create(['plan' => 'pro']), $subject)->assertCreated();

        $this->postJson('/api/attempts/'.$start->json('attempt.id').'/answers', [
            'question_id' => $outra->questions()->first()->id,
            'selected' => 0,
            'seconds' => 10,
        ])->assertStatus(422);
    }

    public function test_recorde_do_simulado_compara_com_simulados_da_mesma_materia(): void
    {
        $subject = $this->makeSubject(3, 8);
        $user = User::factory()->create(['plan' => 'pro']);

        $first = $this->startExam($user, $subject)->assertCreated();
        $this->answerExam($first->json('attempt.id'), $first->json('questions'), 30);
        $this->postJson('/api/attempts/'.$first->json('attempt.id').'/finish')
            ->assertOk()
            ->assertJsonPath('is_record', false);

        $second = $this->startExam($user, $subject)->assertCreated();
        $this->answerExam($second->json('attempt.id'), $second->json('questions'), 20);
        $this->postJson('/api/attempts/'.$second->json('attempt.id').'/finish')
            ->assertOk()
            ->assertJsonPath('is_record', true)
            ->assertJsonPath('previous_best_avg_seconds', fn ($v) => (float) $v === 30.0);
    }

    public function test_recorde_da_licao_nao_se_mistura_com_o_do_simulado(): void
    {
        $subject = $this->makeSubject(3, 8);
        $user = User::factory()->create(['plan' => 'pro']);
        $lesson = $subject->lessons()->first();

        // Lição rápida primeiro.
        Sanctum::actingAs($user);
        $licao = $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated();
        $this->answerExam($licao->json('attempt.id'), $licao->json('questions'), 5);
        $this->postJson('/api/attempts/'.$licao->json('attempt.id').'/finish')->assertOk();

        // O simulado não deve enxergar os 5s da lição como recorde a bater.
        $exam = $this->startExam($user, $subject)->assertCreated();
        $this->answerExam($exam->json('attempt.id'), $exam->json('questions'), 40);
        $this->postJson('/api/attempts/'.$exam->json('attempt.id').'/finish')
            ->assertOk()
            ->assertJsonPath('previous_best_avg_seconds', null)
            ->assertJsonPath('is_record', false);
    }

    public function test_catalogo_informa_situacao_do_simulado(): void
    {
        $this->makeSubject(3, 8);

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $this->getJson('/api/subjects')
            ->assertOk()
            ->assertJsonPath('subjects.0.exam.available', true)
            ->assertJsonPath('subjects.0.exam.unlocked', false)
            ->assertJsonPath('subjects.0.exam.questions', 20);

        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $this->getJson('/api/subjects')
            ->assertOk()
            ->assertJsonPath('subjects.0.exam.unlocked', true);
    }

    public function test_progresso_inclui_simulado_na_evolucao(): void
    {
        $subject = $this->makeSubject(3, 8);
        $user = User::factory()->create(['plan' => 'pro']);

        $exam = $this->startExam($user, $subject)->assertCreated();
        $this->answerExam($exam->json('attempt.id'), $exam->json('questions'), 12);
        $this->postJson('/api/attempts/'.$exam->json('attempt.id').'/finish')->assertOk();

        $this->getJson('/api/progress')
            ->assertOk()
            ->assertJsonCount(1, 'evolution')
            ->assertJsonPath('evolution.0.kind', 'exam')
            ->assertJsonPath('evolution.0.percent', 100)
            ->assertJsonPath('last_attempt.kind', 'exam')
            ->assertJsonPath('last_attempt.subject_id', $subject->id);
    }

    /** Responde todo o simulado corretamente, gastando $seconds por questão. */
    private function answerExam(int $attemptId, array $questions, int $seconds): void
    {
        foreach ($questions as $question) {
            $model = Question::find($question['id']);
            $this->postJson("/api/attempts/{$attemptId}/answers", [
                'question_id' => $question['id'],
                'selected' => $model->correct_index,
                'seconds' => $seconds,
            ])->assertOk();
        }
    }
}
