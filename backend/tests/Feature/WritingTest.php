<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\User;
use App\Support\Content\ContentValidator;
use App\Support\Writing\WritingReviewer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

/**
 * A questão de escrita.
 *
 * O que estes testes protegem:
 * - o texto-modelo só aparece DEPOIS de a pessoa escrever;
 * - conferir não gasta a questão (reescrever é o exercício);
 * - o LanguageTool fora do ar nunca derruba a prática;
 * - a correção por IA não existe sem chave, e tem limite por dia com ela.
 */
class WritingTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    private const FOLHA = [
        'steps' => ['Diga o tema.', 'Diga o que você defende.'],
        'min_chars' => 50,
        'max_chars' => 400,
        'checks' => ['uma_frase'],
        'checklist' => ['A tese cabe numa frase?', 'Dá para discordar dela?'],
        'model' => 'O celular não deveria ser proibido em sala.',
    ];

    /** @return array{0: Lesson, 1: Question} */
    private function licaoDeEscrita(int $partes = 2): array
    {
        $lesson = $this->makeLesson($partes);

        foreach ($lesson->questions as $question) {
            $question->update([
                'format' => Question::FORMAT_WRITING,
                'options' => [],
                'correct_index' => 0,
                'writing' => self::FOLHA,
            ]);
        }

        return [$lesson, $lesson->questions()->orderBy('position')->first()];
    }

    private function comecar(Lesson $lesson, string $plano = 'pro'): array
    {
        Sanctum::actingAs(User::factory()->create(['plan' => $plano]));

        return $this->postJson("/api/lessons/{$lesson->id}/attempts")->assertCreated()->json();
    }

    public function test_o_roteiro_vai_antes_e_o_modelo_nao(): void
    {
        [$lesson] = $this->licaoDeEscrita();
        $inicio = $this->comecar($lesson);

        $escrita = $inicio['questions'][0]['writing'];

        $this->assertSame('writing', $inicio['questions'][0]['format']);
        $this->assertSame(self::FOLHA['steps'], $escrita['steps']);
        $this->assertSame(400, $escrita['max_chars']);
        $this->assertArrayNotHasKey('model', $escrita);
        $this->assertArrayNotHasKey('checklist', $escrita);
        $this->assertStringNotContainsString('proibido em sala', json_encode($inicio));
    }

    public function test_conferir_mostra_modelo_e_erros_sem_gastar_a_questao(): void
    {
        Http::fake(['*' => Http::response(['matches' => [[
            'offset' => 9, 'length' => 7, 'message' => 'Erro de concordância.',
            'replacements' => [['value' => 'a gente deve'], ['value' => 'nós devemos']],
            'rule' => ['category' => ['id' => 'GRAMMAR']],
        ]]])]);
        config(['castelei.writing.languagetool_url' => 'https://lt.exemplo/v2/check']);

        [$lesson, $question] = $this->licaoDeEscrita();
        $attemptId = $this->comecar($lesson)['attempt']['id'];

        foreach ([1, 2] as $_) {
            $this->postJson("/api/attempts/{$attemptId}/writing/check", [
                'question_id' => $question->id,
                'text' => 'Eu acho a gente devemos pensar nisso.',
            ])->assertOk()
                ->assertJsonPath('language.available', true)
                ->assertJsonPath('language.issues.0.group', 'gramática')
                ->assertJsonPath('language.issues.0.replacements', ['a gente deve', 'nós devemos'])
                ->assertJsonPath('model', self::FOLHA['model'])
                ->assertJsonPath('checklist', self::FOLHA['checklist'])
                ->assertJsonPath('ai', false);
        }

        // O mesmo texto foi conferido duas vezes, e o serviço de fora, uma só.
        Http::assertSentCount(1);
        $this->assertDatabaseCount('answers', 0);
    }

    public function test_languagetool_fora_do_ar_nao_derruba_a_conferencia(): void
    {
        Http::fake(['*' => Http::response('fora do ar', 503)]);
        config(['castelei.writing.languagetool_url' => 'https://lt.exemplo/v2/check']);

        [$lesson, $question] = $this->licaoDeEscrita();
        $attemptId = $this->comecar($lesson)['attempt']['id'];

        $this->postJson("/api/attempts/{$attemptId}/writing/check", [
            'question_id' => $question->id,
            'text' => 'Um texto qualquer.',
        ])->assertOk()
            ->assertJsonPath('language.available', false)
            ->assertJsonPath('model', self::FOLHA['model']);
    }

    public function test_cumprida_e_quando_a_autoavaliacao_marca_tudo(): void
    {
        [$lesson] = $this->licaoDeEscrita();
        $inicio = $this->comecar($lesson);
        $attemptId = $inicio['attempt']['id'];
        [$primeira, $segunda] = array_column($inicio['questions'], 'id');

        $this->postJson("/api/attempts/{$attemptId}/answers", [
            'question_id' => $primeira,
            'text' => '  O celular ajuda a aprender.  ',
            'checklist' => [true, true],
            'seconds' => 300,
        ])->assertOk()->assertJsonPath('is_correct', true)->assertJsonPath('correct_index', null);

        // Um critério sem marcar: a parte fica devendo.
        $this->postJson("/api/attempts/{$attemptId}/answers", [
            'question_id' => $segunda,
            'text' => 'Outra parte.',
            'checklist' => [true],
            'seconds' => 200,
        ])->assertOk()->assertJsonPath('is_correct', false);

        $this->assertDatabaseHas('answers', ['question_id' => $primeira, 'text' => 'O celular ajuda a aprender.']);

        $this->postJson("/api/attempts/{$attemptId}/finish")
            ->assertOk()
            ->assertJsonPath('percent', 50);
    }

    public function test_o_progresso_nao_mistura_texto_com_questao(): void
    {
        [$lesson] = $this->licaoDeEscrita();
        $inicio = $this->comecar($lesson);
        $attemptId = $inicio['attempt']['id'];

        foreach (array_column($inicio['questions'], 'id') as $id) {
            $this->postJson("/api/attempts/{$attemptId}/answers", [
                'question_id' => $id, 'text' => 'Um texto.', 'checklist' => [true, true], 'seconds' => 600,
            ])->assertOk();
        }
        $this->postJson("/api/attempts/{$attemptId}/finish")->assertOk();

        $progresso = $this->getJson('/api/progress')->assertOk();

        // O tópico aparece, marcado como escrita…
        $this->assertTrue($progresso->json('topics.0.writing'));
        // …mas não entra nos números de questão nem nos gráficos de acerto e tempo.
        $this->assertSame(0, $progresso->json('overall.answered'));
        $this->assertNull($progresso->json('overall.avg_seconds'));
        $this->assertSame([], $progresso->json('evolution'));
    }

    public function test_texto_vazio_e_pular_e_nao_cumprir(): void
    {
        [$lesson, $question] = $this->licaoDeEscrita();
        $attemptId = $this->comecar($lesson)['attempt']['id'];

        $this->postJson("/api/attempts/{$attemptId}/answers", [
            'question_id' => $question->id,
            'text' => '   ',
            'checklist' => [true, true],
            'seconds' => 5,
        ])->assertOk()->assertJsonPath('is_correct', false);

        $this->assertDatabaseHas('answers', ['question_id' => $question->id, 'text' => null]);
    }

    public function test_licao_de_escrita_nao_e_cortada_pelo_plano(): void
    {
        // O plano grátis limita a 5 questões; a sexta parte é a que junta o texto.
        [$lesson] = $this->licaoDeEscrita(6);
        config(['castelei.unlock_all' => false]);

        $inicio = $this->comecar($lesson, 'free');

        $this->assertCount(6, $inicio['questions']);
        $this->assertFalse($inicio['limited_by_plan']);
    }

    public function test_simulado_de_escrita_e_um_texto_do_zero(): void
    {
        [$lesson] = $this->licaoDeEscrita(2);

        $proposta = Question::create([
            'lesson_id' => $lesson->id,
            'position' => 3,
            'topic' => 'Texto completo',
            'format' => Question::FORMAT_WRITING,
            'statement' => 'Escreva um artigo de opinião inteiro.',
            'options' => [],
            'correct_index' => 0,
            'explanation' => 'Sem roteiro por partes.',
            'writing' => self::FOLHA,
            'exam_only' => true,
        ]);

        config(['castelei.exam_for_all' => true]);

        // A lição não entrega a proposta do simulado…
        $inicio = $this->comecar($lesson);
        $this->assertNotContains($proposta->id, array_column($inicio['questions'], 'id'));

        // …e o simulado entrega só ela, mesmo abaixo do mínimo de questões.
        $simulado = $this->postJson("/api/subjects/{$lesson->subject_id}/exams")->assertCreated()->json();
        $this->assertSame([$proposta->id], array_column($simulado['questions'], 'id'));

        $this->getJson('/api/subjects')
            ->assertJsonPath('subjects.0.exam.available', true)
            ->assertJsonPath('subjects.0.exam.questions', 1)
            ->assertJsonPath('subjects.0.lessons.0.questions_total', 2);
    }

    public function test_sem_chave_a_correcao_por_ia_nao_existe(): void
    {
        [$lesson, $question] = $this->licaoDeEscrita();
        $attemptId = $this->comecar($lesson)['attempt']['id'];

        $this->postJson("/api/attempts/{$attemptId}/writing/review", [
            'question_id' => $question->id,
            'text' => 'Um texto.',
        ])->assertNotFound();
    }

    public function test_com_chave_a_correcao_por_ia_tem_limite_por_dia(): void
    {
        config(['castelei.writing.ai.key' => 'chave-de-teste', 'castelei.writing.ai.daily_limit' => 2]);

        $this->app->instance(WritingReviewer::class, new class implements WritingReviewer
        {
            public function review(Question $question, string $text): string
            {
                return 'Sua tese está clara.';
            }
        });

        [$lesson, $question] = $this->licaoDeEscrita();
        $attemptId = $this->comecar($lesson)['attempt']['id'];
        $pedido = ['question_id' => $question->id, 'text' => 'Um texto.'];

        $this->postJson("/api/attempts/{$attemptId}/writing/check", $pedido)->assertJsonPath('ai', true);

        $this->postJson("/api/attempts/{$attemptId}/writing/review", $pedido)
            ->assertOk()
            ->assertJsonPath('feedback', 'Sua tese está clara.')
            ->assertJsonPath('remaining', 1);
        $this->postJson("/api/attempts/{$attemptId}/writing/review", $pedido)->assertOk();
        $this->postJson("/api/attempts/{$attemptId}/writing/review", $pedido)->assertStatus(429);
    }

    public function test_falha_da_ia_devolve_a_correcao_do_dia(): void
    {
        config(['castelei.writing.ai.key' => 'chave-de-teste', 'castelei.writing.ai.daily_limit' => 1]);

        $this->app->instance(WritingReviewer::class, new class implements WritingReviewer
        {
            public function review(Question $question, string $text): string
            {
                throw new \RuntimeException('fora do ar');
            }
        });

        [$lesson, $question] = $this->licaoDeEscrita();
        $attemptId = $this->comecar($lesson)['attempt']['id'];
        $pedido = ['question_id' => $question->id, 'text' => 'Um texto.'];

        $this->postJson("/api/attempts/{$attemptId}/writing/review", $pedido)->assertStatus(503);
        // Não gastou: a próxima tentativa ainda cabe no limite de 1.
        $this->postJson("/api/attempts/{$attemptId}/writing/review", $pedido)->assertStatus(503);
    }

    public function test_o_painel_nao_estraga_questao_de_escrita(): void
    {
        [, $question] = $this->licaoDeEscrita();
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));

        $this->putJson("/api/admin/questions/{$question->id}", [
            'topic' => 'Tese', 'statement' => 'Outra', 'options' => ['a', 'b'], 'correct_index' => 0, 'explanation' => 'x',
        ])->assertStatus(422);

        $this->assertSame(Question::FORMAT_WRITING, $question->fresh()->format);
        $this->assertSame(self::FOLHA['model'], $question->fresh()->writing['model']);
    }

    public function test_o_validador_exige_roteiro_criterios_e_modelo(): void
    {
        $materia = fn (array $questao) => [
            'slug' => 'escrita', 'name' => 'Escrita',
            'lessons' => [[
                'slug' => 'l1', 'title' => 'L1', 'summary' => 'Resumo',
                'steps' => [['kind' => 'idea', 'title' => 'Ideia', 'body' => ['Texto.']]],
                'questions' => [$questao + [
                    'topic' => 'Tese', 'statement' => 'Escreva a tese.', 'explanation' => 'Porque sim.', 'format' => 'writing',
                ]],
            ]],
        ];

        $bom = (new ContentValidator)->validate($materia(['writing' => self::FOLHA]));
        $this->assertSame([], $bom['errors']);
        $this->assertNotContains('lessons[0].questions', array_column($bom['warnings'], 'path'));

        $ruim = (new ContentValidator)->validate($materia(['writing' => ['steps' => [], 'checks' => ['inventada']]]));
        $caminhos = array_column($ruim['errors'], 'path');

        foreach (['steps', 'checklist', 'model', 'checks[0]'] as $campo) {
            $this->assertContains("lessons[0].questions[0].writing.{$campo}", $caminhos);
        }

        $escolha = (new ContentValidator)->validate($materia(['format' => 'choice', 'options' => ['a', 'b'], 'correct_index' => 0, 'exam_only' => true]));
        $this->assertContains('lessons[0].questions[0].exam_only', array_column($escolha['errors'], 'path'));
    }
}
