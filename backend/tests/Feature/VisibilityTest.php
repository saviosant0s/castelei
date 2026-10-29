<?php

namespace Tests\Feature;

use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/**
 * Matéria privada: só quem administra o conteúdo vê.
 *
 * Para todo o resto ela não existe — nem na lista, nem na busca, nem na
 * vitrine, e quem souber o endereço recebe 404.
 */
class VisibilityTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private function privada(): \App\Models\Lesson
    {
        $lesson = $this->makeLesson(2);
        $lesson->subject->update(['visibility' => Subject::PRIVATE, 'name' => 'Matéria escondida']);

        return $lesson;
    }

    public function test_quem_nao_administra_nao_ve_a_materia_privada(): void
    {
        $privada = $this->privada();
        $publica = $this->makeLesson(2);
        Sanctum::actingAs(User::factory()->create());

        $ids = array_column($this->getJson('/api/subjects')->assertOk()->json('subjects'), 'id');
        $this->assertSame([$publica->subject_id], $ids);

        $this->getJson("/api/lessons/{$privada->id}")->assertNotFound();
        $this->postJson("/api/lessons/{$privada->id}/attempts")->assertNotFound();
        $this->getJson("/api/lessons/{$privada->id}/note")->assertNotFound();
        $this->getJson("/api/subjects/{$privada->subject_id}/vocabulario")->assertNotFound();
        $this->postJson("/api/subjects/{$privada->subject_id}/exams")->assertNotFound();
        $this->getJson('/api/search?q=Lição')->assertOk()->assertJsonCount(1, 'lessons');
    }

    public function test_as_estatisticas_nao_apontam_para_materia_que_virou_privada(): void
    {
        $lesson = $this->makeLesson(2);
        Sanctum::actingAs(User::factory()->create());
        $inicio = $this->postJson("/api/lessons/{$lesson->id}/attempts")->json();
        foreach ($inicio['questions'] as $q) {
            $this->postJson("/api/attempts/{$inicio['attempt']['id']}/answers", ['question_id' => $q['id'], 'selected' => 0, 'seconds' => 3]);
        }
        $this->postJson("/api/attempts/{$inicio['attempt']['id']}/finish")->assertOk();
        $this->getJson('/api/progress/stats')->assertJsonCount(1, 'subjects');

        $lesson->subject->update(['visibility' => Subject::PRIVATE]);

        $this->getJson('/api/progress/stats')
            ->assertJsonPath('subjects', [])
            ->assertJsonPath('weak_lessons', []);
    }

    public function test_quem_administra_ve_e_estuda_a_materia_privada(): void
    {
        $privada = $this->privada();
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));

        $this->getJson('/api/subjects')
            ->assertOk()
            ->assertJsonPath('subjects.0.id', $privada->subject_id)
            ->assertJsonPath('subjects.0.private', true);
        $this->getJson("/api/lessons/{$privada->id}")->assertOk();
        $this->postJson("/api/lessons/{$privada->id}/attempts")->assertCreated();
    }

    public function test_a_vitrine_publica_nunca_anuncia_a_privada(): void
    {
        $this->privada();
        $publica = $this->makeLesson(2);

        $this->getJson('/api/catalog')
            ->assertOk()
            ->assertJsonCount(1, 'subjects')
            ->assertJsonPath('subjects.0.slug', $publica->subject->slug)
            ->assertJsonPath('totals.lessons', 1);
    }

    public function test_a_trilha_privada_so_aparece_para_quem_administra(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $slugs = array_column($this->getJson('/api/subjects')->json('trails'), 'slug');
        $this->assertNotContains('llms-do-zero', $slugs);
        $this->assertContains('base-para-provas', $slugs);

        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
        $trilhas = collect($this->getJson('/api/subjects')->json('trails'))->keyBy('slug');
        $this->assertTrue($trilhas['llms-do-zero']['private']);
        $this->assertFalse($trilhas['base-para-provas']['private']);
    }

    public function test_o_arquivo_diz_a_visibilidade_e_ela_volta_na_exportacao(): void
    {
        $dados = json_decode(file_get_contents(database_path('seeders/content/03-sistemas-operacionais.json')), true);
        $this->assertSame('private', $dados['visibility']);

        app(\App\Support\Content\ContentImporter::class)->import($dados, 'seed');
        $subject = Subject::where('slug', 'sistemas-operacionais')->first();
        $this->assertSame(Subject::PRIVATE, $subject->visibility);

        $exportado = app(\App\Support\Content\SubjectExporter::class)->export($subject);
        $this->assertSame('private', $exportado['visibility']);
    }

    public function test_visibilidade_desconhecida_e_erro(): void
    {
        $resultado = app(\App\Support\Content\ContentValidator::class)->validate([
            'slug' => 'x', 'name' => 'X', 'visibility' => 'secreta',
            'lessons' => [],
        ]);

        $this->assertContains('visibility', array_column($resultado['errors'], 'path'));
    }
}
