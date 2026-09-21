<?php

namespace Tests\Feature;

use App\Support\Content\ContentValidator;
use Tests\TestCase;

/**
 * O aviso de "lição só de texto corrido".
 *
 * Existe porque aconteceu: um curso inteiro escrito pelo painel saiu sem uma
 * figura, uma tabela ou um exemplo em nenhuma lição.
 */
class ProseWarningTest extends TestCase
{
    /** @param list<array<string, mixed>> $steps */
    private function avisos(array $steps): array
    {
        $resultado = app(ContentValidator::class)->validate([
            'slug' => 'materia',
            'name' => 'Matéria',
            'lessons' => [[
                'slug' => 'licao',
                'title' => 'Lição',
                'summary' => 'Um resumo da lição para quem chega agora.',
                'steps' => $steps,
                'questions' => [[
                    'topic' => 'Tópico',
                    'statement' => 'Enunciado?',
                    'options' => ['A', 'B', 'C', 'D', 'E'],
                    'correct_index' => 0,
                    'explanation' => 'Porque sim.',
                ]],
            ]],
        ]);

        return array_column($resultado['warnings'], 'message');
    }

    /** @return list<array<string, mixed>> */
    private function paragrafos(int $quantas): array
    {
        $steps = [['kind' => 'idea', 'title' => 'Ideia', 'body' => ['Uma analogia.']]];

        for ($i = 2; $i < $quantas; $i++) {
            $steps[] = ['kind' => 'explain', 'title' => "Parte {$i}", 'body' => ['Mais um parágrafo.']];
        }

        $steps[] = ['kind' => 'recap', 'title' => 'Resumo', 'body' => ['Resumindo.']];

        return $steps;
    }

    public function test_licao_so_de_paragrafo_recebe_aviso(): void
    {
        $avisos = $this->avisos($this->paragrafos(8));

        $this->assertNotEmpty(array_filter($avisos, fn ($a) => str_contains($a, 'só texto corrido')));
    }

    public function test_o_aviso_diz_quantas_etapas_sao(): void
    {
        $avisos = $this->avisos($this->paragrafos(8));

        $this->assertNotEmpty(array_filter($avisos, fn ($a) => str_contains($a, 'das 8 etapas')));
    }

    /** Um bloco visual em cada terço já basta: o aviso não persegue quem fez o certo. */
    public function test_licao_com_apoio_suficiente_nao_recebe_aviso(): void
    {
        $steps = $this->paragrafos(9);
        $steps[1]['figure'] = ['src' => '/figuras/a.svg', 'alt' => 'Um diagrama explicando a ideia', 'caption' => 'Assim.'];
        $steps[3]['table'] = ['headers' => ['A', 'B'], 'rows' => [['1', '2']]];
        $steps[5]['example'] = ['label' => 'Exemplo', 'lines' => ['Um passo.']];

        $avisos = $this->avisos($steps);

        $this->assertEmpty(array_filter($avisos, fn ($a) => str_contains($a, 'texto corrido')));
    }

    /** Uma figura só numa lição de nove etapas ainda é um paredão. */
    public function test_apoio_de_menos_ainda_avisa(): void
    {
        $steps = $this->paragrafos(9);
        $steps[1]['figure'] = ['src' => '/figuras/a.svg', 'alt' => 'Um diagrama explicando a ideia', 'caption' => 'Assim.'];

        $avisos = $this->avisos($steps);

        $this->assertNotEmpty(array_filter($avisos, fn ($a) => str_contains($a, 'ainda lê como texto corrido')));
    }

    /** Lista e glossário também quebram o paredão, mesmo sem ser imagem. */
    public function test_lista_e_glossario_contam_como_apoio(): void
    {
        $steps = $this->paragrafos(7);
        $steps[1]['bullets'] = ['Um item', 'Outro item'];
        $steps[3]['terms'] = [['word' => 'daemon', 'meaning' => 'programa em segundo plano']];
        $steps[5]['code'] = ['text' => 'systemctl status'];

        $avisos = $this->avisos($steps);

        $this->assertEmpty(array_filter($avisos, fn ($a) => str_contains($a, 'texto corrido')));
    }

    /** É aviso, nunca erro: forma não reprova conteúdo. */
    public function test_texto_corrido_nao_impede_a_publicacao(): void
    {
        $resultado = app(ContentValidator::class)->validate([
            'slug' => 'materia',
            'name' => 'Matéria',
            'lessons' => [[
                'slug' => 'licao',
                'title' => 'Lição',
                'summary' => 'Um resumo da lição para quem chega agora.',
                'steps' => $this->paragrafos(8),
                'questions' => [[
                    'topic' => 'Tópico',
                    'statement' => 'Enunciado?',
                    'options' => ['A', 'B', 'C', 'D', 'E'],
                    'correct_index' => 0,
                    'explanation' => 'Porque sim.',
                ]],
            ]],
        ]);

        $this->assertSame([], $resultado['errors']);
    }
}
