<?php

namespace Tests\Unit;

use App\Support\Plans;
use Tests\TestCase;

class PlansTest extends TestCase
{
    public function test_limites_por_plano(): void
    {
        $this->assertSame(8, Plans::questionLimit('free'));
        $this->assertSame(30, Plans::questionLimit('plus'));
        $this->assertNull(Plans::questionLimit('pro'));
    }

    public function test_plano_desconhecido_cai_no_limite_do_plano_gratis(): void
    {
        $this->assertSame(8, Plans::questionLimit('inexistente'));
    }

    public function test_existencia_e_rotulos(): void
    {
        $this->assertTrue(Plans::exists('plus'));
        $this->assertFalse(Plans::exists('ouro'));
        $this->assertSame('Grátis', Plans::label('free'));
    }

    public function test_o_corte_decidido_tudo_de_hoje_no_gratis_e_simulado_no_pro(): void
    {
        config(['castelei.unlock_all' => false, 'castelei.gamification_for_all' => false, 'castelei.exam_for_all' => false]);

        $this->assertTrue(Plans::hasGamification('free'));
        $this->assertFalse(Plans::hasExam('free'));
        $this->assertTrue(Plans::hasExam('pro'));
    }

    public function test_conta_da_lista_enxerga_o_plano_de_verdade_na_fase_de_testes(): void
    {
        config(['castelei.unlock_all' => true, 'castelei.exam_for_all' => false, 'castelei.real_plan_emails' => ' Gratis@Teste.com , outra@x.com']);

        $this->assertTrue(Plans::seesRealPlan('gratis@teste.com'));
        $this->assertFalse(Plans::seesRealPlan('qualquer@x.com'));

        // Todo mundo segue liberado...
        $this->assertSame('pro', Plans::effective('free'));
        $this->assertNull(Plans::questionLimit('free'));
        // ...menos quem está na lista.
        $this->assertSame('free', Plans::effective('free', true));
        $this->assertSame(8, Plans::questionLimit('free', true));
        $this->assertFalse(Plans::hasExam('free', true));
    }

    public function test_quem_administra_estuda_como_pro_menos_a_conta_de_plano_real(): void
    {
        config(['castelei.unlock_all' => false, 'castelei.admin_emails' => 'chefe@teste.dev,teste@teste.dev', 'castelei.real_plan_emails' => 'teste@teste.dev']);

        $admin = new \App\Models\User(['email' => 'chefe@teste.dev', 'plan' => 'free']);
        $this->assertTrue($admin->hasExam());
        $this->assertTrue($admin->hasLevels());
        $this->assertTrue($admin->hasClassrooms());
        $this->assertNull($admin->questionLimit());

        // A conta de plano real existe para ver o app como o grátis de verdade.
        $teste = new \App\Models\User(['email' => 'teste@teste.dev', 'plan' => 'free']);
        $this->assertFalse($teste->hasExam());
        $this->assertSame(8, $teste->questionLimit());

        $aluno = new \App\Models\User(['email' => 'aluno@teste.dev', 'plan' => 'free']);
        $this->assertFalse($aluno->hasExam());
        $this->assertFalse($aluno->canSkipLessons());
    }
}
