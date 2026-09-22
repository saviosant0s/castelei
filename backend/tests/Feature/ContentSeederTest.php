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

    /**
     * O que os arquivos de conteúdo prometem.
     *
     * Os números saem da fonte de verdade, e não ficam escritos aqui: número
     * fixo no teste faz toda lição nova quebrar a suíte, e o que importa não
     * é quantas lições existem — é o banco terminar com exatamente o que os
     * arquivos têm.
     *
     * @return array{subjects: int, lessons: int, questions: int}
     */
    private function esperado(): array
    {
        $subjects = 0;
        $lessons = 0;
        $questions = 0;

        foreach (glob(database_path('seeders/content/*.json')) as $file) {
            $data = json_decode(file_get_contents($file), true);
            $subjects++;
            $lessons += count($data['lessons']);
            foreach ($data['lessons'] as $lesson) {
                $questions += count($lesson['questions']);
            }
        }

        return ['subjects' => $subjects, 'lessons' => $lessons, 'questions' => $questions];
    }

    /** Quantas lições um arquivo de matéria traz. */
    private function licoesDe(string $slug): int
    {
        $data = json_decode(file_get_contents($this->arquivoDaMateria($slug)), true);

        return count($data['lessons']);
    }

    private function arquivoDaMateria(string $slug): string
    {
        foreach (glob(database_path('seeders/content/*.json')) as $file) {
            if (json_decode(file_get_contents($file), true)['slug'] === $slug) {
                return $file;
            }
        }

        $this->fail("Não há arquivo de conteúdo para a matéria {$slug}.");
    }

    public function test_conteudo_do_mvp_e_carregado_completo(): void
    {
        $this->seed(DatabaseSeeder::class);
        $esperado = $this->esperado();

        $this->assertSame($esperado['subjects'], Subject::count());
        $this->assertSame($esperado['lessons'], Lesson::count());
        $this->assertSame($esperado['questions'], Question::count());

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

    public function test_licoes_de_sistemas_operacionais_tem_figuras_com_texto_alternativo_e_arquivo(): void
    {
        $this->seed(DatabaseSeeder::class);

        $lessons = Lesson::whereHas('subject', fn ($q) => $q->where('slug', 'sistemas-operacionais'))->get();
        $this->assertCount($this->licoesDe('sistemas-operacionais'), $lessons);

        $publicDir = base_path('../frontend/public');
        foreach ($lessons as $lesson) {
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

    /** O Castelei é independente: o conteúdo nunca cita livros, autores, capítulos ou páginas. */
    public function test_conteudo_nao_faz_referencia_a_livros_ou_fontes(): void
    {
        $this->seed(DatabaseSeeder::class);

        $padrao = '/segundo o livro|o livro (conta|diz|chama|lembra|observa|explica|dá|mostra|traz)|livro-texto|tanenbaum|para ler no livro|\bcap\.? ?\d|\bseção \d|\bp\. ?\d/iu';

        foreach (Lesson::all() as $lesson) {
            $texto = json_encode([$lesson->summary, $lesson->steps], JSON_UNESCAPED_UNICODE);
            $this->assertDoesNotMatchRegularExpression($padrao, $texto, "Lição {$lesson->slug}");
        }
        foreach (Question::all() as $question) {
            $texto = json_encode([$question->statement, $question->options, $question->explanation, $question->pitfall], JSON_UNESCAPED_UNICODE);
            $this->assertDoesNotMatchRegularExpression($padrao, $texto, "Questão {$question->id}");
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

    public function test_toda_questao_esta_completa_no_formato_dela(): void
    {
        $this->seed(DatabaseSeeder::class);

        foreach (Question::all() as $question) {
            $onde = "Questão {$question->id}";

            $this->assertNotEmpty($question->explanation, $onde);
            $this->assertNotEmpty($question->pitfall, $onde);
            $this->assertNotEmpty($question->topic, $onde);
            $this->assertCount(
                count($question->options),
                array_unique($question->options),
                "{$onde} tem opções repetidas",
            );

            if ($question->format === Question::FORMAT_MATCH) {
                /*
                | A questão de associar não tem alternativas: tem duplas. De
                | três a cinco — com duas, acertar uma entrega a outra; acima
                | de cinco, os dois lados não cabem juntos na tela.
                */
                $pares = $question->pairs ?? [];

                $this->assertSame([], $question->options, $onde);
                $this->assertGreaterThanOrEqual(3, count($pares), $onde);
                $this->assertLessThanOrEqual(5, count($pares), $onde);

                foreach (['left', 'right'] as $lado) {
                    $valores = array_column($pares, $lado);
                    $this->assertCount(count($pares), array_filter($valores), "{$onde}: par sem {$lado}");
                    $this->assertCount(count($valores), array_unique($valores), "{$onde}: repetido em {$lado}");
                }

                continue;
            }

            if ($question->format === Question::FORMAT_ORDER) {
                /*
                | A questão de ordenar não tem cinco alternativas nem gabarito:
                | são de três a seis passos, e o gabarito é a ordem em que
                | estão escritos. Menos de três, metade acerta no chute.
                */
                $this->assertGreaterThanOrEqual(3, count($question->options), $onde);
                $this->assertLessThanOrEqual(6, count($question->options), $onde);

                continue;
            }

            $this->assertCount(5, $question->options, $onde);
            $this->assertGreaterThanOrEqual(0, $question->correct_index, $onde);
            $this->assertLessThan(5, $question->correct_index, $onde);
        }
    }

    public function test_rodar_o_seeder_de_novo_nao_duplica_nada(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);
        $esperado = $this->esperado();

        $this->assertSame($esperado['subjects'], Subject::count());
        $this->assertSame($esperado['lessons'], Lesson::count());
        $this->assertSame($esperado['questions'], Question::count());
    }

    public function test_comando_setup_roda_migrations_e_carrega_o_conteudo(): void
    {
        $this->artisan('castelei:setup')->assertSuccessful();

        $this->assertSame($this->esperado()['questions'], Question::count());
    }
}
