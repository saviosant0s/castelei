<?php

namespace App\Support\Gamification;

/** Catálogo de conquistas. As regras de quando cada uma é liberada ficam no GamificationService. */
final class Badges
{
    /** @return list<array{key: string, name: string, description: string}> */
    public static function all(): array
    {
        return [
            ['key' => 'primeira-licao', 'name' => 'Primeiro passo', 'description' => 'Terminou sua primeira lição.'],
            ['key' => 'gabarito-limpo', 'name' => 'Gabarito limpo', 'description' => 'Acertou todas as questões de uma lição.'],
            ['key' => 'virou-o-jogo', 'name' => 'Virou o jogo', 'description' => 'Acertou uma questão que já tinha errado antes.'],
            ['key' => 'recorde-de-tempo', 'name' => 'Mais rápido que antes', 'description' => 'Bateu seu próprio recorde de tempo médio numa lição.'],
            ['key' => 'duas-materias', 'name' => 'Explorador', 'description' => 'Terminou lições de duas matérias diferentes.'],
            ['key' => 'streak-3', 'name' => 'Três dias seguidos', 'description' => 'Estudou por 3 dias seguidos.'],
            ['key' => 'streak-7', 'name' => 'Semana firme', 'description' => 'Estudou por 7 dias seguidos.'],
            ['key' => 'streak-30', 'name' => 'Mês de constância', 'description' => 'Estudou por 30 dias seguidos.'],
            ['key' => 'xp-500', 'name' => '500 XP', 'description' => 'Juntou 500 pontos de experiência (XP).'],
            ['key' => 'xp-1000', 'name' => '1.000 XP', 'description' => 'Juntou 1.000 pontos de experiência (XP).'],
        ];
    }

    /** @return array{key: string, name: string, description: string}|null */
    public static function find(string $key): ?array
    {
        foreach (self::all() as $badge) {
            if ($badge['key'] === $key) {
                return $badge;
            }
        }

        return null;
    }
}
