<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    public function test_catalogo_exige_login(): void
    {
        $this->getJson('/api/subjects')->assertUnauthorized();
    }

    public function test_plano_gratis_ve_5_questoes_por_licao_e_plus_ve_todas(): void
    {
        $lesson = $this->makeLesson(8);

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $this->getJson('/api/subjects')
            ->assertOk()
            ->assertJsonPath('subjects.0.lessons.0.id', $lesson->id)
            ->assertJsonPath('subjects.0.lessons.0.questions_total', 8)
            ->assertJsonPath('subjects.0.lessons.0.questions_available', 5);

        Sanctum::actingAs(User::factory()->create(['plan' => 'plus']));
        $this->getJson('/api/subjects')
            ->assertJsonPath('subjects.0.lessons.0.questions_available', 8);
    }

    public function test_detalhe_da_licao_traz_as_tres_camadas_e_o_limite_do_plano(): void
    {
        $lesson = $this->makeLesson(8);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/lessons/{$lesson->id}")
            ->assertOk()
            ->assertJsonPath('lesson.summary', 'Resumo')
            ->assertJsonPath('lesson.explanation', 'Explicação')
            ->assertJsonPath('lesson.exam_style', 'Como cai na prova')
            ->assertJsonPath('lesson.pitfalls.0', 'Pegadinha 1')
            ->assertJsonPath('lesson.questions_available', 5)
            ->assertJsonPath('lesson.limited_by_plan', true);
    }

    public function test_licao_entrega_as_etapas_na_ordem(): void
    {
        $lesson = $this->makeLesson(8);
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson("/api/lessons/{$lesson->id}")->assertOk();

        $response->assertJsonCount(5, 'lesson.steps')
            ->assertJsonPath('lesson.steps.0.kind', 'idea')
            ->assertJsonPath('lesson.steps.1.example.lines.0', '1 + 1 = 2')
            ->assertJsonPath('lesson.steps.4.kind', 'recap');
    }

    public function test_licao_sem_etapas_ganha_etapas_montadas_dos_campos_antigos(): void
    {
        $lesson = $this->makeLesson(8);
        $lesson->update(['steps' => null]);
        Sanctum::actingAs(User::factory()->create());

        $kinds = array_column($this->getJson("/api/lessons/{$lesson->id}")->assertOk()->json('lesson.steps'), 'kind');

        $this->assertSame(['idea', 'explain', 'exam', 'pitfall'], $kinds);
    }

    public function test_licao_inexistente_devolve_404(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/lessons/9999')->assertNotFound();
    }
}
