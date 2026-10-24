<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class DifficultyTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    public function test_o_pro_pratica_por_nivel_e_o_gratis_nao(): void
    {
        config(['castelei.unlock_all' => false, 'castelei.exam_for_all' => false]);
        $lesson = $this->makeLesson(10);
        $lesson->questions()->orderBy('position')->get()->each(function ($q, $i) {
            $q->update(['difficulty' => $i >= 8 ? 'dificil' : ($i % 2 ? 'media' : 'facil')]);
        });

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $this->getJson("/api/lessons/{$lesson->id}")
            ->assertJsonPath('lesson.can_use_levels', false)
            ->assertJsonPath('lesson.levels.dificil', 2);
        // O grátis recebe as oito primeiras, com a etiqueta de nível.
        $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated()
            ->assertJsonCount(8, 'questions')
            ->assertJsonPath('questions.0.difficulty', 'facil');
        $this->postJson("/api/lessons/{$lesson->id}/attempts", ['level' => 'dificil'])->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $this->postJson("/api/lessons/{$lesson->id}/attempts", ['level' => 'dificil'])->assertCreated()
            ->assertJsonCount(2, 'questions')
            ->assertJsonPath('limited_by_plan', false);
        $this->postJson("/api/lessons/{$lesson->id}/attempts", ['level' => 'impossivel'])->assertUnprocessable();
    }
}
