<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\Subject;
use App\Models\User;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesContent;
use Tests\TestCase;

class ContentImportTest extends TestCase
{
    use MakesContent;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
    }

    public function test_importa_materia_nova_e_conta_o_que_entrou(): void
    {
        $response = $this->post('/api/admin/import', ['file' => $this->contentFile($this->contentPayload())]);

        $response->assertOk()
            ->assertJsonPath('report.subject.created', true)
            ->assertJsonPath('report.subject.slug', 'materia-nova')
            ->assertJsonPath('report.lessons_created', 1)
            ->assertJsonPath('report.lessons_updated', 0)
            ->assertJsonPath('report.questions_created', 8)
            ->assertJsonPath('report.questions_updated', 0);

        $this->assertSame('painel', Subject::where('slug', 'materia-nova')->first()->origin);
        $this->assertSame(8, Question::count());
    }

    public function test_reimportar_o_mesmo_arquivo_nao_duplica_nada(): void
    {
        $payload = $this->contentPayload();

        $this->post('/api/admin/import', ['file' => $this->contentFile($payload)])->assertOk();
        $response = $this->post('/api/admin/import', ['file' => $this->contentFile($payload)]);

        $response->assertOk()
            ->assertJsonPath('report.subject.created', false)
            ->assertJsonPath('report.lessons_created', 0)
            ->assertJsonPath('report.lessons_updated', 1)
            ->assertJsonPath('report.questions_created', 0)
            ->assertJsonPath('report.questions_updated', 8);

        $this->assertSame(1, Subject::count());
        $this->assertSame(1, Lesson::count());
        $this->assertSame(8, Question::count());
    }

    public function test_arquivo_que_nao_e_json_explica_o_que_houve(): void
    {
        $file = UploadedFile::fake()->createWithContent('materia.json', "```json\n{\"slug\": \"x\"}\n```");

        $this->post('/api/admin/import', ['file' => $file])
            ->assertStatus(400)
            ->assertJsonStructure(['message', 'hint']);

        $this->assertSame(0, Subject::count());
    }

    public function test_erro_de_conteudo_aponta_o_caminho_e_nao_grava_nada(): void
    {
        $payload = $this->contentPayload();
        // Gabarito apontando para uma alternativa que não existe: o erro que
        // passa despercebido na leitura e quebra a prática na hora.
        $payload['lessons'][0]['questions'][2]['correct_index'] = 9;

        $response = $this->post('/api/admin/import', ['file' => $this->contentFile($payload)]);

        $response->assertStatus(422)
            ->assertJsonPath('content_errors.0.path', 'lessons[0].questions[2].correct_index');

        $this->assertStringContainsString('não existe', $response->json('content_errors.0.message'));
        $this->assertSame(0, Subject::count());
    }

    public function test_slug_de_licao_repetido_e_erro(): void
    {
        $payload = $this->contentPayload([
            'lessons' => [$this->lessonPayload(), $this->lessonPayload(['title' => 'Outra'])],
        ]);

        $this->post('/api/admin/import', ['file' => $this->contentFile($payload)])
            ->assertStatus(422)
            ->assertJsonPath('content_errors.0.path', 'lessons[1].slug');
    }

    public function test_figura_sem_descricao_util_e_erro(): void
    {
        $steps = $this->stepsPayload();
        $steps[1]['figure'] = ['src' => '/figuras/x.svg', 'alt' => 'gráfico'];

        $payload = $this->contentPayload(['lessons' => [$this->lessonPayload(['steps' => $steps])]]);

        $this->post('/api/admin/import', ['file' => $this->contentFile($payload)])
            ->assertStatus(422)
            ->assertJsonPath('content_errors.0.path', 'lessons[0].steps[1].figure.alt');
    }

    /** Fora da convenção passa, mas avisa: a régua editorial não é do importador. */
    public function test_fora_da_convencao_avisa_sem_bloquear(): void
    {
        $payload = $this->contentPayload([
            'lessons' => [$this->lessonPayload([
                'steps' => [['kind' => 'explain', 'title' => 'Só isso', 'body' => ['Um parágrafo.']]],
                'questions' => $this->questionsPayload(3),
            ])],
        ]);

        $response = $this->post('/api/admin/import', ['file' => $this->contentFile($payload)]);

        $response->assertOk()->assertJsonPath('report.lessons_created', 1);
        $this->assertNotEmpty($response->json('report.warnings'));
    }

    public function test_conferir_antes_de_publicar_nao_grava(): void
    {
        $this->post('/api/admin/import', [
            'file' => $this->contentFile($this->contentPayload()),
            'dry_run' => '1',
        ])->assertOk()->assertJsonPath('dry_run', true);

        $this->assertSame(0, Subject::count());
    }

    public function test_questao_que_sobrou_e_apontada_e_so_sai_se_pedirem(): void
    {
        $this->post('/api/admin/import', ['file' => $this->contentFile($this->contentPayload())])->assertOk();

        $menor = $this->contentPayload([
            'lessons' => [$this->lessonPayload(['questions' => $this->questionsPayload(5)])],
        ]);

        $this->post('/api/admin/import', ['file' => $this->contentFile($menor)])
            ->assertOk()
            ->assertJsonPath('report.questions_removed', 0)
            ->assertJsonPath('report.orphan_questions.0.count', 3);

        $this->assertSame(8, Question::count());

        $this->post('/api/admin/import', ['file' => $this->contentFile($menor), 'prune' => '1'])
            ->assertOk()
            ->assertJsonPath('report.questions_removed', 3);

        $this->assertSame(5, Question::count());
    }

    public function test_licao_que_sumiu_do_arquivo_e_apontada_e_nao_some_sozinha(): void
    {
        $duas = $this->contentPayload([
            'lessons' => [$this->lessonPayload(), $this->lessonPayload(['slug' => 'licao-dois', 'title' => 'Lição dois'])],
        ]);

        $this->post('/api/admin/import', ['file' => $this->contentFile($duas)])->assertOk();

        $this->post('/api/admin/import', ['file' => $this->contentFile($this->contentPayload())])
            ->assertOk()
            ->assertJsonPath('report.orphan_lessons.0.slug', 'licao-dois');

        $this->assertSame(2, Lesson::count());
    }

    /**
     * O bug que este painel podia ter criado.
     *
     * O ContentSeeder roda no pre-deploy do Railway, depois de toda edição.
     * Sem a marca de origem, ele recarregaria o arquivo do repositório por
     * cima do que foi editado no painel — e a edição sumiria sozinha no deploy
     * seguinte, sem erro nenhum para explicar.
     */
    public function test_o_seeder_nao_desfaz_o_que_o_painel_editou(): void
    {
        (new ContentSeeder)->run();

        $subject = Subject::where('slug', 'sistemas-operacionais')->firstOrFail();
        $lesson = $subject->lessons()->first();
        $this->assertSame('seed', $subject->origin);

        $this->putJson("/api/admin/lessons/{$lesson->id}", [
            'title' => 'Título editado no painel',
            'summary' => $lesson->summary,
            'steps' => $lesson->steps,
        ])->assertOk();

        $this->assertSame('painel', $subject->fresh()->origin);

        (new ContentSeeder)->run();

        $this->assertSame('Título editado no painel', $lesson->fresh()->title);
    }

    /** Antes de qualquer edição, o arquivo continua mandando — como sempre mandou. */
    public function test_o_seeder_continua_mandando_em_materia_nao_editada(): void
    {
        (new ContentSeeder)->run();

        $lesson = Subject::where('slug', 'sistemas-operacionais')->firstOrFail()->lessons()->first();
        $original = $lesson->title;

        $lesson->update(['title' => 'Mexido por fora do painel']);
        (new ContentSeeder)->run();

        $this->assertSame($original, $lesson->fresh()->title);
    }

    public function test_modelo_oferecido_pelo_painel_passa_na_propria_conferencia(): void
    {
        $modelo = $this->get('/api/admin/import/template')->assertOk()->streamedContent();

        $this->post('/api/admin/import', [
            'file' => UploadedFile::fake()->createWithContent('modelo-conteudo.json', $modelo),
        ])
            ->assertOk()
            ->assertJsonPath('report.lessons_created', 1)
            ->assertJsonPath('report.questions_created', 8)
            ->assertJsonPath('report.warnings', []);
    }
}
