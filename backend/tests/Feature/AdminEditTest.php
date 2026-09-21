<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesContent;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class AdminEditTest extends TestCase
{
    use MakesContent;
    use MakesLessons;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
    }

    public function test_cria_materia_vazia_pelo_painel(): void
    {
        $this->postJson('/api/admin/subjects', [
            'slug' => 'banco-de-dados',
            'name' => 'Banco de Dados',
            'description' => 'Do modelo ao SQL.',
        ])->assertCreated()->assertJsonPath('subject.origin', 'painel');

        $this->assertDatabaseHas('subjects', ['slug' => 'banco-de-dados']);
    }

    public function test_slug_de_materia_repetido_e_recusado(): void
    {
        $this->postJson('/api/admin/subjects', ['slug' => 'matematica', 'name' => 'Matemática'])->assertCreated();

        $this->postJson('/api/admin/subjects', ['slug' => 'matematica', 'name' => 'Outra'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('slug');
    }

    public function test_slug_com_acento_ou_espaco_e_recusado(): void
    {
        $this->postJson('/api/admin/subjects', ['slug' => 'Matemática Básica', 'name' => 'Matemática'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('slug');
    }

    public function test_lista_e_detalhe_mostram_a_origem_de_cada_materia(): void
    {
        $lesson = $this->makeLesson(8);
        $subject = $lesson->subject;

        $this->getJson('/api/admin/subjects')
            ->assertOk()
            ->assertJsonPath('subjects.0.origin', 'seed')
            ->assertJsonPath('subjects.0.lessons_count', 1)
            ->assertJsonPath('subjects.0.questions_count', 8);

        $this->getJson("/api/admin/subjects/{$subject->id}")
            ->assertOk()
            ->assertJsonPath('subject.lessons.0.questions_count', 8)
            ->assertJsonPath('subject.lessons.0.steps_count', 5);
    }

    public function test_cria_licao_com_etapas_e_recusa_slug_repetido(): void
    {
        $subject = $this->makeLesson(8)->subject;

        $this->postJson("/api/admin/subjects/{$subject->id}/lessons", [
            'slug' => 'licao-nova',
            'title' => 'Lição nova',
            'summary' => 'Resumo.',
            'steps' => $this->stepsPayload(),
        ])->assertCreated();

        $this->postJson("/api/admin/subjects/{$subject->id}/lessons", [
            'slug' => 'licao-nova',
            'title' => 'Repetida',
            'summary' => 'Resumo.',
            'steps' => $this->stepsPayload(),
        ])->assertStatus(422)->assertJsonValidationErrors('slug');
    }

    public function test_etapa_invalida_e_recusada_com_o_caminho_do_erro(): void
    {
        $subject = $this->makeLesson(8)->subject;
        $steps = $this->stepsPayload();
        $steps[2]['kind'] = 'inventado';

        $this->postJson("/api/admin/subjects/{$subject->id}/lessons", [
            'slug' => 'licao-nova',
            'title' => 'Lição nova',
            'summary' => 'Resumo.',
            'steps' => $steps,
        ])
            ->assertStatus(422)
            ->assertJsonPath('content_errors.0.path', 'steps[2].kind');
    }

    /** As colunas antigas são derivadas das etapas — o painel não pode deixá-las para trás. */
    public function test_editar_licao_refaz_as_colunas_antigas(): void
    {
        $lesson = $this->makeLesson(8);

        $steps = $this->stepsPayload();
        $steps[4]['body'] = ['A banca chama isso de outra coisa.'];

        $this->putJson("/api/admin/lessons/{$lesson->id}", [
            'title' => $lesson->title,
            'summary' => $lesson->summary,
            'steps' => $steps,
        ])->assertOk();

        $this->assertSame('A banca chama isso de outra coisa.', $lesson->fresh()->exam_style);
        $this->assertSame(['A mais comum.'], $lesson->fresh()->pitfalls);
    }

    public function test_apagar_licao_exige_o_titulo_digitado(): void
    {
        $lesson = $this->makeLesson(8);

        $this->deleteJson("/api/admin/lessons/{$lesson->id}", ['confirm' => 'qualquer coisa'])
            ->assertStatus(422);

        $this->assertDatabaseHas('lessons', ['id' => $lesson->id]);

        $this->deleteJson("/api/admin/lessons/{$lesson->id}", ['confirm' => $lesson->title])->assertOk();

        $this->assertDatabaseMissing('lessons', ['id' => $lesson->id]);
    }

    public function test_apagar_materia_exige_o_nome_digitado(): void
    {
        $subject = $this->makeLesson(8)->subject;

        $this->deleteJson("/api/admin/subjects/{$subject->id}", ['confirm' => 'errado'])->assertStatus(422);
        $this->deleteJson("/api/admin/subjects/{$subject->id}", ['confirm' => $subject->name])->assertOk();

        $this->assertSame(0, Subject::count());
    }

    public function test_adiciona_questao_no_fim_da_licao(): void
    {
        $lesson = $this->makeLesson(8);

        $this->postJson("/api/admin/lessons/{$lesson->id}/questions", [
            'topic' => 'Novo tópico',
            'statement' => 'Enunciado novo.',
            'options' => ['A', 'B', 'C', 'D', 'E'],
            'correct_index' => 2,
            'explanation' => 'Porque sim.',
        ])->assertCreated()->assertJsonPath('question.position', 9);
    }

    public function test_gabarito_fora_da_lista_e_recusado(): void
    {
        $lesson = $this->makeLesson(8);

        $this->postJson("/api/admin/lessons/{$lesson->id}/questions", [
            'topic' => 'Tópico',
            'statement' => 'Enunciado.',
            'options' => ['A', 'B', 'C'],
            'correct_index' => 7,
            'explanation' => 'Porque sim.',
        ])->assertStatus(422)->assertJsonValidationErrors('correct_index');
    }

    public function test_alternativas_repetidas_sao_recusadas(): void
    {
        $lesson = $this->makeLesson(8);

        $this->postJson("/api/admin/lessons/{$lesson->id}/questions", [
            'topic' => 'Tópico',
            'statement' => 'Enunciado.',
            'options' => ['A', 'A', 'C', 'D', 'E'],
            'correct_index' => 0,
            'explanation' => 'Porque sim.',
        ])->assertStatus(422)->assertJsonValidationErrors('options');
    }

    /**
     * Apagar uma questão do meio fecha o buraco.
     *
     * A posição é a chave que o importador usa. Com um buraco, a importação
     * seguinte gravaria a questão errada em cima da vaga vazia.
     */
    public function test_apagar_questao_do_meio_renumera_as_seguintes(): void
    {
        $lesson = $this->makeLesson(8);
        $terceira = $lesson->questions()->where('position', 3)->firstOrFail();

        $this->deleteJson("/api/admin/questions/{$terceira->id}")->assertOk();

        $posicoes = $lesson->fresh()->questions()->pluck('position')->all();
        $this->assertSame([1, 2, 3, 4, 5, 6, 7], $posicoes);
        $this->assertSame(7, Question::count());
    }

    public function test_reordena_as_licoes_da_materia(): void
    {
        $primeira = $this->makeLesson(8, 1);
        $subject = $primeira->subject;
        $segunda = $this->makeLesson(8, 2, $subject);

        $this->putJson("/api/admin/subjects/{$subject->id}/order", [
            'lessons' => [$segunda->id, $primeira->id],
        ])->assertOk();

        $this->assertSame(1, $segunda->fresh()->position);
        $this->assertSame(2, $primeira->fresh()->position);
    }

    public function test_reordenar_com_lista_incompleta_e_recusado(): void
    {
        $primeira = $this->makeLesson(8, 1);
        $subject = $primeira->subject;
        $this->makeLesson(8, 2, $subject);

        $this->putJson("/api/admin/subjects/{$subject->id}/order", [
            'lessons' => [$primeira->id],
        ])->assertStatus(422);
    }

    /** Sem isto, [7, 7] passaria na contagem e deixaria uma lição fora da ordem. */
    public function test_reordenar_com_licao_repetida_e_recusado(): void
    {
        $primeira = $this->makeLesson(8, 1);
        $subject = $primeira->subject;
        $this->makeLesson(8, 2, $subject);

        $this->putJson("/api/admin/subjects/{$subject->id}/order", [
            'lessons' => [$primeira->id, $primeira->id],
        ])->assertStatus(422)->assertJsonValidationErrors('lessons.1');
    }

    public function test_toda_escrita_passa_a_materia_para_o_painel(): void
    {
        $lesson = $this->makeLesson(8);
        $this->assertSame('seed', $lesson->subject->origin);

        $this->postJson("/api/admin/lessons/{$lesson->id}/questions", [
            'topic' => 'Tópico',
            'statement' => 'Enunciado.',
            'options' => ['A', 'B', 'C', 'D', 'E'],
            'correct_index' => 0,
            'explanation' => 'Porque sim.',
        ])->assertCreated();

        $this->assertSame('painel', $lesson->subject->fresh()->origin);
    }
}
