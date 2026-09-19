<?php

namespace App\Services;

use App\Models\Attempt;
use App\Models\StudyDay;
use App\Models\User;
use App\Models\UserBadge;
use App\Support\Gamification\Badges;
use App\Support\Gamification\Streak;
use DateTimeImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class GamificationService
{
    /** "Hoje" no fuso configurado (Y-m-d). */
    public function today(): string
    {
        return now(config('castelei.timezone'))->toDateString();
    }

    /** Marca hoje como dia de estudo (idempotente). */
    public function recordStudyToday(User $user): void
    {
        try {
            StudyDay::firstOrCreate(['user_id' => $user->id, 'day' => $this->today()]);
        } catch (UniqueConstraintViolationException) {
            // Outra requisição gravou o mesmo dia primeiro: tudo certo.
        }
    }

    /** Soma de XP de todas as respostas do usuário. */
    public function xpTotal(User $user): int
    {
        return (int) DB::table('answers')
            ->join('attempts', 'attempts.id', '=', 'answers.attempt_id')
            ->where('attempts.user_id', $user->id)
            ->sum('answers.xp');
    }

    /** @return array{current: int, longest: int, studied_today: bool} */
    public function streak(User $user): array
    {
        return Streak::compute($this->studyDays($user), $this->today());
    }

    /** Últimos 7 dias (do mais antigo até hoje), marcando os que tiveram estudo. */
    public function week(User $user): array
    {
        $studied = array_flip($this->studyDays($user));
        $today = new DateTimeImmutable($this->today());
        $week = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $today->modify("-{$i} days")->format('Y-m-d');
            $week[] = ['date' => $date, 'studied' => isset($studied[$date])];
        }

        return $week;
    }

    /** Tudo o que a tela de progresso precisa. */
    public function snapshot(User $user): array
    {
        return [
            'xp_total' => $this->xpTotal($user),
            'streak' => $this->streak($user),
            'week' => $this->week($user),
            'badges' => $this->badges($user),
        ];
    }

    /** Catálogo completo, marcando o que o usuário já ganhou. */
    public function badges(User $user): array
    {
        $earned = UserBadge::where('user_id', $user->id)->get()->keyBy('badge');

        return array_map(function (array $badge) use ($earned) {
            $row = $earned->get($badge['key']);

            return $badge + [
                'earned' => $row !== null,
                'earned_at' => $row?->earned_at?->toIso8601String(),
            ];
        }, Badges::all());
    }

    /** Conquistas liberadas durante uma tentativa específica. */
    public function badgesAwardedIn(Attempt $attempt): array
    {
        return UserBadge::where('attempt_id', $attempt->id)
            ->orderBy('id')
            ->pluck('badge')
            ->map(fn (string $key) => Badges::find($key))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Confere as regras de conquista ao terminar uma tentativa e grava as novas.
     *
     * @return list<string> chaves das conquistas liberadas agora
     */
    public function awardBadges(User $user, Attempt $attempt, bool $isRecord): array
    {
        $alreadyHas = UserBadge::where('user_id', $user->id)->pluck('badge')->all();
        $completed = $attempt->answers()->count() >= $attempt->total_questions;

        $earned = [];
        if ($completed) {
            $earned[] = 'primeira-licao';
            if ($attempt->correct_count >= $attempt->total_questions) {
                $earned[] = 'gabarito-limpo';
            }
            if ($isRecord) {
                $earned[] = 'recorde-de-tempo';
            }
            if ($this->completedSubjects($user) >= 2) {
                $earned[] = 'duas-materias';
            }
        }
        if ($this->fixedAPreviousMistake($user, $attempt)) {
            $earned[] = 'virou-o-jogo';
        }

        $longest = $this->streak($user)['longest'];
        foreach ([3, 7, 30] as $days) {
            if ($longest >= $days) {
                $earned[] = "streak-{$days}";
            }
        }

        $xp = $this->xpTotal($user);
        foreach ([500, 1000] as $threshold) {
            if ($xp >= $threshold) {
                $earned[] = "xp-{$threshold}";
            }
        }

        $new = [];
        foreach (array_unique($earned) as $key) {
            if (in_array($key, $alreadyHas, true)) {
                continue;
            }
            try {
                UserBadge::create([
                    'user_id' => $user->id,
                    'badge' => $key,
                    'attempt_id' => $attempt->id,
                    'earned_at' => now(),
                ]);
                $new[] = $key;
            } catch (UniqueConstraintViolationException) {
                // Ganha em outra requisição ao mesmo tempo: ignorar.
            }
        }

        return $new;
    }

    /** @return list<string> */
    private function studyDays(User $user): array
    {
        return StudyDay::where('user_id', $user->id)
            ->pluck('day')
            ->map(fn ($day) => substr((string) $day, 0, 10))
            ->all();
    }

    /** Em quantas matérias diferentes o usuário terminou lições (respondendo todas as questões). */
    private function completedSubjects(User $user): int
    {
        $row = DB::selectOne(
            'SELECT COUNT(DISTINCT l.subject_id) AS total
             FROM attempts a
             JOIN lessons l ON l.id = a.lesson_id
             WHERE a.user_id = ?
               AND a.finished_at IS NOT NULL
               AND a.total_questions = (SELECT COUNT(*) FROM answers x WHERE x.attempt_id = a.id)',
            [$user->id],
        );

        return (int) ($row->total ?? 0);
    }

    /** Nesta tentativa, acertou alguma questão que o usuário já havia errado em tentativa anterior? */
    private function fixedAPreviousMistake(User $user, Attempt $attempt): bool
    {
        $row = DB::selectOne(
            'SELECT 1 AS found
             FROM answers a
             WHERE a.attempt_id = ?
               AND a.is_correct = ?
               AND EXISTS (
                   SELECT 1
                   FROM answers p
                   JOIN attempts pa ON pa.id = p.attempt_id
                   WHERE p.question_id = a.question_id
                     AND p.attempt_id < a.attempt_id
                     AND p.is_correct = ?
                     AND pa.user_id = ?
               )
             LIMIT 1',
            [$attempt->id, true, false, $user->id],
        );

        return $row !== null;
    }
}
