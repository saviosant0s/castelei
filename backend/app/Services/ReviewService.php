<?php

namespace App\Services;

use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\Review;
use App\Models\Subject;
use App\Models\User;
use App\Support\Review\Spacing;
use Carbon\CarbonImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Collection;

/**
 * Agenda e lê as revisões.
 *
 * A decisão de QUANDO mora em App\Support\Review\Spacing, com a justificativa
 * científica. Aqui fica o encanamento: ler a data da prova, gravar a linha e
 * responder "o que vence hoje".
 */
class ReviewService
{
    /**
     * Marca o próximo encontro com esta lição depois de uma tentativa terminada.
     *
     * Idempotente por (aluno, lição): terminar a mesma tentativa duas vezes não
     * cria duas linhas, e praticar de novo reagenda a que já existe.
     */
    public function schedule(User $user, Attempt $attempt): ?Review
    {
        $lesson = $attempt->lesson;

        // Simulado atravessa várias lições e não tem lição própria para marcar.
        if ($lesson === null) {
            return null;
        }

        $percent = $this->percentOf($attempt);
        $existing = Review::where('user_id', $user->id)->where('lesson_id', $lesson->id)->first();

        $lapses = (int) ($existing->lapses ?? 0);
        if ($percent !== null && $percent < (int) config('castelei.review.lapse_below')) {
            $lapses++;
        }

        $days = Spacing::intervalDays(
            daysToExam: $this->daysToExam($lesson->subject),
            percent: $percent,
            reviewsDone: $existing ? $this->ladderStep($existing) : 0,
            lapses: $lapses,
        );

        $now = CarbonImmutable::now();

        $values = [
            'due_at' => $now->addDays($days),
            'reviewed_at' => $now,
            'last_percent' => $percent,
            'interval_days' => $days,
            'lapses' => $lapses,
        ];

        try {
            return Review::updateOrCreate(
                ['user_id' => $user->id, 'lesson_id' => $lesson->id],
                $values,
            );
        } catch (UniqueConstraintViolationException) {
            // Duas requisições terminaram junto: a outra gravou, e serve.
            return Review::where('user_id', $user->id)->where('lesson_id', $lesson->id)->first();
        }
    }

    /** A revisão já marcada para a lição desta tentativa, sem mexer em nada. */
    public function for(User $user, Attempt $attempt): ?Review
    {
        if ($attempt->lesson_id === null) {
            return null;
        }

        return Review::where('user_id', $user->id)->where('lesson_id', $attempt->lesson_id)->first();
    }

    /**
     * Lições vencidas, da mais atrasada para a mais recente.
     *
     * "Vencida" é `due_at` no passado. Não há tolerância de horas: o dia da
     * pessoa não começa às 00h00 e atrasar meio dia não muda nada — a crista de
     * Cepeda é larga justamente por isso.
     *
     * @return Collection<int, Review>
     */
    public function due(User $user, ?int $limit = null): Collection
    {
        $query = Review::query()
            ->with('lesson.subject')
            ->where('user_id', $user->id)
            ->where('due_at', '<=', CarbonImmutable::now())
            ->orderBy('due_at');

        if ($limit !== null) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /** A próxima revisão marcada, quando não há nenhuma vencida. */
    public function next(User $user): ?Review
    {
        return Review::query()
            ->with('lesson.subject')
            ->where('user_id', $user->id)
            ->where('due_at', '>', CarbonImmutable::now())
            ->orderBy('due_at')
            ->first();
    }

    /**
     * Dias entre hoje e a prova da matéria. null = matéria sem data marcada.
     *
     * Conta em dias de calendário no fuso do aluno, não em horas: "faltam 13
     * dias" não pode virar 12 porque a conta rodou às 23h.
     */
    public function daysToExam(?Subject $subject): ?int
    {
        if ($subject?->exam_date === null) {
            return null;
        }

        $timezone = config('castelei.timezone');
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $exam = CarbonImmutable::parse($subject->exam_date->format('Y-m-d'), $timezone)->startOfDay();

        $days = $today->diffInDays($exam, absolute: false);

        // Prova já passou: a matéria volta ao plano de longo prazo.
        return $days > 0 ? (int) $days : null;
    }

    /** Acerto em porcentagem da tentativa, ou null se ela não tem questões contadas. */
    private function percentOf(Attempt $attempt): ?int
    {
        if (! $attempt->total_questions) {
            return null;
        }

        return (int) round($attempt->correct_count * 100 / $attempt->total_questions);
    }

    /**
     * Em que degrau da escada de longo prazo esta lição está.
     *
     * Só vale para matéria sem data de prova. Usa o intervalo anterior para
     * descobrir o degrau em vez de guardar um contador: assim, mudar a escada na
     * configuração não deixa linhas antigas apontando para um degrau que sumiu.
     */
    private function ladderStep(Review $review): int
    {
        $ladder = config('castelei.review.fallback_days');

        foreach ($ladder as $index => $days) {
            if ($review->interval_days <= $days) {
                return $index + 1;
            }
        }

        return count($ladder) - 1;
    }
}
