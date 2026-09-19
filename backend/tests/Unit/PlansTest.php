<?php

namespace Tests\Unit;

use App\Support\Plans;
use Tests\TestCase;

class PlansTest extends TestCase
{
    public function test_limites_por_plano(): void
    {
        $this->assertSame(5, Plans::questionLimit('free'));
        $this->assertSame(30, Plans::questionLimit('plus'));
        $this->assertNull(Plans::questionLimit('pro'));
    }

    public function test_plano_desconhecido_cai_no_limite_do_plano_gratis(): void
    {
        $this->assertSame(5, Plans::questionLimit('inexistente'));
    }

    public function test_existencia_e_rotulos(): void
    {
        $this->assertTrue(Plans::exists('plus'));
        $this->assertFalse(Plans::exists('ouro'));
        $this->assertSame('Grátis', Plans::label('free'));
    }
}
