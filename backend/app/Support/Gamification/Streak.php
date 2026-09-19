<?php

namespace App\Support\Gamification;

use DateTimeImmutable;

/**
 * Cálculo puro do streak (dias seguidos estudando). Sem banco, sem framework.
 *
 * Regras:
 * - O streak atual conta os dias seguidos terminando HOJE. Se hoje ainda não teve estudo mas
 *   ontem teve, o streak continua vivo (a pessoa ainda pode estudar hoje) e conta até ontem.
 * - Se nem hoje nem ontem tiveram estudo, o streak atual é 0.
 */
final class Streak
{
    /**
     * @param  list<string>  $days  datas locais (Y-m-d) com estudo; qualquer ordem, pode repetir
     * @param  string  $today  data local de hoje (Y-m-d)
     * @return array{current: int, longest: int, studied_today: bool}
     */
    public static function compute(array $days, string $today): array
    {
        $set = array_flip(array_unique($days));
        $todayDate = new DateTimeImmutable($today);
        $yesterday = $todayDate->modify('-1 day')->format('Y-m-d');

        $studiedToday = isset($set[$today]);
        $cursor = $studiedToday ? $today : (isset($set[$yesterday]) ? $yesterday : null);

        $current = 0;
        if ($cursor !== null) {
            $date = new DateTimeImmutable($cursor);
            while (isset($set[$date->format('Y-m-d')])) {
                $current++;
                $date = $date->modify('-1 day');
            }
        }

        $sorted = array_keys($set);
        sort($sorted);
        $longest = 0;
        $run = 0;
        $previous = null;
        foreach ($sorted as $day) {
            $continues = $previous !== null
                && (new DateTimeImmutable($previous))->modify('+1 day')->format('Y-m-d') === $day;
            $run = $continues ? $run + 1 : 1;
            $longest = max($longest, $run);
            $previous = $day;
        }

        return [
            'current' => $current,
            'longest' => max($longest, $current),
            'studied_today' => $studiedToday,
        ];
    }
}
