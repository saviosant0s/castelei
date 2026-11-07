<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Content\ContentImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Os grupos de cada área, na ordem de estudo (config/castelei.php → area_groups).
 */
class AreaGroupsTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{area: ?string, visibility: string}> slug => dados do arquivo */
    private function arquivos(): array
    {
        $saida = [];
        foreach (glob(database_path('seeders/content/*.json')) as $arquivo) {
            $dados = json_decode(file_get_contents($arquivo), true);
            $saida[$dados['slug']] = ['area' => $dados['area'] ?? null, 'visibility' => $dados['visibility'] ?? 'public'];
        }

        return $saida;
    }

    public function test_todo_item_existe_mora_na_propria_area_e_aparece_uma_vez_so(): void
    {
        $arquivos = $this->arquivos();
        $vistos = [];

        foreach (config('castelei.area_groups') as $area => $grupos) {
            $this->assertArrayHasKey($area, config('castelei.areas'), "Área desconhecida em area_groups: $area");
            foreach ($grupos as $grupo) {
                $this->assertNotSame('', trim($grupo['name']));
                foreach ($grupo['items'] as $item) {
                    if (is_array($item)) {
                        $this->assertNotSame('', trim($item['soon']), "Item em breve sem nome em $area");

                        continue;
                    }
                    $this->assertArrayHasKey($item, $arquivos, "Matéria em area_groups sem arquivo: $item");
                    $this->assertSame($area, $arquivos[$item]['area'], "$item está no grupo de $area, mas o arquivo diz {$arquivos[$item]['area']}");
                    $this->assertNotContains($item, $vistos, "$item aparece em dois grupos");
                    $vistos[] = $item;
                }
            }
        }
    }

    /** Matéria pública nova precisa de lugar na ordem: senão cai em "Mais matérias" sem ninguém decidir. */
    public function test_toda_materia_publica_tem_grupo(): void
    {
        $nosGrupos = collect(config('castelei.area_groups'))->flatten()->filter(fn ($v) => is_string($v))->all();

        foreach ($this->arquivos() as $slug => $dados) {
            if ($dados['visibility'] === 'public' && $dados['area'] !== null) {
                $this->assertContains($slug, $nosGrupos, "A matéria pública $slug não está em nenhum grupo de area_groups");
            }
        }
    }

    private function importar(string $slug, string $visibility = 'public'): void
    {
        app(ContentImporter::class)->import([
            'slug' => $slug, 'name' => "Matéria $slug", 'area' => 'informatica', 'visibility' => $visibility,
            'lessons' => [[
                'slug' => 'licao-1', 'title' => 'Lição 1', 'summary' => 'Resumo da lição para o aluno saber do que se trata.',
                'steps' => [
                    ['kind' => 'idea', 'title' => 'Ideia', 'body' => ['Uma analogia do dia a dia.']],
                    ['kind' => 'recap', 'title' => 'Resumo', 'body' => ['Resumindo o que foi visto.']],
                ],
                'questions' => [['topic' => 'A', 'statement' => 'Primeira?', 'options' => ['A', 'B', 'C', 'D', 'E'], 'correct_index' => 0, 'explanation' => 'Porque sim.']],
            ]],
        ], origin: 'seed');
    }

    /** @return list<array<string, mixed>> */
    private function gruposDeInformatica(): array
    {
        return collect($this->getJson('/api/subjects')->assertOk()->json('areas'))->firstWhere('slug', 'informatica')['groups'];
    }

    public function test_a_privada_nao_chega_a_quem_nao_administra_e_o_em_breve_chega_a_todos(): void
    {
        config(['castelei.area_groups.informatica' => [
            ['name' => 'Usar o computador', 'items' => ['informatica-basica', ['soon' => 'Planilhas a fundo']]],
            ['name' => 'Hardware', 'items' => ['montar-pc']],
            ['name' => 'Inteligência artificial', 'items' => [['soon' => 'IA no dia a dia'], 'redes-neurais']],
        ]]);
        $this->importar('informatica-basica');
        $this->importar('montar-pc', 'private');
        $this->importar('redes-neurais', 'private');

        Sanctum::actingAs(User::factory()->create());
        $grupos = $this->gruposDeInformatica();
        $this->assertSame([
            ['name' => 'Usar o computador', 'items' => [['subject' => 'informatica-basica'], ['soon' => 'Planilhas a fundo']]],
            // O grupo só com a privada some; o que tem "em breve" fica.
            ['name' => 'Inteligência artificial', 'items' => [['soon' => 'IA no dia a dia']]],
        ], $grupos);
        $this->assertStringNotContainsString('montar-pc', $this->getJson('/api/subjects')->getContent());

        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $this->assertSame(['Usar o computador', 'Hardware', 'Inteligência artificial'], array_column($this->gruposDeInformatica(), 'name'));
    }

    public function test_a_materia_fora_dos_grupos_vai_para_o_fim(): void
    {
        config(['castelei.area_groups.informatica' => [
            ['name' => 'Usar o computador', 'items' => ['informatica-basica']],
        ]]);
        $this->importar('informatica-basica');
        $this->importar('criada-no-painel');

        Sanctum::actingAs(User::factory()->create());
        $this->assertSame(
            ['name' => 'Mais matérias', 'items' => [['subject' => 'criada-no-painel']]],
            $this->gruposDeInformatica()[1],
        );
    }
}
