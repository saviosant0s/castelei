<?php

namespace App\Support\Review;

use App\Models\Review;
use Illuminate\Support\Collection;

/**
 * O texto do lembrete, longe do envio.
 *
 * Está separado porque é a parte que mais erra ("1 lições", "Faltam 1 dia") e a
 * única que a pessoa lê. Testar isto não exige serviço de push nenhum.
 *
 * Tom: CONVITE, nunca cobrança. Quem tem sete lições atrasadas já se sente mal o
 * bastante; notificação que repreende é notificação desligada, e aí o melhor
 * intervalo do mundo vale zero.
 */
class ReminderText
{
    /**
     * @param  Collection<int, Review>  $vencidas
     * @return array{title: string, body: string}
     */
    public static function build(Collection $vencidas): array
    {
        $quantas = $vencidas->count();
        $maxTitulos = (int) config('castelei.review.reminder.max_titles');

        $titulo = $quantas === 1 ? 'Uma lição esperando revisão' : "{$quantas} lições esperando revisão";

        $nomes = $vencidas
            ->take($maxTitulos)
            ->map(fn (Review $review) => $review->lesson?->title)
            ->filter()
            ->values();

        if ($nomes->isEmpty()) {
            return ['title' => $titulo, 'body' => 'Uns minutos hoje e elas ficam na memória.'];
        }

        $restantes = $quantas - $nomes->count();

        $corpo = $nomes->join(' · ');

        if ($restantes > 0) {
            $corpo .= $restantes === 1 ? ' e mais 1' : " e mais {$restantes}";
        }

        return ['title' => $titulo, 'body' => $corpo];
    }
}
