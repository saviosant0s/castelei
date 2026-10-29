<?php

namespace App\Support\Review;

/**
 * O FSRS (Free Spaced Repetition Scheduler), versão 4.5, com os parâmetros
 * padrão publicados pelo projeto.
 *
 * Ele entra só quando a pessoa NÃO marcou data de prova. Com data, quem manda
 * é a proporção de Cepeda (ver Spacing), porque para prazo conhecido aquele é
 * o resultado direto. Sem data, o problema vira "lembrar para sempre", e é
 * exatamente o que o FSRS resolve — melhor que a escada fixa de 1, 3, 7, 16 e
 * 30 dias que havia aqui, porque aprende com cada lição de cada pessoa.
 *
 * O estado da memória de uma lição são dois números:
 * - estabilidade (S): em quantos dias a chance de lembrar cai para 90%;
 * - dificuldade (D): de 1 a 10, o quanto a lição custa para esta pessoa.
 *
 * A nota que o FSRS espera (1 a 4) sai do acerto da tentativa.
 */
class Fsrs
{
    /** Parâmetros padrão do FSRS-4.5. */
    private const W = [
        0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
        0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
    ];

    private const DECAY = -0.5;

    private const FACTOR = 19 / 81;

    /** Chance de lembrar que o agendamento mira na hora da revisão. */
    public const RETENTION = 0.9;

    /** Teto do intervalo: revisão para daqui a mais de um ano é lição arquivada. */
    public const MAX_DAYS = 365;

    /**
     * Do acerto (0 a 100) para a nota do FSRS: 1 errei, 2 difícil, 3 bom, 4 fácil.
     * Tentativa sem nota conta como "bom", sem punir nem premiar.
     */
    public static function grade(?int $percent): int
    {
        return match (true) {
            $percent === null => 3,
            $percent < 50 => 1,
            $percent < 70 => 2,
            $percent < 90 => 3,
            default => 4,
        };
    }

    /** A chance de lembrar depois de $days dias, com estabilidade $s. */
    public static function retrievability(float $days, float $s): float
    {
        return (1 + self::FACTOR * max(0.0, $days) / max($s, 0.01)) ** self::DECAY;
    }

    /**
     * O novo estado depois de uma revisão.
     *
     * @return array{stability: float, difficulty: float}
     */
    public static function next(?float $s, ?float $d, int $grade, float $elapsedDays): array
    {
        $w = self::W;

        if ($s === null || $d === null) {
            return ['stability' => max($w[$grade - 1], 0.1), 'difficulty' => self::initialDifficulty($grade)];
        }

        $r = self::retrievability($elapsedDays, $s);

        if ($grade === 1) {
            // Esqueceu: a memória recomeça menor, mas não do zero.
            $novo = $w[11] * $d ** (-$w[12]) * (($s + 1) ** $w[13] - 1) * exp($w[14] * (1 - $r));
            $novo = min($novo, $s);
        } else {
            $hard = $grade === 2 ? $w[15] : 1.0;
            $easy = $grade === 4 ? $w[16] : 1.0;
            $novo = $s * (1 + exp($w[8]) * (11 - $d) * $s ** (-$w[9]) * (exp($w[10] * (1 - $r)) - 1) * $hard * $easy);
        }

        // A dificuldade anda com a nota e volta devagar para a média.
        $dif = $d - $w[6] * ($grade - 3);
        $dif = $w[7] * self::initialDifficulty(4) + (1 - $w[7]) * $dif;

        return ['stability' => max($novo, 0.1), 'difficulty' => self::clamp($dif)];
    }

    /** Em quantos dias a chance de lembrar cai para a meta (90%). */
    public static function intervalDays(float $s): int
    {
        $dias = $s / self::FACTOR * (self::RETENTION ** (1 / self::DECAY) - 1);

        return (int) min(self::MAX_DAYS, max(1, round($dias)));
    }

    private static function initialDifficulty(int $grade): float
    {
        return self::clamp(self::W[4] - exp(self::W[5] * ($grade - 1)) + 1);
    }

    private static function clamp(float $d): float
    {
        return min(10.0, max(1.0, $d));
    }
}
