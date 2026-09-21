<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class PublicCatalogTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    public function test_abre_sem_login(): void
    {
        $this->makeLesson(8);

        $this->getJson('/api/catalog')
            ->assertOk()
            ->assertJsonPath('totals.subjects', 1)
            ->assertJsonPath('totals.lessons', 1)
            ->assertJsonPath('totals.questions', 8);
    }

    public function test_traz_nome_da_materia_e_titulo_das_licoes(): void
    {
        $lesson = $this->makeLesson(8);

        $this->getJson('/api/catalog')
            ->assertOk()
            ->assertJsonPath('subjects.0.slug', $lesson->subject->slug)
            ->assertJsonPath('subjects.0.name', 'Matéria de teste')
            ->assertJsonPath('subjects.0.lessons.0', $lesson->title);
    }

    /**
     * A vitrine é pública: o que sai daqui qualquer um lê sem conta.
     *
     * Enunciado e gabarito continuam atrás da sessão — se vazassem, o Modo
     * Prova viraria decoreba de resposta e o produto perderia a razão de ser.
     */
    public function test_nao_vaza_enunciado_nem_gabarito(): void
    {
        $this->makeLesson(8);

        $corpo = $this->getJson('/api/catalog')->assertOk()->getContent();

        $this->assertStringNotContainsString('Enunciado 1', $corpo);
        $this->assertStringNotContainsString('correct_index', $corpo);
        $this->assertStringNotContainsString('Explicação 1', $corpo);
        $this->assertStringNotContainsString('Pegadinha', $corpo);
    }

    public function test_respeita_a_ordem_das_materias_e_das_licoes(): void
    {
        $primeira = $this->makeLesson(8, 1);
        $this->makeLesson(8, 2, $primeira->subject);

        $titulos = $this->getJson('/api/catalog')->assertOk()->json('subjects.0.lessons');

        $this->assertSame(['Lição 1', 'Lição 2'], $titulos);
    }

    public function test_diz_quantas_questoes_por_licao_quando_todas_tem_o_mesmo(): void
    {
        $lesson = $this->makeLesson(8, 1);
        $this->makeLesson(8, 2, $lesson->subject);

        $this->getJson('/api/catalog')->assertOk()->assertJsonPath('questions_per_lesson', 8);
    }

    /**
     * A vitrine promete "8 questões por lição". Quando deixa de ser verdade em
     * alguma, o campo vem nulo — é assim que a página sabe não prometer.
     */
    public function test_avisa_com_nulo_quando_o_numero_varia(): void
    {
        $lesson = $this->makeLesson(8, 1);
        $this->makeLesson(5, 2, $lesson->subject);

        $this->getJson('/api/catalog')->assertOk()->assertJsonPath('questions_per_lesson', null);
    }

    public function test_catalogo_vazio_nao_quebra(): void
    {
        $this->getJson('/api/catalog')
            ->assertOk()
            ->assertJsonPath('subjects', [])
            ->assertJsonPath('totals.lessons', 0)
            ->assertJsonPath('questions_per_lesson', null);
    }

    /** Vitrine é a mesma para todo mundo: o plano de quem olha não entra na conta. */
    public function test_nao_muda_com_o_plano_de_quem_pergunta(): void
    {
        $this->makeLesson(8);

        $semLogin = $this->getJson('/api/catalog')->json();

        Sanctum::actingAs(User::factory()->create(['plan' => 'free']));
        $comPlanoGratis = $this->getJson('/api/catalog')->json();

        $this->assertSame($semLogin, $comPlanoGratis);
    }

    public function test_pode_ficar_em_cache(): void
    {
        $this->makeLesson(8);

        $this->getJson('/api/catalog')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=300, public');
    }
}
