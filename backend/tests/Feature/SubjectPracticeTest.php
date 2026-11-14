<?php

namespace Tests\Feature;

use App\Models\Attempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/** A aba Questões: uma rodada sorteada da matéria inteira, não da lição. */
class SubjectPracticeTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    /** Duas lições com 8 de base e 2 em cada nível. */
    private function materia(): \App\Models\Subject
    {
        $a = $this->makeLesson(14);
        $b = $this->makeLesson(14, 2, $a->subject);
        foreach ([$a, $b] as $lesson) {
            $lesson->questions()->where('position', '>', 8)->get()
                ->each(fn ($q) => $q->update(['difficulty' => ['facil', 'media', 'dificil'][intdiv($q->position - 9, 2)]]));
        }

        return $a->subject;
    }

    public function test_a_rodada_mistura_as_licoes_e_so_traz_a_base(): void
    {
        config(['castelei.unlock_all' => false]);
        $subject = $this->materia();
        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));

        $r = $this->postJson("/api/subjects/{$subject->id}/practice")->assertCreated()
            ->assertJsonCount(10, 'questions')
            ->assertJsonPath('attempt.kind', Attempt::KIND_PRACTICE);
        $this->assertSame([], array_filter(array_column($r->json('questions'), 'difficulty')));

        $ids = array_column($r->json('questions'), 'id');
        $licoes = \App\Models\Question::whereIn('id', $ids)->distinct()->pluck('lesson_id');
        $this->assertCount(2, $licoes);
    }

    public function test_o_nivel_e_do_pro(): void
    {
        config(['castelei.unlock_all' => false]);
        $subject = $this->materia();

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $this->postJson("/api/subjects/{$subject->id}/practice", ['level' => 'dificil'])->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $r = $this->postJson("/api/subjects/{$subject->id}/practice", ['level' => 'dificil'])->assertCreated()
            ->assertJsonCount(4, 'questions');
        $this->assertSame(['dificil'], array_values(array_unique(array_column($r->json('questions'), 'difficulty'))));
        $this->postJson("/api/subjects/{$subject->id}/practice", ['level' => 'impossivel'])->assertUnprocessable();
    }

    public function test_as_nunca_respondidas_vem_primeiro(): void
    {
        $subject = $this->materia();
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));

        $primeira = $this->postJson("/api/subjects/{$subject->id}/practice")->json();
        foreach ($primeira['questions'] as $q) {
            $this->postJson("/api/attempts/{$primeira['attempt']['id']}/answers", ['question_id' => $q['id'], 'selected' => 0, 'seconds' => 3]);
        }
        $fim = $this->postJson("/api/attempts/{$primeira['attempt']['id']}/finish")->assertOk();
        $fim->assertJsonPath('kind', Attempt::KIND_PRACTICE)->assertJsonPath('next_lesson', null);

        // Restam 6 das 16 de base: elas vêm antes de qualquer repetida.
        $segunda = array_column($this->postJson("/api/subjects/{$subject->id}/practice")->json('questions'), 'id');
        $novas = array_diff($segunda, array_column($primeira['questions'], 'id'));
        $this->assertSame(array_slice($segunda, 0, 6), array_values($novas));
    }

    public function test_materia_que_a_pessoa_nao_ve_da_404(): void
    {
        $subject = $this->materia();
        $subject->update(['visibility' => \App\Models\Subject::PRIVATE]);
        config(['castelei.unlock_all' => false]);
        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));

        $this->postJson("/api/subjects/{$subject->id}/practice")->assertNotFound();
    }
}
