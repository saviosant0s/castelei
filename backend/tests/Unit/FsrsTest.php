<?php

namespace Tests\Unit;

use App\Support\Review\Fsrs;
use PHPUnit\Framework\TestCase;

/**
 * O FSRS, que agenda as revisões de quem NÃO marcou data de prova.
 * Cada teste é uma propriedade do modelo, com os parâmetros padrão do FSRS-4.5.
 */
class FsrsTest extends TestCase
{
    public function test_o_acerto_vira_a_nota_do_fsrs(): void
    {
        $this->assertSame(1, Fsrs::grade(30));
        $this->assertSame(2, Fsrs::grade(60));
        $this->assertSame(3, Fsrs::grade(80));
        $this->assertSame(4, Fsrs::grade(100));
        $this->assertSame(3, Fsrs::grade(null));
    }

    /** A estabilidade é, por definição, o dia em que a chance de lembrar chega a 90%. */
    public function test_a_estabilidade_e_o_dia_dos_90_por_cento(): void
    {
        $this->assertEqualsWithDelta(0.9, Fsrs::retrievability(10, 10), 0.0001);
        $this->assertSame(10, Fsrs::intervalDays(10));
    }

    public function test_primeira_pratica_comeca_pela_nota(): void
    {
        $errou = Fsrs::next(null, null, 1, 0);
        $facil = Fsrs::next(null, null, 4, 0);

        $this->assertLessThan($facil['stability'], $errou['stability']);
        $this->assertGreaterThan($facil['difficulty'], $errou['difficulty']);
    }

    /** Lembrar no dia certo faz a memória durar mais; esquecer a encurta. */
    public function test_lembrar_alonga_e_esquecer_encurta(): void
    {
        $inicio = Fsrs::next(null, null, 3, 0);

        $lembrou = Fsrs::next($inicio['stability'], $inicio['difficulty'], 3, $inicio['stability']);
        $esqueceu = Fsrs::next($inicio['stability'], $inicio['difficulty'], 1, $inicio['stability']);

        $this->assertGreaterThan($inicio['stability'], $lembrou['stability']);
        $this->assertLessThan($inicio['stability'], $esqueceu['stability']);
    }

    public function test_a_dificuldade_fica_entre_1_e_10(): void
    {
        $estado = Fsrs::next(null, null, 1, 0);
        for ($i = 0; $i < 30; $i++) {
            $estado = Fsrs::next($estado['stability'], $estado['difficulty'], 1, 1);
        }
        $this->assertLessThanOrEqual(10, $estado['difficulty']);

        for ($i = 0; $i < 30; $i++) {
            $estado = Fsrs::next($estado['stability'], $estado['difficulty'], 4, $estado['stability']);
        }
        $this->assertGreaterThanOrEqual(1, $estado['difficulty']);
    }

    public function test_o_intervalo_tem_piso_e_teto(): void
    {
        $this->assertSame(1, Fsrs::intervalDays(0.1));
        $this->assertSame(Fsrs::MAX_DAYS, Fsrs::intervalDays(10000));
    }
}
