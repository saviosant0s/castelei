<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\Subject;
use App\Models\User;
use App\Support\Content\ContentImporter;
use App\Support\Content\ContentValidator;
use App\Support\Content\SubjectExporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesContent;
use Tests\TestCase;

/**
 * A questão de certo ou errado (Cebraspe) e a marca de importância.
 *
 * As duas nasceram da trilha de perito (docs/trilha-perito.md): a prova da
 * PF é de itens para julgar, em que o erro tira ponto, e o Sávio pediu que a
 * trilha dissesse o que mais cai.
 */
class JudgeAndIncidenceTest extends TestCase
{
    use MakesContent;
    use RefreshDatabase;

    /** Uma lição com 6 itens de julgar (3 certos, 3 errados), importância e referência de prova. */
    private function importar(): Lesson
    {
        $itens = [];
        foreach (['certo', 'errado', 'certo', 'errado', 'certo', 'errado'] as $i => $gabarito) {
            $itens[] = [
                'format' => 'judge',
                'topic' => 'Cadeia de custódia',
                'statement' => "Afirmação {$i}.",
                'answer' => $gabarito,
                'explanation' => "Por isso, {$i}.",
                'exam_ref' => 'PF 2025, item '.(106 + $i),
            ];
        }

        $dados = $this->contentPayload(['lessons' => [$this->lessonPayload([
            'incidence' => 'alta',
            'questions' => $itens,
        ])]]);

        app(ContentImporter::class)->import($dados, 'seed');

        return Lesson::where('slug', 'licao-um')->firstOrFail();
    }

    public function test_o_arquivo_escreve_o_gabarito_por_extenso_e_o_banco_guarda_duas_opcoes_fixas(): void
    {
        $lesson = $this->importar();
        $primeira = $lesson->questions()->orderBy('position')->first();
        $segunda = $lesson->questions()->orderBy('position')->skip(1)->first();

        $this->assertSame('alta', $lesson->incidence);
        $this->assertSame(Question::FORMAT_JUDGE, $primeira->format);
        $this->assertSame(['Certo', 'Errado'], $primeira->options);
        $this->assertSame(0, $primeira->correct_index);
        $this->assertSame(1, $segunda->correct_index);
        $this->assertSame('PF 2025, item 106', $primeira->exam_ref);
    }

    public function test_o_que_sai_na_exportacao_entra_de_volta_igual(): void
    {
        $this->importar();
        $subject = Subject::where('slug', 'materia-nova')->firstOrFail();

        $exportado = app(SubjectExporter::class)->export($subject);
        $licao = $exportado['lessons'][0];
        $this->assertSame('alta', $licao['incidence']);
        $this->assertSame('errado', $licao['questions'][1]['answer']);
        $this->assertArrayNotHasKey('options', $licao['questions'][1]);
        $this->assertArrayNotHasKey('correct_index', $licao['questions'][1]);
        $this->assertSame('PF 2025, item 107', $licao['questions'][1]['exam_ref']);

        $this->assertSame([], app(ContentValidator::class)->validate($exportado)['errors']);
    }

    public function test_certo_e_errado_nao_embaralham_e_o_resultado_traz_a_nota_do_cebraspe(): void
    {
        $lesson = $this->importar();
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));

        $inicio = $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated()->json();
        $tentativa = $inicio['attempt']['id'];

        foreach ($inicio['questions'] as $q) {
            // Na tela vem sempre Certo e depois Errado, sem sorteio.
            $this->assertSame(['Certo', 'Errado'], $q['options']);
            $this->assertSame('judge', $q['format']);
            $this->assertStringStartsWith('PF 2025, item ', $q['exam_ref']);
        }

        // Quatro respostas: duas certas, uma errada e uma em branco. As outras duas ficam sem resposta.
        $q = $inicio['questions'];
        $this->postJson("/api/attempts/{$tentativa}/answers", ['question_id' => $q[0]['id'], 'selected' => 0, 'seconds' => 5])
            ->assertJsonPath('is_correct', true)->assertJsonPath('correct_index', 0);
        $this->postJson("/api/attempts/{$tentativa}/answers", ['question_id' => $q[1]['id'], 'selected' => 1, 'seconds' => 5])
            ->assertJsonPath('is_correct', true)->assertJsonPath('correct_index', 1);
        $this->postJson("/api/attempts/{$tentativa}/answers", ['question_id' => $q[2]['id'], 'selected' => 1, 'seconds' => 5])
            ->assertJsonPath('is_correct', false);
        $this->postJson("/api/attempts/{$tentativa}/answers", ['question_id' => $q[3]['id'], 'selected' => null, 'seconds' => 5])
            ->assertJsonPath('is_correct', false);

        $this->postJson("/api/attempts/{$tentativa}/finish")->assertOk()
            ->assertJsonPath('judge.right', 2)
            ->assertJsonPath('judge.wrong', 1)
            ->assertJsonPath('judge.blank', 3)
            ->assertJsonPath('judge.net', 1);
    }

    public function test_tentativa_sem_item_de_julgar_nao_traz_nota_do_cebraspe(): void
    {
        $this->importarAlternativas();
        $lesson = Lesson::where('slug', 'licao-um')->firstOrFail();
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));

        $inicio = $this->postJson("/api/lessons/{$lesson->id}/attempts")->json();
        $this->postJson("/api/attempts/{$inicio['attempt']['id']}/finish")->assertOk()->assertJsonPath('judge', null);
    }

    private function importarAlternativas(): void
    {
        app(ContentImporter::class)->import($this->contentPayload(), 'seed');
    }

    public function test_a_importancia_chega_na_lista_da_materia_e_na_licao(): void
    {
        $lesson = $this->importar();
        Sanctum::actingAs(User::factory()->create(['plan' => 'pro']));

        $this->getJson('/api/subjects')->assertOk()->assertJsonPath('subjects.0.lessons.0.incidence', 'alta');
        $this->getJson("/api/lessons/{$lesson->id}")->assertOk()->assertJsonPath('lesson.incidence', 'alta');
    }

    public function test_o_validador_recusa_importancia_e_gabarito_fora_da_lista(): void
    {
        $validar = fn (array $licao) => array_column(
            app(ContentValidator::class)->validate($this->contentPayload(['lessons' => [$this->lessonPayload($licao)]]))['errors'],
            'path',
        );

        $this->assertContains('lessons[0].incidence', $validar(['incidence' => 'altíssima']));

        $semGabarito = [['format' => 'judge', 'topic' => 'T', 'statement' => 'S', 'explanation' => 'E']];
        $this->assertContains('lessons[0].questions[0].answer', $validar(['questions' => $semGabarito]));

        $comAlternativas = [['format' => 'judge', 'topic' => 'T', 'statement' => 'S', 'explanation' => 'E', 'answer' => 'certo', 'options' => ['a', 'b'], 'correct_index' => 0]];
        $this->assertContains('lessons[0].questions[0].options', $validar(['questions' => $comAlternativas]));
    }

    public function test_o_painel_edita_o_item_de_julgar_sem_virar_alternativa(): void
    {
        $lesson = $this->importar();
        $questao = $lesson->questions()->orderBy('position')->first();
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));

        $this->putJson("/api/admin/questions/{$questao->id}", [
            'format' => 'judge',
            'topic' => 'Cadeia de custódia',
            'statement' => 'Nova afirmação.',
            'correct_index' => 1,
            'explanation' => 'Explicação nova.',
            'exam_ref' => 'PF 2018, item 69',
        ])->assertOk()
            ->assertJsonPath('question.format', 'judge')
            ->assertJsonPath('question.options', ['Certo', 'Errado'])
            ->assertJsonPath('question.correct_index', 1)
            ->assertJsonPath('question.exam_ref', 'PF 2018, item 69');
    }

    public function test_a_importancia_de_cada_passo_de_trilha_e_uma_das_tres(): void
    {
        foreach (config('castelei.trails') as $trilha) {
            foreach ($trilha['steps'] as $passo) {
                if (array_key_exists('importance', $passo)) {
                    $this->assertContains($passo['importance'], Lesson::INCIDENCES, "{$trilha['slug']} → {$passo['subject']}");
                }
            }
        }
    }
}
