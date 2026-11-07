<?php

namespace App\Support\Practice;

use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * A trava entre as lições de uma matéria.
 *
 * Decisão do Sávio (novembro de 2026): dentro da matéria a lição seguinte só
 * abre depois de ver a anterior, porque ali é uma coisa só — não dá para
 * entender a lição 5 sem a 4. Entre matérias e entre áreas, nada tranca: a
 * ordem orienta, e ninguém é obrigado a estudar o que já sabe.
 *
 * Três regras, nesta ordem:
 * - Quem é Pro (ou administra) pula. É parte do que o plano pago oferece.
 * - "Ver" é ler a lição até o fim OU praticá-la: quem já sabe vai direto às
 *   questões e não deve ser forçado a reler.
 * - O que a pessoa já fez nunca tranca. Quem praticou a 7 antes desta regra
 *   existir continua com a 7 aberta, mesmo sem ter feito a 6.
 */
final class LessonLock
{
    /**
     * As lições vistas (lidas até o fim ou praticadas), entre as pedidas.
     *
     * @param  list<int>  $lessonIds
     * @return array<int, true>
     */
    public static function seen(int $userId, array $lessonIds): array
    {
        if ($lessonIds === []) {
            return [];
        }

        $lidas = DB::table('lesson_reads')->where('user_id', $userId)->whereIn('lesson_id', $lessonIds)->pluck('lesson_id');
        $praticadas = Attempt::where('user_id', $userId)->whereIn('lesson_id', $lessonIds)->whereNotNull('finished_at')->pluck('lesson_id');

        return $lidas->merge($praticadas)->unique()->mapWithKeys(fn ($id) => [(int) $id => true])->all();
    }

    /**
     * Quais lições estão trancadas, cada uma com a anterior que falta ver.
     *
     * @param  iterable<Lesson>  $lessons  na ordem da matéria
     * @param  array<int, true>  $seen
     * @return array<int, Lesson>
     */
    public static function lockedIn(iterable $lessons, array $seen): array
    {
        $trancadas = [];
        $anterior = null;

        foreach ($lessons as $lesson) {
            if ($anterior !== null && ! isset($seen[$lesson->id]) && ! isset($seen[$anterior->id])) {
                $trancadas[$lesson->id] = $anterior;
            }
            $anterior = $lesson;
        }

        return $trancadas;
    }

    /** A lição anterior que falta ver para abrir esta; nula se ela está aberta. */
    public static function missingFor(User $user, Lesson $lesson): ?Lesson
    {
        if ($user->canSkipLessons()) {
            return null;
        }

        $anterior = Lesson::where('subject_id', $lesson->subject_id)
            ->where('position', '<', $lesson->position)
            ->orderByDesc('position')
            ->first();
        if (! $anterior) {
            return null;
        }

        $seen = self::seen($user->id, [$anterior->id, $lesson->id]);

        return isset($seen[$anterior->id]) || isset($seen[$lesson->id]) ? null : $anterior;
    }
}
