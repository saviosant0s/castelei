<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\Subject;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_conteudo_do_mvp_e_carregado_completo(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(2, Subject::count());
        $this->assertSame(4, Lesson::count());
        $this->assertSame(32, Question::count());

        foreach (Lesson::withCount('questions')->get() as $lesson) {
            $this->assertSame(8, $lesson->questions_count, "Lição {$lesson->slug} deve ter 8 questões");
            $this->assertNotEmpty($lesson->summary);
            $this->assertNotEmpty($lesson->explanation);
            $this->assertNotEmpty($lesson->exam_style);
            $this->assertNotEmpty($lesson->pitfalls);
        }
    }

    public function test_toda_questao_tem_5_alternativas_gabarito_valido_e_explicacao(): void
    {
        $this->seed(DatabaseSeeder::class);

        foreach (Question::all() as $question) {
            $this->assertCount(5, $question->options, "Questão {$question->id}");
            $this->assertCount(5, array_unique($question->options), "Questão {$question->id} tem alternativas repetidas");
            $this->assertGreaterThanOrEqual(0, $question->correct_index);
            $this->assertLessThan(5, $question->correct_index);
            $this->assertNotEmpty($question->explanation);
            $this->assertNotEmpty($question->pitfall);
            $this->assertNotEmpty($question->topic);
        }
    }

    public function test_rodar_o_seeder_de_novo_nao_duplica_nada(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(2, Subject::count());
        $this->assertSame(4, Lesson::count());
        $this->assertSame(32, Question::count());
    }

    public function test_comando_setup_roda_migrations_e_carrega_o_conteudo(): void
    {
        $this->artisan('castelei:setup')->assertSuccessful();

        $this->assertSame(32, Question::count());
    }
}
