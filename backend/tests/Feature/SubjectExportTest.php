<?php

namespace Tests\Feature;

use App\Models\Subject;
use App\Models\User;
use App\Support\Content\ContentImporter;
use App\Support\Content\ContentValidator;
use App\Support\Content\SubjectExporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubjectExportTest extends TestCase
{
    use RefreshDatabase;

    /** Uma matéria com TODOS os blocos visuais, para o teste de ida e volta valer. */
    private function arquivo(): array
    {
        return [
            'slug' => 'servidores',
            'name' => 'Servidores',
            'description' => 'Como um servidor funciona por dentro.',
            'exam_date' => '2026-12-15',
            'lessons' => [[
                'slug' => 'o-que-e-um-servidor',
                'title' => 'O que é um servidor',
                'module' => 'Fundamentos',
                'summary' => 'Um computador que fica ligado esperando pedidos dos outros.',
                'steps' => [
                    ['kind' => 'idea', 'title' => 'A ideia', 'body' => ['Pense num restaurante.'],
                     'figure' => ['src' => '/figuras/servidor.svg', 'alt' => 'Um computador recebendo três pedidos', 'caption' => 'O servidor atende vários de uma vez.']],
                    ['kind' => 'explain', 'title' => 'Na prática', 'body' => ['Assim funciona.'],
                     'table' => ['label' => 'Comparação', 'headers' => ['Onde', 'Comando'], 'rows' => [['Linux', 'systemctl status']], 'mono' => true],
                     'code' => ['label' => 'No terminal', 'text' => 'systemctl status nginx'],
                     'bullets' => ['Fica ligado', 'Responde pedidos'],
                     'terms' => [['word' => 'daemon', 'meaning' => 'programa que roda em segundo plano']],
                     'example' => ['label' => 'Exemplo', 'lines' => ['Pedido chega', 'Resposta sai']]],
                    ['kind' => 'recap', 'title' => 'Resumo', 'body' => ['Resumindo tudo.']],
                ],
                'questions' => [
                    [
                        'topic' => 'Conceito',
                        'statement' => 'O que caracteriza um servidor?',
                        'options' => ['A', 'B', 'C', 'D', 'E'],
                        // Gabarito 0: é o caso que um array_filter ingênuo apagaria.
                        'correct_index' => 0,
                        'explanation' => 'Porque ele atende pedidos.',
                        'pitfall' => 'Não é sobre o hardware.',
                    ],
                    [
                        'topic' => 'Conceito',
                        'statement' => 'E quanto ao hardware?',
                        'options' => ['A', 'B', 'C', 'D', 'E'],
                        'correct_index' => 3,
                        'explanation' => 'Qualquer máquina serve.',
                    ],
                ],
            ]],
        ];
    }

    /**
     * O teste que sustenta a função: exportar e reimportar devolve a mesma
     * matéria. Sem isto, o arquivo baixado seria só um retrato aproximado.
     */
    public function test_exportar_e_reimportar_nao_perde_nada(): void
    {
        app(ContentImporter::class)->import($this->arquivo(), origin: 'seed');
        $antes = app(SubjectExporter::class)->export(Subject::firstWhere('slug', 'servidores'));

        app(ContentImporter::class)->import($antes, origin: 'seed');
        $depois = app(SubjectExporter::class)->export(Subject::firstWhere('slug', 'servidores'));

        $this->assertSame($antes, $depois);
    }

    /** O arquivo exportado precisa passar na conferência do próprio painel. */
    public function test_o_arquivo_exportado_passa_no_validador(): void
    {
        app(ContentImporter::class)->import($this->arquivo(), origin: 'seed');

        $resultado = app(ContentValidator::class)
            ->validate(app(SubjectExporter::class)->export(Subject::firstWhere('slug', 'servidores')));

        $this->assertSame([], $resultado['errors']);
    }

    /** A alternativa A é o índice 0, e um filtro ingênuo apagaria o campo. */
    public function test_o_gabarito_zero_nao_some(): void
    {
        app(ContentImporter::class)->import($this->arquivo(), origin: 'seed');

        $exportado = app(SubjectExporter::class)->export(Subject::firstWhere('slug', 'servidores'));

        $this->assertSame(0, $exportado['lessons'][0]['questions'][0]['correct_index']);
    }

    /** Blocos visuais são justamente o que não pode se perder no caminho. */
    public function test_os_blocos_visuais_sobrevivem(): void
    {
        app(ContentImporter::class)->import($this->arquivo(), origin: 'seed');

        $etapas = app(SubjectExporter::class)->export(Subject::firstWhere('slug', 'servidores'))['lessons'][0]['steps'];

        $this->assertSame('/figuras/servidor.svg', $etapas[0]['figure']['src']);
        $this->assertSame(['Linux', 'systemctl status'], $etapas[1]['table']['rows'][0]);
        $this->assertSame('systemctl status nginx', $etapas[1]['code']['text']);
        $this->assertSame('daemon', $etapas[1]['terms'][0]['word']);
    }

    /** Campo vazio sai do arquivo em vez de virar `null`: quem edita à mão agradece. */
    public function test_campo_vazio_e_omitido(): void
    {
        app(ContentImporter::class)->import($this->arquivo(), origin: 'seed');

        $exportado = app(SubjectExporter::class)->export(Subject::firstWhere('slug', 'servidores'));

        $this->assertArrayNotHasKey('pitfall', $exportado['lessons'][0]['questions'][1]);
    }

    public function test_a_rota_baixa_o_arquivo(): void
    {
        app(ContentImporter::class)->import($this->arquivo(), origin: 'seed');
        $subject = Subject::firstWhere('slug', 'servidores');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));

        $this->get("/api/admin/subjects/{$subject->id}/export")
            ->assertOk()
            ->assertHeader('Content-Disposition', 'attachment; filename="servidores.json"')
            ->assertJsonPath('slug', 'servidores')
            ->assertJsonPath('exam_date', '2026-12-15');
    }

    public function test_so_quem_administra_exporta(): void
    {
        app(ContentImporter::class)->import($this->arquivo(), origin: 'seed');
        $subject = Subject::firstWhere('slug', 'servidores');

        $this->getJson("/api/admin/subjects/{$subject->id}/export")->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/admin/subjects/{$subject->id}/export")->assertForbidden();
    }
}
