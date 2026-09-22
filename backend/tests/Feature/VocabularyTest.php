<?php

namespace Tests\Feature;

use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VocabularyTest extends TestCase
{
    use RefreshDatabase;

    private function materia(): Subject
    {
        $subject = Subject::create([
            'slug' => 'servidores',
            'name' => 'Servidores',
            'description' => 'Descrição',
            'position' => 1,
        ]);

        Lesson::create([
            'subject_id' => $subject->id,
            'slug' => 'licao-1',
            'title' => 'O que é um servidor',
            'position' => 1,
            'summary' => 'Resumo',
            'explanation' => 'Explicação',
            'exam_style' => 'Como cai na prova',
            'pitfalls' => ['Pegadinha'],
            'steps' => [
                [
                    'kind' => 'idea',
                    'title' => 'Ideia',
                    'body' => ['Uma analogia.'],
                    'terms' => [
                        ['word' => 'Servidor', 'meaning' => 'computador que atende pedidos de outros computadores.'],
                        ['word' => 'Índice', 'meaning' => 'atalho que o banco usa para achar uma linha sem ler todas.'],
                    ],
                ],
                [
                    'kind' => 'recap',
                    'title' => 'Resumo',
                    'body' => ['Resumindo.'],
                    'terms' => [['word' => 'Zona', 'meaning' => 'o pedaço do DNS que um servidor responde.']],
                ],
            ],
        ]);

        Lesson::create([
            'subject_id' => $subject->id,
            'slug' => 'licao-2',
            'title' => 'Acesso remoto',
            'position' => 2,
            'summary' => 'Resumo',
            'explanation' => 'Explicação',
            'exam_style' => 'Como cai na prova',
            'pitfalls' => ['Pegadinha'],
            'steps' => [
                [
                    'kind' => 'idea',
                    'title' => 'Ideia',
                    'body' => ['Outra analogia.'],
                    'terms' => [
                        // repetida, com explicação encurtada
                        ['word' => 'servidor', 'meaning' => 'a máquina lá do outro lado.'],
                        ['word' => 'SSH', 'meaning' => 'o jeito seguro de abrir um terminal numa máquina distante.'],
                    ],
                ],
            ],
        ]);

        return $subject;
    }

    public function test_vocabulario_exige_login(): void
    {
        $subject = $this->materia();

        $this->getJson("/api/subjects/{$subject->id}/vocabulario")->assertUnauthorized();
    }

    public function test_reune_as_palavras_de_todas_as_licoes_em_ordem_de_dicionario(): void
    {
        $subject = $this->materia();
        Sanctum::actingAs(User::factory()->create());

        $resposta = $this->getJson("/api/subjects/{$subject->id}/vocabulario")->assertOk();

        // "Índice" entre I e S, não depois de Z: sem tirar o acento, a tabela
        // ASCII joga toda letra acentuada para o fim do alfabeto.
        $this->assertSame(
            ['Índice', 'Servidor', 'SSH', 'Zona'],
            array_column($resposta->json('terms'), 'word'),
        );
    }

    public function test_a_palavra_repetida_fica_com_a_explicacao_de_estreia(): void
    {
        // Quem lê o glossário é justamente quem nunca viu o termo, e a
        // explicação de estreia foi escrita para essa pessoa.
        $subject = $this->materia();
        Sanctum::actingAs(User::factory()->create());

        $termos = collect($this->getJson("/api/subjects/{$subject->id}/vocabulario")->json('terms'));
        $servidor = $termos->firstWhere('word', 'Servidor');

        $this->assertSame('computador que atende pedidos de outros computadores.', $servidor['meaning']);
        $this->assertSame('O que é um servidor', $servidor['lesson']['title']);
    }

    public function test_cada_palavra_leva_de_volta_a_licao_que_a_explica(): void
    {
        $subject = $this->materia();
        Sanctum::actingAs(User::factory()->create());

        $termos = collect($this->getJson("/api/subjects/{$subject->id}/vocabulario")->json('terms'));

        $this->assertSame(2, $termos->firstWhere('word', 'SSH')['lesson']['position']);
        $this->assertSame(1, $termos->firstWhere('word', 'Zona')['lesson']['position']);
    }

    public function test_a_palavra_sabe_se_a_licao_dela_ja_foi_praticada(): void
    {
        /*
        | A página mostra a matéria INTEIRA, e marca o que ainda não foi
        | estudado para a tela apagar. Esconder seria transformar o glossário
        | numa tranca, logo para quem chegou aqui travado numa palavra.
        |
        | "Praticada" é o mesmo critério da trilha: tentativa CONCLUÍDA, sem
        | cobrar nota. Tentativa aberta e abandonada não conta.
        */
        $subject = $this->materia();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $primeira = $subject->lessons()->where('position', 1)->first();
        $segunda = $subject->lessons()->where('position', 2)->first();

        Attempt::create([
            'user_id' => $user->id,
            'lesson_id' => $primeira->id,
            'total_questions' => 8,
            'correct_count' => 4,
            'started_at' => now()->subMinutes(5),
            'finished_at' => now(),
        ]);
        Attempt::create([
            'user_id' => $user->id,
            'lesson_id' => $segunda->id,
            'total_questions' => 8,
            'correct_count' => 0,
            'started_at' => now(),
        ]);

        $termos = collect($this->getJson("/api/subjects/{$subject->id}/vocabulario")->json('terms'));

        $this->assertTrue($termos->firstWhere('word', 'Servidor')['seen']);
        $this->assertTrue($termos->firstWhere('word', 'Zona')['seen']);
        // A lição 2 ficou pela metade: a palavra dela continua apagada.
        $this->assertFalse($termos->firstWhere('word', 'SSH')['seen']);
    }

    public function test_quem_nao_praticou_nada_ve_tudo_como_nao_visto(): void
    {
        $subject = $this->materia();
        Sanctum::actingAs(User::factory()->create());

        $termos = $this->getJson("/api/subjects/{$subject->id}/vocabulario")->json('terms');

        $this->assertNotEmpty($termos);
        $this->assertEmpty(array_filter(array_column($termos, 'seen')));
    }

    public function test_termo_sem_palavra_ou_sem_significado_nao_entra(): void
    {
        // Bloco em branco deixado pelo editor não pode virar linha vazia na
        // página — ela é lida como referência.
        $subject = Subject::create(['slug' => 'vazia', 'name' => 'Vazia', 'position' => 1]);
        Lesson::create([
            'subject_id' => $subject->id,
            'slug' => 'l1',
            'title' => 'Lição',
            'position' => 1,
            'summary' => 'Resumo',
            'explanation' => 'Explicação',
            'exam_style' => 'Como cai na prova',
            'pitfalls' => ['Pegadinha'],
            'steps' => [[
                'kind' => 'idea',
                'title' => 'Ideia',
                'body' => ['Texto.'],
                'terms' => [
                    ['word' => '', 'meaning' => 'sem palavra'],
                    ['word' => 'Sem significado', 'meaning' => '  '],
                    ['word' => 'Vale', 'meaning' => 'esta entra.'],
                ],
            ]],
        ]);
        Sanctum::actingAs(User::factory()->create());

        $termos = $this->getJson("/api/subjects/{$subject->id}/vocabulario")->json('terms');

        $this->assertSame(['Vale'], array_column($termos, 'word'));
    }

    public function test_materia_sem_palavra_nenhuma_devolve_lista_vazia(): void
    {
        $subject = Subject::create(['slug' => 'seca', 'name' => 'Seca', 'position' => 1]);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/subjects/{$subject->id}/vocabulario")
            ->assertOk()
            ->assertJsonPath('terms', [])
            ->assertJsonPath('subject.name', 'Seca');
    }
}
