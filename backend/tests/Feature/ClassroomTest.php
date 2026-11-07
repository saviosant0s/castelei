<?php

namespace Tests\Feature;

use App\Models\Answer;
use App\Models\Attempt;
use App\Models\Classroom;
use App\Models\Lesson;
use App\Models\Subject;
use App\Models\User;
use App\Support\Content\ContentImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Turmas: quem cria, quem entra e o que o dono enxerga.
 *
 * O que mais importa aqui é a privacidade. Quem entra numa turma mostra ao
 * dono o progresso naquela matéria, e mais nada: nem e-mail, nem outra
 * matéria, nem turma alheia.
 */
class ClassroomTest extends TestCase
{
    use RefreshDatabase;

    private function materia(string $slug = 'materia-publica', string $visibility = 'public'): Subject
    {
        app(ContentImporter::class)->import([
            'slug' => $slug,
            'name' => 'Matéria '.$slug,
            'visibility' => $visibility,
            'lessons' => [[
                'slug' => 'licao-1',
                'title' => 'Lição 1',
                'summary' => 'Resumo da lição para o aluno saber do que se trata.',
                'steps' => [
                    ['kind' => 'idea', 'title' => 'Ideia', 'body' => ['Uma analogia do dia a dia.']],
                    ['kind' => 'recap', 'title' => 'Resumo', 'body' => ['Resumindo o que foi visto.']],
                ],
                'questions' => [
                    ['topic' => 'A', 'statement' => 'Primeira?', 'options' => ['A', 'B', 'C', 'D', 'E'], 'correct_index' => 0, 'explanation' => 'Porque sim.'],
                    ['topic' => 'B', 'statement' => 'Segunda?', 'options' => ['A', 'B', 'C', 'D', 'E'], 'correct_index' => 0, 'explanation' => 'Porque sim.'],
                ],
            ]],
        ], origin: 'seed');

        return Subject::firstWhere('slug', $slug);
    }

    private function turma(User $dono, Subject $materia): Classroom
    {
        // Criar turma é do Pro, e os testes rodam com a fase de testes desligada.
        $dono->forceFill(['plan' => 'pro'])->save();
        Sanctum::actingAs($dono);
        $id = $this->postJson('/api/classrooms', ['name' => 'Terceirão B', 'subject_id' => $materia->id])
            ->assertCreated()
            ->json('classroom.id');

        return Classroom::findOrFail($id);
    }

    /** Uma tentativa concluída com as respostas dadas, na ordem. */
    private function praticar(User $aluno, Lesson $licao, array $acertos): void
    {
        $tentativa = Attempt::create([
            'user_id' => $aluno->id, 'lesson_id' => $licao->id, 'kind' => Attempt::KIND_LESSON,
            'started_at' => now()->subMinutes(5), 'finished_at' => now(),
            'total_questions' => count($acertos), 'correct_count' => count(array_filter($acertos)),
        ]);
        foreach ($licao->questions as $i => $questao) {
            if (! array_key_exists($i, $acertos)) {
                continue;
            }
            Answer::create(['attempt_id' => $tentativa->id, 'question_id' => $questao->id, 'is_correct' => $acertos[$i], 'seconds' => 10, 'selected_index' => 0]);
        }
    }

    public function test_quem_tem_o_plano_cria_a_turma_com_um_codigo_curto(): void
    {
        $turma = $this->turma(User::factory()->create(), $this->materia());

        $this->assertSame(Classroom::CODE_LENGTH, strlen($turma->code));
        $this->assertDoesNotMatchRegularExpression('/[01OI]/', $turma->code);
    }

    public function test_criar_turma_e_do_pro_mas_entrar_e_de_todo_mundo(): void
    {
        config(['castelei.unlock_all' => false]);
        $materia = $this->materia();

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $this->postJson('/api/classrooms', ['name' => 'Turma', 'subject_id' => $materia->id])->assertForbidden();
        $this->getJson('/api/classrooms')->assertJsonPath('can_create', false);

        $dono = User::factory()->create(['plan' => 'pro']);
        $turma = $this->turma($dono, $materia);

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $this->postJson('/api/classrooms/join', ['code' => $turma->code])->assertOk();
    }

    public function test_materia_privada_nao_vira_turma(): void
    {
        $privada = $this->materia('rascunho', 'private');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true, 'plan' => 'pro']));

        $this->postJson('/api/classrooms', ['name' => 'Turma', 'subject_id' => $privada->id])->assertUnprocessable();
    }

    public function test_o_codigo_aceita_minuscula_e_traco_e_o_dono_nao_entra_na_propria_turma(): void
    {
        $dono = User::factory()->create();
        $turma = $this->turma($dono, $this->materia());

        $this->postJson('/api/classrooms/join', ['code' => $turma->code])->assertUnprocessable();

        $aluno = User::factory()->create();
        Sanctum::actingAs($aluno);
        $digitado = strtolower(substr($turma->code, 0, 3).'-'.substr($turma->code, 3));
        $this->getJson('/api/classrooms/code/'.$digitado)
            ->assertOk()
            ->assertJsonPath('classroom.is_member', false)
            ->assertJsonPath('classroom.owner.name', $dono->name);

        $this->postJson('/api/classrooms/join', ['code' => $digitado])->assertOk();
        $this->assertTrue($turma->hasMember($aluno));
        $this->getJson('/api/classrooms/code/'.$turma->code)->assertJsonPath('classroom.is_member', true);
    }

    public function test_visitante_nao_entra_em_turma(): void
    {
        $turma = $this->turma(User::factory()->create(), $this->materia());
        Sanctum::actingAs(User::factory()->create(['email' => 'guest-x@guest.invalid']));

        $this->postJson('/api/classrooms/join', ['code' => $turma->code])->assertForbidden();
    }

    public function test_quem_nao_e_da_turma_recebe_404_e_o_aluno_nao_ve_os_colegas(): void
    {
        $turma = $this->turma(User::factory()->create(), $this->materia());
        $aluno = User::factory()->create();
        $turma->members()->attach($aluno->id);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/classrooms/{$turma->id}")->assertNotFound();
        $this->deleteJson("/api/classrooms/{$turma->id}/membership")->assertNotFound();

        Sanctum::actingAs($aluno);
        $resposta = $this->getJson("/api/classrooms/{$turma->id}")->assertOk();
        $this->assertArrayNotHasKey('members', $resposta->json());
        $this->assertArrayNotHasKey('code', $resposta->json('classroom'));
    }

    public function test_o_dono_ve_o_desempenho_pela_ultima_resposta_e_nunca_o_email(): void
    {
        $materia = $this->materia();
        $outra = $this->materia('outra-materia');
        $dono = User::factory()->create();
        $turma = $this->turma($dono, $materia);
        $aluno = User::factory()->create(['name' => 'Beatriz']);
        $parado = User::factory()->create(['name' => 'Caio']);
        $turma->members()->attach([$aluno->id, $parado->id]);

        $licao = $materia->lessons()->first();
        // Errou as duas na primeira vez e acertou as duas depois: hoje sabe as duas.
        $this->praticar($aluno, $licao, [false, false]);
        $this->praticar($aluno, $licao, [true, true]);
        // O que ele faz em outra matéria não aparece para este dono.
        $this->praticar($aluno, $outra->lessons()->first(), [false, false]);

        Sanctum::actingAs($dono);
        $resposta = $this->getJson("/api/classrooms/{$turma->id}")->assertOk();

        $this->assertSame($turma->code, $resposta->json('classroom.code'));
        $this->assertStringNotContainsString($aluno->email, $resposta->getContent());

        $membros = collect($resposta->json('members'))->keyBy('name');
        $this->assertSame(1, $membros['Beatriz']['practiced']);
        $this->assertSame(100, $membros['Beatriz']['accuracy']);
        $this->assertSame(0, $membros['Beatriz']['days_inactive']);
        $this->assertSame(0, $membros['Caio']['practiced']);
        $this->assertNull($membros['Caio']['accuracy']);
        $this->assertNull($membros['Caio']['last_studied_at']);

        $this->assertSame(1, $resposta->json('lessons.0.practiced'));
        $this->assertSame(100, $resposta->json('lessons.0.accuracy'));
    }

    public function test_o_aluno_sai_o_dono_remove_e_so_o_dono_apaga(): void
    {
        $dono = User::factory()->create();
        $turma = $this->turma($dono, $this->materia());
        $aluno = User::factory()->create();
        $outro = User::factory()->create();
        $turma->members()->attach([$aluno->id, $outro->id]);

        Sanctum::actingAs($aluno);
        $this->deleteJson("/api/classrooms/{$turma->id}")->assertNotFound();
        $this->deleteJson("/api/classrooms/{$turma->id}/members/{$outro->id}")->assertNotFound();
        $this->deleteJson("/api/classrooms/{$turma->id}/membership")->assertOk();
        $this->assertFalse($turma->hasMember($aluno));

        Sanctum::actingAs($dono);
        $this->deleteJson("/api/classrooms/{$turma->id}/members/{$outro->id}")->assertOk();
        $this->assertFalse($turma->hasMember($outro));
        $this->deleteJson("/api/classrooms/{$turma->id}")->assertOk();
        $this->assertDatabaseMissing('classrooms', ['id' => $turma->id]);
    }

    public function test_a_lista_separa_as_turmas_criadas_das_turmas_em_que_entrou(): void
    {
        $materia = $this->materia();
        $dono = User::factory()->create();
        $turma = $this->turma($dono, $materia);
        $aluno = User::factory()->create();
        $turma->members()->attach($aluno->id);

        Sanctum::actingAs($dono);
        $this->getJson('/api/classrooms')
            ->assertJsonPath('owned.0.members_count', 1)
            ->assertJsonCount(0, 'joined')
            ->assertJsonPath('subjects.0.id', $materia->id);

        Sanctum::actingAs($aluno);
        $this->getJson('/api/classrooms')
            ->assertJsonCount(0, 'owned')
            ->assertJsonPath('joined.0.owner.name', $dono->name);
    }
}
