<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Subject;
use App\Models\User;
use App\Support\Content\ContentImporter;
use App\Support\Content\ContentValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesContent;
use Tests\TestCase;

/**
 * O módulo da lição: o campo que transforma a lista da matéria em trilha.
 *
 * É opcional de propósito — matéria de duas lições não precisa de módulo —, e
 * guarda só o nome do assunto. O número ("Módulo 3") sai da ordem das lições
 * na hora de mostrar, então não há nada aqui sobre numeração.
 */
class LessonModuleTest extends TestCase
{
    use MakesContent;
    use RefreshDatabase;

    public function test_a_importacao_guarda_o_modulo_de_cada_licao(): void
    {
        $report = (new ContentImporter)->import($this->contentPayload([
            'lessons' => [
                $this->lessonPayload(['slug' => 'um', 'module' => 'Fundamentos']),
                $this->lessonPayload(['slug' => 'dois', 'module' => 'Fundamentos']),
                $this->lessonPayload(['slug' => 'tres', 'module' => 'Processos']),
            ],
        ]), origin: 'seed');

        $this->assertSame(3, $report->lessonsCreated);
        $this->assertSame(
            ['Fundamentos', 'Fundamentos', 'Processos'],
            Lesson::orderBy('position')->pluck('module')->all(),
        );
    }

    public function test_licao_sem_modulo_fica_com_nulo(): void
    {
        (new ContentImporter)->import($this->contentPayload(), origin: 'seed');

        $this->assertNull(Lesson::first()->module);
    }

    /**
     * Espaço em branco não é módulo. Se virasse "" no banco, a trilha abriria
     * um grupo sem nome no meio do caminho.
     */
    public function test_modulo_em_branco_vira_nulo(): void
    {
        (new ContentImporter)->import($this->contentPayload([
            'lessons' => [$this->lessonPayload(['module' => '   '])],
        ]), origin: 'seed');

        $this->assertNull(Lesson::first()->module);
    }

    public function test_o_validador_aceita_arquivo_sem_modulo(): void
    {
        $resultado = (new ContentValidator)->validate($this->contentPayload());

        $this->assertSame([], $resultado['errors']);
    }

    public function test_o_validador_recusa_modulo_que_nao_e_texto(): void
    {
        $resultado = (new ContentValidator)->validate($this->contentPayload([
            'lessons' => [$this->lessonPayload(['module' => ['Processos']])],
        ]));

        $this->assertSame('lessons[0].module', $resultado['errors'][0]['path']);
    }

    public function test_o_catalogo_do_app_entrega_o_modulo(): void
    {
        (new ContentImporter)->import($this->contentPayload([
            'lessons' => [$this->lessonPayload(['module' => 'Processos'])],
        ]), origin: 'seed');

        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/subjects')
            ->assertOk()
            ->assertJsonPath('subjects.0.lessons.0.module', 'Processos');
    }

    public function test_o_painel_edita_o_modulo_de_uma_licao(): void
    {
        (new ContentImporter)->import($this->contentPayload([
            'lessons' => [$this->lessonPayload(['module' => 'Fundamentos'])],
        ]), origin: 'seed');

        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $lesson = Lesson::first();

        $this->putJson("/api/admin/lessons/{$lesson->id}", [
            'title' => $lesson->title,
            'module' => 'Processos',
            'summary' => $lesson->summary,
            'steps' => $lesson->steps,
        ])->assertOk();

        $this->assertSame('Processos', $lesson->fresh()->module);
        // Editar pelo painel continua tomando a matéria do seeder.
        $this->assertSame('painel', Subject::first()->origin);
    }

    public function test_o_painel_tira_a_licao_do_modulo_com_campo_vazio(): void
    {
        (new ContentImporter)->import($this->contentPayload([
            'lessons' => [$this->lessonPayload(['module' => 'Fundamentos'])],
        ]), origin: 'seed');

        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $lesson = Lesson::first();

        $this->putJson("/api/admin/lessons/{$lesson->id}", [
            'title' => $lesson->title,
            'module' => '',
            'summary' => $lesson->summary,
            'steps' => $lesson->steps,
        ])->assertOk();

        $this->assertNull($lesson->fresh()->module);
    }

    public function test_o_conteudo_de_sistemas_operacionais_tem_modulo_em_toda_licao(): void
    {
        $arquivo = database_path('seeders/content/03-sistemas-operacionais.json');
        $data = json_decode((string) file_get_contents($arquivo), true);

        foreach ($data['lessons'] as $index => $lesson) {
            $this->assertNotEmpty(
                $lesson['module'] ?? null,
                "A lição {$index} de Sistemas Operacionais está sem módulo — ela apareceria solta na trilha.",
            );
        }
    }
}
