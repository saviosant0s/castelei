<?php

namespace App\Console\Commands;

use App\Models\PushSubscription;
use App\Models\Review;
use App\Models\User;
use App\Services\PushService;
use App\Services\ReviewService;
use App\Support\Review\ReminderText;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Throwable;

/**
 * O lembrete diário de revisão.
 *
 * O agendamento só vale se a pessoa voltar: um intervalo calculado com 1.354
 * participantes não serve para nada se o app espera em silêncio.
 *
 * Três regras, e todas são sobre NÃO incomodar:
 *
 * 1. Só manda para quem tem lição vencida.
 * 2. No máximo um aviso por dia por aparelho.
 * 3. Não insiste. A crista de Cepeda é assimétrica — chegar um pouco atrasado à
 *    revisão custa pouco —, então cutucar duas vezes só compra desinstalação.
 */
class SendReminders extends Command
{
    protected $signature = 'castelei:lembretes {--seco : mostra o que seria enviado, sem enviar}';

    protected $description = 'Avisa quem tem lição esperando revisão.';

    public function handle(PushService $push, ReviewService $reviews): int
    {
        $seco = (bool) $this->option('seco');

        if (! $push->enabled() && ! $seco) {
            $this->warn('Sem chaves VAPID configuradas: nada a enviar. Rode php artisan castelei:vapid.');

            return self::SUCCESS;
        }

        $hoje = CarbonImmutable::now(config('castelei.timezone'))->startOfDay();
        $avisados = 0;
        $enviados = 0;

        /*
        | Percorre por ASSINATURA e não por usuário, agrupando por dono: é a
        | assinatura que carrega "já foi avisada hoje", porque a pessoa pode ter
        | dois aparelhos e aceitar em um só.
        */
        PushSubscription::query()
            ->with('user')
            /*
            | O OR vai DENTRO de um agrupamento, e isso não é estilo: o
            | `chunkById` acrescenta um `id > ?` à consulta, e num OR solto
            | essa condição grudaria só no segundo lado — viraria
            | "(nunca avisado) OU (avisado antes de hoje E id > X)", que
            | reenvia para todo mundo que nunca foi avisado, a cada página,
            | para sempre.
            */
            ->where(fn ($query) => $query
                ->whereNull('last_notified_at')
                ->orWhere('last_notified_at', '<', $hoje))
            ->chunkById(200, function ($subscriptions) use ($push, $reviews, $seco, &$avisados, &$enviados) {
                foreach ($subscriptions->groupBy('user_id') as $userId => $doUsuario) {
                    $user = $doUsuario->first()->user;

                    if (! $user instanceof User) {
                        continue;
                    }

                    try {
                        $vencidas = $reviews->due($user);

                        if ($vencidas->isEmpty()) {
                            continue;
                        }

                        $avisados++;
                        $texto = ReminderText::build($vencidas);

                        if ($seco) {
                            $this->line("#{$userId}: {$texto['title']} — {$texto['body']}");

                            continue;
                        }

                        $enviados += $push->send($doUsuario, $texto + [
                            // Para onde o toque leva. A fila, não a lição: quem
                            // decide o que estudar é a pessoa, e são várias.
                            'url' => '/revisar',
                            /*
                            | Mesma etiqueta todo dia: se o aviso de ontem ainda
                            | estiver na tela, o de hoje SUBSTITUI em vez de
                            | empilhar. Cinco avisos parados na barra é o que faz
                            | alguém desligar tudo.
                            */
                            'tag' => 'castelei-revisao',
                        ]);
                    } catch (Throwable $e) {
                        // Um usuário com problema não pode parar a fila dos outros.
                        report($e);
                    }
                }
            });

        $this->info($seco
            ? "{$avisados} pessoa(s) receberiam lembrete."
            : "{$avisados} pessoa(s) com revisão vencida, {$enviados} aviso(s) entregue(s).");

        return self::SUCCESS;
    }
}
