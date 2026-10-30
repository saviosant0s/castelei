<?php

namespace App\Support\Gamification;

/**
 * O nível sai do XP total, sem coluna nova: é uma conta, não um dado.
 *
 * Cada nível pede 50 XP a mais que o anterior (100, 150, 200…), então o XP
 * para chegar ao nível n é 25·(n−1)·(n+2). Com 20 XP por acerto, a primeira
 * lição bem feita já sobe de nível; do 10 em diante, sobe a cada duas ou três
 * lições. Degrau que cresce sem parar faria o nível travar; degrau fixo faria
 * o número disparar e deixar de querer dizer alguma coisa.
 */
final class Level
{
    /** XP total para chegar ao nível $n (o nível 1 começa no zero). */
    public static function threshold(int $n): int
    {
        return 25 * ($n - 1) * ($n + 2);
    }

    /** @return array{current: int, floor: int, next: int} */
    public static function fromXp(int $xp): array
    {
        $n = 1;
        while (self::threshold($n + 1) <= $xp) {
            $n++;
        }

        return ['current' => $n, 'floor' => self::threshold($n), 'next' => self::threshold($n + 1)];
    }
}
