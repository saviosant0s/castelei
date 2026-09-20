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

        $this->assertSame(3, Subject::count());
        $this->assertSame(7, Lesson::count());
        $this->assertSame(56, Question::count());

        foreach (Lesson::withCount('questions')->get() as $lesson) {
            $this->assertSame(8, $lesson->questions_count, "Lição {$lesson->slug} deve ter 8 questões");
            $this->assertNotEmpty($lesson->summary);
            $this->assertNotEmpty($lesson->explanation);
            $this->assertNotEmpty($lesson->exam_style);
            $this->assertNotEmpty($lesson->pitfalls);
        }
    }

    public function test_toda_licao_tem_etapas_completas_e_ordenadas(): void
    {
        $this->seed(DatabaseSeeder::class);

        foreach (Lesson::all() as $lesson) {
            $steps = $lesson->steps;
            $this->assertGreaterThanOrEqual(6, count($steps), "Lição {$lesson->slug}");
            $this->assertSame('idea', $steps[0]['kind'], 'começa com a analogia');
            $this->assertSame('recap', end($steps)['kind'], 'termina com o resumo');
            $kinds = array_column($steps, 'kind');
            $this->assertSame(1, count(array_keys($kinds, 'exam')));
            $this->assertSame(1, count(array_keys($kinds, 'pitfall')));

            foreach ($steps as $i => $step) {
                $this->assertContains($step['kind'], ['idea', 'explain', 'exam', 'pitfall', 'recap']);
                $this->assertNotEmpty($step['title'], "{$lesson->slug} etapa {$i}");
                $this->assertNotEmpty($step['body'], "{$lesson->slug} etapa {$i}");
            }
        }
    }

    public function test_licoes_de_sistemas_operacionais_citam_o_livro_e_as_figuras_existem(): void
    {
        $this->seed(DatabaseSeeder::class);

        $lessons = Lesson::whereHas('subject', fn ($q) => $q->where('slug', 'sistemas-operacionais'))->get();
        $this->assertCount(3, $lessons);

        $publicDir = base_path('../frontend/public');
        foreach ($lessons as $lesson) {
            $this->assertStringContainsString('Tanenbaum', $lesson->source, "Lição {$lesson->slug}");

            foreach ($lesson->steps as $step) {
                if (! isset($step['figure'])) {
                    continue;
                }
                $this->assertNotEmpty($step['figure']['alt'], "{$lesson->slug}: figura sem texto alternativo");
                if (is_dir($publicDir)) {
                    $this->assertFileExists($publicDir.$step['figure']['src']);
                }
            }
        }
    }

    public function test_seeder_preenche_as_colunas_antigas_a_partir_das_etapas(): void
    {
        $this->seed(DatabaseSeeder::class);

        $lesson = Lesson::where('slug', 'crase')->firstOrFail();

        $this->assertNotEmpty($lesson->explanation);
        $this->assertNotEmpty($lesson->exam_style);
        $this->assertNotEmpty($lesson->pitfalls);
        $this->assertStringContainsString('à', $lesson->explanation);
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

        $this->assertSame(3, Subject::count());
        $this->assertSame(7, Lesson::count());
        $this->assertSame(56, Question::count());
    }

    public function test_comando_setup_roda_migrations_e_carrega_o_conteudo(): void
    {
        $this->artisan('castelei:setup')->assertSuccessful();

        $this->assertSame(56, Question::count());
    }
}
