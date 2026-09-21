<?php

namespace App\Support\Review;

/**
 * O cálculo do intervalo de revisão, sem banco e sem Eloquent.
 *
 * Está separado do serviço de propósito: é a única parte do sistema que toma
 * uma decisão pedagógica, e decisão pedagógica merece teste direto, com números
 * na mão, sem montar usuário e tentativa para cada caso.
 *
 * A base científica está em config/castelei.php e em docs/revisao-espacada.md.
 * O resumo: o intervalo ideal é uma proporção do tempo que falta até a prova
 * (Cepeda et al., 2008), e não um múltiplo fixo do intervalo anterior.
 */
class Spacing
{
    /**
     * Em quantos dias esta lição deve voltar.
     *
     * @param  int|null  $daysToExam  Dias até a prova da matéria. null = matéria sem data.
     * @param  int|null  $percent     Acerto da tentativa que acabou. null = tentativa sem nota.
     * @param  int       $reviewsDone Quantas revisões já foram feitas (só usado sem data de prova).
     * @param  int       $lapses      Recaídas acumuladas.
     */
    public static function intervalDays(?int $daysToExam, ?int $percent, int $reviewsDone = 0, int $lapses = 0): int
    {
        $config = config('castelei.review');

        $base = $daysToExam !== null
            ? self::proportional($daysToExam, (float) $config['ratio'])
            : self::fallback($reviewsDone, $config['fallback_days']);

        $interval = $base
            * self::performanceFactor($percent, $config['performance'])
            * self::lapseFactor($lapses, (float) $config['lapse_penalty'], (float) $config['lapse_floor']);

        /*
        | Arredonda para CIMA, e isso é a assimetria da crista de Cepeda virando
        | código: passar do ponto ideal custa pouco, ficar aquém custa caro. Na
        | dúvida, espere mais.
        */
        $interval = (int) ceil($interval);

        // Piso de 1 dia: revisão no mesmo dia não é revisão espaçada, é repetir.
        $interval = max(1, $interval);

        /*
        | Teto: nunca depois da prova. Uma revisão marcada para 16/12 é uma
        | revisão que nunca aconteceu. Com a prova em cima, o intervalo vira o
        | que couber — e se não couber mais nada, amanhã.
        */
        if ($daysToExam !== null) {
            $lastUsefulDay = $daysToExam - (int) $config['days_before_exam'];
            $interval = min($interval, max(1, $lastUsefulDay));
        }

        return $interval;
    }

    /**
     * A regra de Cepeda: uma fatia do tempo que falta.
     *
     * É o que faz o cronograma se comprimir sozinho conforme a prova chega, sem
     * ninguém reconfigurar nada.
     */
    private static function proportional(int $daysToExam, float $ratio): float
    {
        return max(0, $daysToExam) * $ratio;
    }

    /**
     * Matéria sem data de prova: escada fixa.
     *
     * Passar do fim da escada repete o último degrau — não multiplica. Intervalo
     * que só cresce acaba mandando a lição para daqui a um ano, que é o mesmo
     * que arquivá-la.
     *
     * @param  list<int>  $ladder
     */
    private static function fallback(int $reviewsDone, array $ladder): float
    {
        $index = min(max(0, $reviewsDone), count($ladder) - 1);

        return (float) $ladder[$index];
    }

    /**
     * Ajuste pelo acerto da última tentativa.
     *
     * A crista de Cepeda descreve material que a pessoa aprendeu. Quem saiu com
     * 40% não aprendeu ainda, e mandar essa pessoa embora por treze dias é
     * agendar o esquecimento em vez de combatê-lo.
     *
     * Tentativa sem nota (ninguém respondeu nada) não é sinal de nada: fica no
     * intervalo neutro em vez de punir.
     *
     * @param  array<int, float>  $table
     */
    private static function performanceFactor(?int $percent, array $table): float
    {
        if ($percent === null) {
            return 1.0;
        }

        $factor = 1.0;
        foreach ($table as $floor => $value) {
            if ($percent >= $floor) {
                $factor = (float) $value;
            }
        }

        return $factor;
    }

    /**
     * Quem erra a mesma lição sempre não deve receber o intervalo de quem
     * acerta, mesmo que acerte desta vez. O corte tem piso: recaída não deve
     * condenar a lição a voltar todo dia para sempre.
     */
    private static function lapseFactor(int $lapses, float $penalty, float $floor): float
    {
        return max($floor, 1.0 - ($penalty * max(0, $lapses)));
    }
}
