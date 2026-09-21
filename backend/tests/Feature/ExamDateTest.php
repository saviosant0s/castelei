<?php

namespace Tests\Feature;

use App\Models\Subject;
use App\Models\User;
use App\Support\Content\ContentImporter;
use App\Support\Content\ContentValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * A data da prova entrando pelos três caminhos: arquivo, painel e leitura.
 *
 * Ela não é enfeite de calendário — é o prazo de onde sai todo intervalo de
 * revisão. Data errada não dá erro em lugar nenhum: só manda o aluno revisar na
 * hora errada, em silêncio.
 */
class ExamDateTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function arquivo(array $extra = []): array
    {
        return array_merge([
            'slug' => 'materia-nova',
            'name' => 'Matéria nova',
            'lessons' => [[
                'slug' => 'licao-1',
                'title' => 'Lição 1',
                'summary' => 'Resumo da lição para o aluno saber do que se trata.',
                'steps' => [
                    ['kind' => 'idea', 'title' => 'Ideia', 'body' => ['Uma analogia do dia a dia.']],
                    ['kind' => 'recap', 'title' => 'Resumo', 'body' => ['Resumindo o que foi visto.']],
                ],
                'questions' => [[
                    'topic' => 'Tópico',
                    'statement' => 'Enunciado da questão?',
                    'options' => ['A', 'B', 'C', 'D', 'E'],
                    'correct_index' => 0,
                    'explanation' => 'Porque sim.',
                ]],
            ]],
        ], $extra);
    }

    public function test_o_importador_guarda_a_data_da_prova(): void
    {
        app(ContentImporter::class)->import($this->arquivo(['exam_date' => '2026-12-15']), origin: 'seed');

        $this->assertSame('2026-12-15', Subject::firstWhere('slug', 'materia-nova')->exam_date->format('Y-m-d'));
    }

    public function test_materia_sem_data_fica_nula(): void
    {
        app(ContentImporter::class)->import($this->arquivo(), origin: 'seed');

        $this->assertNull(Subject::firstWhere('slug', 'materia-nova')->exam_date);
    }

    public function test_data_vazia_vira_nulo(): void
    {
        app(ContentImporter::class)->import($this->arquivo(['exam_date' => '  ']), origin: 'seed');

        $this->assertNull(Subject::firstWhere('slug', 'materia-nova')->exam_date);
    }

    public function test_o_validador_aceita_a_data_no_formato_certo(): void
    {
        $resultado = app(ContentValidator::class)->validate($this->arquivo(['exam_date' => '2026-12-15']));

        $this->assertSame([], $resultado['errors']);
    }

    /** "15/12/2026" lido como mês 15 mandaria a matéria inteira para o calendário errado. */
    public function test_o_validador_recusa_data_fora_do_formato(): void
    {
        $resultado = app(ContentValidator::class)->validate($this->arquivo(['exam_date' => '15/12/2026']));

        $this->assertNotSame([], $resultado['errors']);
        $this->assertSame('exam_date', $resultado['errors'][0]['path']);
    }

    public function test_o_validador_recusa_data_que_nao_existe(): void
    {
        $resultado = app(ContentValidator::class)->validate($this->arquivo(['exam_date' => '2026-02-31']));

        $this->assertNotSame([], $resultado['errors']);
    }

    public function test_o_catalogo_entrega_a_data_para_o_app(): void
    {
        app(ContentImporter::class)->import($this->arquivo(['exam_date' => '2026-12-15']), origin: 'seed');
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/subjects')->assertOk()->assertJsonPath('subjects.0.exam_date', '2026-12-15');
    }

    public function test_o_painel_edita_a_data_da_prova(): void
    {
        app(ContentImporter::class)->import($this->arquivo(), origin: 'seed');
        $subject = Subject::firstWhere('slug', 'materia-nova');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));

        $this->putJson("/api/admin/subjects/{$subject->id}", [
            'name' => 'Matéria nova',
            'exam_date' => '2026-12-15',
        ])->assertOk()->assertJsonPath('subject.exam_date', '2026-12-15');

        $this->assertSame('2026-12-15', $subject->fresh()->exam_date->format('Y-m-d'));
    }

    public function test_o_painel_recusa_data_fora_do_formato(): void
    {
        app(ContentImporter::class)->import($this->arquivo(), origin: 'seed');
        $subject = Subject::firstWhere('slug', 'materia-nova');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));

        $this->putJson("/api/admin/subjects/{$subject->id}", [
            'name' => 'Matéria nova',
            'exam_date' => '15/12/2026',
        ])->assertStatus(422)->assertJsonValidationErrors('exam_date');
    }

    public function test_o_painel_limpa_a_data_da_prova(): void
    {
        app(ContentImporter::class)->import($this->arquivo(['exam_date' => '2026-12-15']), origin: 'seed');
        $subject = Subject::firstWhere('slug', 'materia-nova');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));

        $this->putJson("/api/admin/subjects/{$subject->id}", [
            'name' => 'Matéria nova',
            'exam_date' => null,
        ])->assertOk();

        $this->assertNull($subject->fresh()->exam_date);
    }

    /** A matéria do semestre tem prova em 15/12, e é o plano de aula que manda. */
    public function test_sistemas_operacionais_tem_a_data_da_prova(): void
    {
        $arquivo = json_decode(
            file_get_contents(database_path('seeders/content/03-sistemas-operacionais.json')),
            associative: true,
        );

        $this->assertSame('2026-12-15', $arquivo['exam_date']);
    }
}
