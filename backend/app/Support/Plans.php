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
    public static function effective(string $plan, bool $realPlan = false): string
    {
        return self::unlockedForEveryone($realPlan) ? 'pro' : $plan;
    }

    /**
     * A fase de testes está liberando tudo? `$realPlan` = a conta está em
     * `real_plan_emails` e enxerga o plano de verdade mesmo assim.
     */
    public static function unlockedForEveryone(bool $realPlan = false): bool
    {
        return ! $realPlan && (bool) config('castelei.unlock_all');
    }

    /** Este e-mail enxerga o plano de verdade mesmo na fase de testes? */
    public static function seesRealPlan(?string $email): bool
    {
        if ($email === null || trim($email) === '') {
            return false;
        }
        $lista = array_filter(array_map(fn ($e) => strtolower(trim($e)), explode(',', (string) config('castelei.real_plan_emails', ''))));

        return in_array(strtolower(trim($email)), $lista, true);
    }

    /** Máximo de questões por lição para o plano; null = ilimitado. */
    public static function questionLimit(string $plan, bool $realPlan = false): ?int
    {
        // `??` não serve aqui: o Pro guarda null de propósito (ilimitado) e cairia no limite do grátis.
        $plan = self::effective($plan, $realPlan);
        $plans = self::all();
        $key = array_key_exists($plan, $plans) ? $plan : config('castelei.default_plan');

        return $plans[$key]['questions_per_lesson'];
    }

    /** Streak, XP e conquistas aparecem para este plano? */
    public static function hasGamification(string $plan, bool $realPlan = false): bool
    {
        return self::unlockedForEveryone($realPlan)
            || (bool) config('castelei.gamification_for_all')
            || (bool) (self::all()[$plan]['gamification'] ?? false);
    }

    /**
     * Criar turma está liberado para este plano? Decisão do Sávio: entrar numa
     * turma é grátis (é como o curso chega a gente nova); criar e acompanhar a
     * turma é o que se paga.
     */
    public static function hasClassrooms(string $plan, bool $realPlan = false): bool
    {
        return self::unlockedForEveryone($realPlan)
            || (bool) (self::all()[$plan]['classrooms'] ?? false);
    }

    /**
     * A correção da redação por IA está liberada? É o recurso que custa por
     * uso, e por isso é do Pro desde que foi ligada.
     */
    public static function hasWritingAi(string $plan, bool $realPlan = false): bool
    {
        return self::unlockedForEveryone($realPlan)
            || (bool) (self::all()[$plan]['writing_ai'] ?? false);
    }

    /**
     * Enxerga as matérias e trilhas exclusivas do Pro (`"visibility": "private"`
     * no arquivo)? Decisão do Sávio: elas nasceram como rascunho só de quem
     * administra e viraram parte do que o Pro oferece.
     */
    public static function hasProSubjects(string $plan, bool $realPlan = false): bool
    {
        return self::unlockedForEveryone($realPlan)
            || (bool) (self::all()[$plan]['pro_subjects'] ?? false);
    }

    /** O simulado está liberado para este plano? */
    public static function hasExam(string $plan, bool $realPlan = false): bool
    {
        return self::unlockedForEveryone($realPlan)
            || (bool) config('castelei.exam_for_all')
            || (bool) (self::all()[$plan]['exam'] ?? false);
    }

    /**
     * Pode abrir qualquer lição da matéria, sem ter visto a anterior? A trava
     * entre lições é do grátis; pular é do Pro (ver Support\Practice\LessonLock).
     */
    public static function canSkipLessons(string $plan, bool $realPlan = false): bool
    {
        return self::unlockedForEveryone($realPlan)
            || (bool) (self::all()[$plan]['skip_lessons'] ?? false);
    }

    /**
     * Pode praticar por nível de dificuldade e receber as questões além das
     * oito? É o mesmo corte do simulado: a parte paga é o Pro.
     */
    public static function hasLevels(string $plan, bool $realPlan = false): bool
    {
        return self::hasExam($plan, $realPlan);
    }
}
