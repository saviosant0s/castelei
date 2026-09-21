<?php

namespace Tests\Unit;

use App\Support\Review\Spacing;
use Tests\TestCase;

/**
 * A regra de espaçamento, com números na mão.
 *
 * Cada teste aqui é uma afirmação sobre o que a literatura diz, não sobre o que
 * o código faz por acaso. Se um deles cair, a pergunta certa é "mudamos de
 * ideia sobre a pedagogia?" — não "como faço passar?".
 */
class SpacingTest extends TestCase
{
    /**
     * O achado central de Cepeda et al. (2008): o intervalo é uma proporção do
     * tempo que falta até a prova.
     */
    public function test_o_intervalo_e_uma_fracao_do_tempo_ate_a_prova(): void
    {
        // 15% de 90 dias = 13,5 → 14 (arredonda para cima).
        $this->assertSame(14, Spacing::intervalDays(daysToExam: 90, percent: 75));
        // 15% de 30 = 4,5 → 5.
        $this->assertSame(5, Spacing::intervalDays(daysToExam: 30, percent: 75));
    }

    /**
     * A consequência que nenhum agendador de flashcard tem: o cronograma se
     * aperta sozinho conforme a prova chega.
     */
    public function test_o_intervalo_encolhe_conforme_a_prova_se_aproxima(): void
    {
        $longe = Spacing::intervalDays(daysToExam: 120, percent: 80);
        $meio = Spacing::intervalDays(daysToExam: 45, percent: 80);
        $perto = Spacing::intervalDays(daysToExam: 10, percent: 80);

        $this->assertGreaterThan($meio, $longe);
        $this->assertGreaterThan($perto, $meio);
        $this->assertSame(1, Spacing::intervalDays(daysToExam: 3, percent: 80));
    }

    /**
     * A crista de Cepeda é assimétrica: passar do ponto custa menos que ficar
     * aquém. Por isso o cálculo arredonda para cima, nunca para baixo.
     */
    public function test_arredonda_para_cima_nunca_para_baixo(): void
    {
        // 15% de 7 = 1,05. Para baixo daria 1; o teste exige 2.
        $this->assertSame(2, Spacing::intervalDays(daysToExam: 7, percent: 75));
    }

    /** Quem saiu com nota baixa ainda não aprendeu: volta antes. */
    public function test_acerto_baixo_encurta_o_intervalo(): void
    {
        $ruim = Spacing::intervalDays(daysToExam: 100, percent: 30);
        $medio = Spacing::intervalDays(daysToExam: 100, percent: 60);
        $bom = Spacing::intervalDays(daysToExam: 100, percent: 80);
        $otimo = Spacing::intervalDays(daysToExam: 100, percent: 95);

        $this->assertLessThan($medio, $ruim);
        $this->assertLessThan($bom, $medio);
        $this->assertLessThan($otimo, $bom);
    }

    /** Tentativa sem nota não é sinal de nada: não pune nem premia. */
    public function test_tentativa_sem_nota_usa_o_intervalo_neutro(): void
    {
        $this->assertSame(
            Spacing::intervalDays(daysToExam: 100, percent: 75),
            Spacing::intervalDays(daysToExam: 100, percent: null),
        );
    }

    /** Recaída acumulada encurta, mas tem piso: nada fica preso em "todo dia". */
    public function test_recaidas_encurtam_ate_um_piso(): void
    {
        $limpo = Spacing::intervalDays(daysToExam: 200, percent: 80, lapses: 0);
        $uma = Spacing::intervalDays(daysToExam: 200, percent: 80, lapses: 1);
        $muitas = Spacing::intervalDays(daysToExam: 200, percent: 80, lapses: 20);

        $this->assertLessThan($limpo, $uma);
        // O piso é 0,5: nem vinte recaídas cortam mais que a metade.
        $this->assertGreaterThanOrEqual((int) ceil($limpo * 0.5), $muitas);
    }

    /**
     * Revisão marcada para depois da prova é revisão que nunca acontece.
     */
    public function test_nunca_agenda_depois_da_prova(): void
    {
        foreach ([1, 2, 5, 12, 40] as $faltam) {
            $intervalo = Spacing::intervalDays(daysToExam: $faltam, percent: 95);
            $this->assertLessThan(
                $faltam + 1,
                $intervalo,
                "Com {$faltam} dias até a prova, o intervalo caiu depois dela.",
            );
        }
    }

    /** Nunca menos de um dia: revisar no mesmo dia é repetir, não espaçar. */
    public function test_o_piso_e_de_um_dia(): void
    {
        $this->assertSame(1, Spacing::intervalDays(daysToExam: 1, percent: 10, lapses: 50));
        $this->assertSame(1, Spacing::intervalDays(daysToExam: 0, percent: 10));
    }

    /** Matéria sem data de prova cai na escada de longo prazo. */
    public function test_sem_data_de_prova_usa_a_escada(): void
    {
        $ladder = config('castelei.review.fallback_days');

        $this->assertSame($ladder[0], Spacing::intervalDays(daysToExam: null, percent: 75, reviewsDone: 0));
        $this->assertSame($ladder[1], Spacing::intervalDays(daysToExam: null, percent: 75, reviewsDone: 1));
        $this->assertSame($ladder[2], Spacing::intervalDays(daysToExam: null, percent: 75, reviewsDone: 2));
    }

    /**
     * A escada para no último degrau em vez de multiplicar para sempre.
     * Intervalo que só cresce acaba arquivando a lição.
     */
    public function test_a_escada_para_no_ultimo_degrau(): void
    {
        $ladder = config('castelei.review.fallback_days');
        $ultimo = $ladder[count($ladder) - 1];

        $this->assertSame($ultimo, Spacing::intervalDays(daysToExam: null, percent: 75, reviewsDone: 99));
    }
}
