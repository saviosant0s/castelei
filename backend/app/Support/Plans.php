<?php

namespace App\Support;

class Plans
{
    /** @return array<string, array{label: string, questions_per_lesson: int|null}> */
    public static function all(): array
    {
        return config('castelei.plans');
    }

    public static function exists(string $plan): bool
    {
        return array_key_exists($plan, self::all());
    }

    public static function label(string $plan): string
    {
        return self::all()[$plan]['label'] ?? ucfirst($plan);
    }

    /**
     * O plano que vale na prática. Durante a fase de testes (`unlock_all`),
     * todo mundo estuda como Pro — o plano guardado no usuário fica intacto,
     * então basta desligar a chave para os limites voltarem.
     */
    public static function effective(string $plan): string
    {
        return config('castelei.unlock_all') ? 'pro' : $plan;
    }

    /** A fase de testes está liberando tudo para todo mundo? */
    public static function unlockedForEveryone(): bool
    {
        return (bool) config('castelei.unlock_all');
    }

    /** Máximo de questões por lição para o plano; null = ilimitado. */
    public static function questionLimit(string $plan): ?int
    {
        // `??` não serve aqui: o Pro guarda null de propósito (ilimitado) e cairia no limite do grátis.
        $plan = self::effective($plan);
        $plans = self::all();
        $key = array_key_exists($plan, $plans) ? $plan : config('castelei.default_plan');

        return $plans[$key]['questions_per_lesson'];
    }

    /** Streak, XP e conquistas aparecem para este plano? */
    public static function hasGamification(string $plan): bool
    {
        return self::unlockedForEveryone()
            || (bool) config('castelei.gamification_for_all')
            || (bool) (self::all()[$plan]['gamification'] ?? false);
    }

    /** O simulado está liberado para este plano? */
    public static function hasExam(string $plan): bool
    {
        return self::unlockedForEveryone()
            || (bool) config('castelei.exam_for_all')
            || (bool) (self::all()[$plan]['exam'] ?? false);
    }
}
