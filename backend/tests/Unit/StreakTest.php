<?php

namespace Tests\Unit;

use App\Support\Gamification\Badges;
use App\Support\Gamification\Streak;
use PHPUnit\Framework\TestCase;

class StreakTest extends TestCase
{
    private const TODAY = '2026-09-19';

    public function test_sem_dias_nao_ha_streak(): void
    {
        $this->assertSame(['current' => 0, 'longest' => 0, 'studied_today' => false], Streak::compute([], self::TODAY));
    }

    public function test_conta_dias_seguidos_terminando_hoje(): void
    {
        $result = Streak::compute(['2026-09-19', '2026-09-18', '2026-09-17'], self::TODAY);

        $this->assertSame(['current' => 3, 'longest' => 3, 'studied_today' => true], $result);
    }

    public function test_streak_continua_vivo_se_estudou_ontem_mas_ainda_nao_hoje(): void
    {
        $result = Streak::compute(['2026-09-18', '2026-09-17'], self::TODAY);

        $this->assertSame(['current' => 2, 'longest' => 2, 'studied_today' => false], $result);
    }

    public function test_streak_zera_depois_de_um_dia_inteiro_sem_estudar(): void
    {
        $result = Streak::compute(['2026-09-17', '2026-09-16'], self::TODAY);

        $this->assertSame(['current' => 0, 'longest' => 2, 'studied_today' => false], $result);
    }

    public function test_buraco_no_meio_separa_as_sequencias(): void
    {
        $result = Streak::compute(['2026-09-19', '2026-09-18', '2026-09-15', '2026-09-14', '2026-09-13'], self::TODAY);

        $this->assertSame(['current' => 2, 'longest' => 3, 'studied_today' => true], $result);
    }

    public function test_ignora_duplicados_e_ordem(): void
    {
        $result = Streak::compute(['2026-09-18', '2026-09-19', '2026-09-19', '2026-09-18'], self::TODAY);

        $this->assertSame(['current' => 2, 'longest' => 2, 'studied_today' => true], $result);
    }

    public function test_funciona_na_virada_de_mes_ano_e_bissexto(): void
    {
        $this->assertSame(3, Streak::compute(['2026-10-01', '2026-09-30', '2026-09-29'], '2026-10-01')['current']);
        $this->assertSame(2, Streak::compute(['2027-01-01', '2026-12-31'], '2027-01-01')['current']);
        $this->assertSame(3, Streak::compute(['2028-03-01', '2028-02-29', '2028-02-28'], '2028-03-01')['current']);
    }

    public function test_maior_sequencia_lembra_do_recorde_antigo(): void
    {
        $result = Streak::compute(['2026-09-19', '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04'], self::TODAY);

        $this->assertSame(1, $result['current']);
        $this->assertSame(4, $result['longest']);
    }

    public function test_catalogo_de_conquistas_tem_chaves_unicas(): void
    {
        $keys = array_column(Badges::all(), 'key');

        $this->assertCount(10, $keys);
        $this->assertCount(10, array_unique($keys));
        $this->assertSame('Semana firme', Badges::find('streak-7')['name']);
        $this->assertNull(Badges::find('nao-existe'));
    }
}
