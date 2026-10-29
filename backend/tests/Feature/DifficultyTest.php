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

    /** Com questões de base, a prática comum é só delas; as com nível ficam em "Praticar por nível". */
    public function test_a_pratica_comum_e_so_da_base(): void
    {
        $lesson = $this->makeLesson(11);
        $lesson->questions()->where('position', '>', 8)->get()
            ->each(fn ($q) => $q->update(['difficulty' => ['facil', 'media', 'dificil'][$q->position - 9]]));

        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));

        $pratica = $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated();
        $this->assertCount(8, $pratica->json('questions'));
        $this->assertSame([], array_filter(array_column($pratica->json('questions'), 'difficulty')));

        $this->getJson("/api/lessons/{$lesson->id}")
            ->assertJsonPath('lesson.questions_total', 8)
            ->assertJsonPath('lesson.levels.media', 1);
        $this->postJson("/api/lessons/{$lesson->id}/attempts", ['level' => 'media'])->assertJsonCount(1, 'questions');
    }
}
