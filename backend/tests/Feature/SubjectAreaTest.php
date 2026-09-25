<?php

namespace Tests\Feature;

use App\Models\Subject;
use App\Models\User;
use App\Support\Content\SubjectExporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesContent;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/*
| Área do conhecimento: a porta de entrada da tela inicial. Sistemas
| Operacionais é uma disciplina de Informática, e Produção Textual, de
| Português.
*/
class SubjectAreaTest extends TestCase
{
    use MakesContent;
    use MakesLessons;
    use RefreshDatabase;

    public function test_catalogo_manda_todas_as_areas_e_a_area_de_cada_materia(): void
    {
        $lesson = $this->makeLesson(8);
        $lesson->subject->update(['area' => 'informatica']);
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/subjects')->assertOk()
            ->assertJsonPath('subjects.0.area', 'informatica')
            ->assertJsonPath('areas.0.slug', 'portugues')
            ->assertJsonPath('areas.0.name', 'Português');

        // As áreas sem matéria vêm também: a tela mostra essas como "Em breve".
        $this->assertContains('biologia', array_column($response->json('areas'), 'slug'));
    }

    public function test_importa_e_exporta_a_area(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $payload = $this->contentPayload() + ['area' => 'fisica'];

        $this->post('/api/admin/import', ['file' => $this->contentFile($payload)])->assertOk();

        $subject = Subject::where('slug', 'materia-nova')->first();
        $this->assertSame('fisica', $subject->area);
        $this->assertSame('fisica', app(SubjectExporter::class)->export($subject)['area']);
    }

    public function test_area_desconhecida_e_erro_na_importacao(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $payload = $this->contentPayload() + ['area' => 'informática'];

        $this->post('/api/admin/import', ['file' => $this->contentFile($payload)])
            ->assertStatus(422)
            ->assertJsonPath('content_errors.0.path', 'area');

        $this->assertDatabaseMissing('subjects', ['slug' => 'materia-nova']);
    }

    public function test_painel_troca_a_area_e_recusa_a_que_nao_existe(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $subject = Subject::create(['slug' => 'quimica-geral', 'name' => 'Química Geral', 'position' => 1, 'origin' => 'painel']);

        $this->putJson("/api/admin/subjects/{$subject->id}", ['name' => 'Química Geral', 'area' => 'quimica'])
            ->assertOk()
            ->assertJsonPath('subject.area', 'quimica');

        $this->putJson("/api/admin/subjects/{$subject->id}", ['name' => 'Química Geral', 'area' => 'alquimia'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('area');

        $this->getJson('/api/admin/subjects')->assertJsonPath('areas.13.slug', 'informatica');
    }

    public function test_toda_materia_do_repositorio_tem_area(): void
    {
        $areas = array_keys(config('castelei.areas'));

        foreach (glob(database_path('seeders/content/*.json')) as $arquivo) {
            $dados = json_decode(file_get_contents($arquivo), true);
            $this->assertContains($dados['area'] ?? null, $areas, basename($arquivo).' sem área válida.');
        }
    }
}
