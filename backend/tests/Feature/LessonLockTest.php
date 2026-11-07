<?php

namespace Tests\Feature;

use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\Subject;
use App\Models\User;
use App\Support\Content\ContentImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * A trava entre as lições de uma matéria.
 *
 * Dentro da matéria, a lição seguinte só abre depois de ver a anterior (ler
 * até o fim ou praticar). Pro e quem administra pulam. O que a pessoa já fez
 * nunca tranca.
 */
class LessonLockTest extends TestCase
{
    use RefreshDatabase;

    /** @return list<Lesson> */
    private function materia(): array
    {
        $licao = fn (int $n) => [
            'slug' => "licao-$n",
            'title' => "Lição $n",
            'summary' => 'Resumo da lição para o aluno saber do que se trata.',
            'steps' => [
                ['kind' => 'idea', 'title' => 'Ideia', 'body' => ['Uma analogia do dia a dia.']],
                ['kind' => 'recap', 'title' => 'Resumo', 'body' => ['Resumindo o que foi visto.']],
            ],
            'questions' => [
                ['topic' => 'A', 'statement' => 'Primeira?', 'options' => ['A', 'B', 'C', 'D', 'E'], 'correct_index' => 0, 'explanation' => 'Porque sim.'],
            ],
        ];
        app(ContentImporter::class)->import([
            'slug' => 'materia', 'name' => 'Matéria', 'lessons' => [$licao(1), $licao(2), $licao(3)],
        ], origin: 'seed');

        return Subject::firstWhere('slug', 'materia')->lessons()->get()->all();
    }

    private function praticar(User $user, Lesson $lesson): void
    {
        Attempt::create([
            'user_id' => $user->id, 'lesson_id' => $lesson->id, 'kind' => Attempt::KIND_LESSON,
            'started_at' => now()->subMinutes(5), 'finished_at' => now(), 'total_questions' => 1, 'correct_count' => 1,
        ]);
    }

    /** @return array<string, bool> título => trancada */
    private function travas(): array
    {
        $materia = collect($this->getJson('/api/subjects')->assertOk()->json('subjects'))->firstWhere('slug', 'materia');

        return collect($materia['lessons'])->mapWithKeys(fn ($l) => [$l['title'] => $l['locked']])->all();
    }

    public function test_no_gratis_a_seguinte_so_abre_depois_de_ver_a_anterior(): void
    {
        [$um, $dois, $tres] = $this->materia();
        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));

        $this->assertSame(['Lição 1' => false, 'Lição 2' => true, 'Lição 3' => true], $this->travas());

        // Trancada, a lição diz qual falta e não entrega as etapas.
        $this->getJson("/api/lessons/{$dois->id}")->assertOk()
            ->assertJsonPath('lesson.locked.id', $um->id)
            ->assertJsonPath('lesson.locked.title', 'Lição 1')
            ->assertJsonCount(0, 'lesson.steps');
        $this->postJson("/api/lessons/{$dois->id}/attempts")->assertForbidden();
        $this->postJson("/api/lessons/{$dois->id}/read")->assertForbidden();

        // Ler a primeira até o fim abre a segunda, e só ela.
        $this->postJson("/api/lessons/{$um->id}/read")->assertOk();
        $this->assertSame(['Lição 1' => false, 'Lição 2' => false, 'Lição 3' => true], $this->travas());
        $this->getJson("/api/lessons/{$dois->id}")->assertJsonPath('lesson.locked', null);
        $this->postJson("/api/lessons/{$dois->id}/attempts")->assertCreated();
        $this->getJson("/api/lessons/{$tres->id}")->assertJsonPath('lesson.locked.id', $dois->id);
    }

    public function test_praticar_tambem_conta_e_o_que_ja_foi_feito_nunca_tranca(): void
    {
        [$um, , $tres] = $this->materia();
        $aluno = User::factory()->create(['plan' => 'free']);
        // Praticou a 3 antes de a trava existir, sem ter feito a 2.
        $this->praticar($aluno, $tres);
        Sanctum::actingAs($aluno);

        $this->assertSame(['Lição 1' => false, 'Lição 2' => true, 'Lição 3' => false], $this->travas());

        // Praticar a 1, sem ler, já abre a 2: quem sabe vai direto às questões.
        $this->praticar($aluno, $um);
        $this->assertFalse($this->travas()['Lição 2']);
    }

    public function test_pro_e_quem_administra_pulam(): void
    {
        [, , $tres] = $this->materia();

        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));
        $this->assertSame(['Lição 1' => false, 'Lição 2' => false, 'Lição 3' => false], $this->travas());
        $this->getJson("/api/lessons/{$tres->id}")->assertJsonPath('lesson.locked', null);

        Sanctum::actingAs(User::factory()->create(['plan' => 'free', 'is_admin' => true]));
        $this->assertFalse($this->travas()['Lição 3']);
    }

    public function test_na_fase_de_testes_ninguem_ve_cadeado(): void
    {
        config(['castelei.unlock_all' => true]);
        [, , $tres] = $this->materia();
        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));

        $this->assertFalse($this->travas()['Lição 3']);
        $this->getJson("/api/lessons/{$tres->id}")->assertJsonPath('lesson.locked', null);
    }
}
