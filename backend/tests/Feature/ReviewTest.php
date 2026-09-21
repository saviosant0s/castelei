<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Review;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    /** Pratica a lição inteira e termina, acertando ou errando tudo. */
    private function practice(User $user, $lesson, bool $correct = true): array
    {
        Sanctum::actingAs($user);

        $start = $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated();
        $attemptId = $start->json('attempt.id');

        foreach ($start->json('questions') as $question) {
            $model = Question::find($question['id']);
            $this->postJson("/api/attempts/{$attemptId}/answers", [
                'question_id' => $question['id'],
                'selected' => $correct ? $model->correct_index : ($model->correct_index + 1) % 5,
                'seconds' => 20,
            ])->assertOk();
        }

        return $this->postJson("/api/attempts/{$attemptId}/finish")->assertOk()->json();
    }

    private function subjectWithExam(int $daysAway): Subject
    {
        return Subject::create([
            'slug' => 'so-'.uniqid(),
            'name' => 'Sistemas Operacionais',
            'description' => 'Descrição',
            'position' => 1,
            'exam_date' => Carbon::now(config('castelei.timezone'))->addDays($daysAway)->toDateString(),
        ]);
    }

    public function test_terminar_a_licao_marca_a_proxima_revisao(): void
    {
        $lesson = $this->makeLesson(8, 1, $this->subjectWithExam(90));
        $user = User::factory()->create(['plan' => 'pro']);

        $result = $this->practice($user, $lesson);

        // 15% de 90 dias = 13,5, arredondado para cima, com fator 1,3 de acerto alto.
        $this->assertSame(18, $result['review']['interval_days']);
        $this->assertDatabaseHas('reviews', ['user_id' => $user->id, 'lesson_id' => $lesson->id]);
    }

    /** O achado de Cepeda, ponta a ponta: prova perto encurta o intervalo. */
    public function test_prova_mais_perto_encurta_o_intervalo(): void
    {
        $longe = $this->makeLesson(8, 1, $this->subjectWithExam(120));
        $perto = $this->makeLesson(8, 1, $this->subjectWithExam(20));
        $user = User::factory()->create(['plan' => 'pro']);

        $a = $this->practice($user, $longe)['review']['interval_days'];
        $b = $this->practice($user, $perto)['review']['interval_days'];

        $this->assertGreaterThan($b, $a);
    }

    public function test_errar_tudo_traz_a_licao_de_volta_mais_cedo(): void
    {
        $subject = $this->subjectWithExam(90);
        $acertou = $this->makeLesson(8, 1, $subject);
        $errou = $this->makeLesson(8, 2, $subject);
        $user = User::factory()->create(['plan' => 'pro']);

        $bom = $this->practice($user, $acertou, correct: true)['review']['interval_days'];
        $ruim = $this->practice($user, $errou, correct: false)['review']['interval_days'];

        $this->assertLessThan($bom, $ruim);
    }

    public function test_praticar_de_novo_reagenda_sem_duplicar(): void
    {
        $lesson = $this->makeLesson(8, 1, $this->subjectWithExam(90));
        $user = User::factory()->create(['plan' => 'pro']);

        $this->practice($user, $lesson, correct: false);
        $this->practice($user, $lesson, correct: true);

        $this->assertSame(1, Review::where('user_id', $user->id)->count());
    }

    /**
     * Recarregar a tela de resultado não pode empurrar a revisão para a frente.
     * Sem isto, quem desse F5 três vezes ganhava três dias de folga.
     */
    public function test_terminar_a_mesma_tentativa_de_novo_nao_reagenda(): void
    {
        $lesson = $this->makeLesson(8, 1, $this->subjectWithExam(90));
        $user = User::factory()->create(['plan' => 'pro']);

        Sanctum::actingAs($user);
        $start = $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated();
        $attemptId = $start->json('attempt.id');
        foreach ($start->json('questions') as $question) {
            $model = Question::find($question['id']);
            $this->postJson("/api/attempts/{$attemptId}/answers", [
                'question_id' => $question['id'],
                'selected' => $model->correct_index,
                'seconds' => 20,
            ])->assertOk();
        }

        $this->postJson("/api/attempts/{$attemptId}/finish")->assertOk();
        $antes = Review::where('lesson_id', $lesson->id)->firstOrFail()->due_at;

        $this->travel(2)->hours();
        $segundo = $this->postJson("/api/attempts/{$attemptId}/finish")->assertOk();

        $depois = Review::where('lesson_id', $lesson->id)->firstOrFail()->due_at;
        $this->assertTrue($antes->equalTo($depois), 'A revisão foi empurrada por um segundo finish.');
        $this->assertNotNull($segundo->json('review'));
    }

    public function test_a_rota_lista_so_o_que_venceu(): void
    {
        $subject = $this->subjectWithExam(90);
        $vencida = $this->makeLesson(8, 1, $subject);
        $futura = $this->makeLesson(8, 2, $subject);
        $user = User::factory()->create(['plan' => 'pro']);

        $this->practice($user, $vencida);
        $this->practice($user, $futura);

        // Empurra só a primeira para o passado.
        Review::where('lesson_id', $vencida->id)->update(['due_at' => now()->subDays(2)]);

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/review')->assertOk();

        $response->assertJsonCount(1, 'due')
            ->assertJsonPath('due.0.lesson_id', $vencida->id)
            ->assertJsonPath('due.0.subject_name', 'Sistemas Operacionais')
            ->assertJsonPath('due.0.days_late', 2)
            ->assertJsonPath('next', null);
    }

    /** Sem nada vencido, a tela precisa saber quando é a próxima para não mentir "acabou". */
    public function test_sem_vencidas_a_rota_devolve_a_proxima(): void
    {
        $lesson = $this->makeLesson(8, 1, $this->subjectWithExam(90));
        $user = User::factory()->create(['plan' => 'pro']);
        $this->practice($user, $lesson);

        Sanctum::actingAs($user);

        $this->getJson('/api/review')->assertOk()
            ->assertJsonCount(0, 'due')
            ->assertJsonPath('next.lesson_id', $lesson->id);
    }

    public function test_a_rota_exige_login(): void
    {
        $this->getJson('/api/review')->assertUnauthorized();
    }

    /** Ninguém vê a revisão de ninguém. */
    public function test_cada_aluno_ve_so_as_proprias_revisoes(): void
    {
        $lesson = $this->makeLesson(8, 1, $this->subjectWithExam(90));
        $dono = User::factory()->create(['plan' => 'pro']);
        $this->practice($dono, $lesson);
        Review::where('user_id', $dono->id)->update(['due_at' => now()->subDay()]);

        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));

        $this->getJson('/api/review')->assertOk()->assertJsonCount(0, 'due');
    }

    /** Matéria sem data de prova cai na escada de longo prazo, e o primeiro degrau é 1 dia. */
    public function test_materia_sem_prova_usa_a_escada(): void
    {
        $lesson = $this->makeLesson(8); // makeLesson cria matéria sem exam_date
        $user = User::factory()->create(['plan' => 'pro']);

        $result = $this->practice($user, $lesson);

        $ladder = config('castelei.review.fallback_days');
        // Primeiro degrau (1 dia) com fator 1,3 de acerto alto → 2.
        $this->assertSame((int) ceil($ladder[0] * 1.3), $result['review']['interval_days']);
    }

    /** Prova que já passou não pode gerar intervalo negativo nem travar a matéria. */
    public function test_prova_vencida_volta_para_a_escada(): void
    {
        $subject = $this->subjectWithExam(-5);
        $lesson = $this->makeLesson(8, 1, $subject);
        $user = User::factory()->create(['plan' => 'pro']);

        $result = $this->practice($user, $lesson);

        $this->assertGreaterThan(0, $result['review']['interval_days']);
    }

    /** O simulado atravessa lições: não há lição para marcar, e não pode quebrar. */
    public function test_simulado_nao_agenda_revisao(): void
    {
        $subject = $this->subjectWithExam(90);
        $this->makeLesson(8, 1, $subject);
        $this->makeLesson(8, 2, $subject);
        $user = User::factory()->create(['plan' => 'pro']);

        Sanctum::actingAs($user);
        $exam = $this->postJson("/api/subjects/{$subject->id}/exams")->assertCreated();
        $finish = $this->postJson("/api/attempts/{$exam->json('attempt.id')}/finish")->assertOk();

        $this->assertNull($finish->json('review'));
        $this->assertSame(0, Review::where('user_id', $user->id)->count());
    }
}
