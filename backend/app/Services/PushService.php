<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

/**
 * Entrega de notificação pelo padrão Web Push.
 *
 * Sem as chaves VAPID configuradas, tudo aqui é inerte e diz que é: melhor a
 * função não existir do que existir quebrada.
 */
class PushService
{
    /** Há chaves para assinar e mandar? */
    public function enabled(): bool
    {
        return config('castelei.push.public_key') !== ''
            && config('castelei.push.private_key') !== '';
    }

    public function publicKey(): string
    {
        return (string) config('castelei.push.public_key');
    }

    /**
     * Manda uma mensagem para várias assinaturas de uma vez.
     *
     * Assinatura morta (aparelho formatado, app desinstalado, permissão
     * revogada) é APAGADA, não repetida: o serviço de push responde 404 ou 410
     * para ela, e insistir só gasta requisição para sempre.
     *
     * @param  iterable<PushSubscription>  $subscriptions
     * @param  array<string, mixed>  $payload
     * @return int quantas foram entregues
     */
    public function send(iterable $subscriptions, array $payload): int
    {
        if (! $this->enabled()) {
            return 0;
        }

        try {
            $push = new WebPush(['VAPID' => [
                'subject' => (string) config('castelei.push.subject'),
                'publicKey' => $this->publicKey(),
                'privateKey' => (string) config('castelei.push.private_key'),
            ]]);
        } catch (Throwable $e) {
            report($e);

            return 0;
        }

        /** @var array<string, PushSubscription> $porEndpoint */
        $porEndpoint = [];

        foreach ($subscriptions as $subscription) {
            $porEndpoint[$subscription->endpoint] = $subscription;

            try {
                $push->queueNotification(
                    Subscription::create([
                        'endpoint' => $subscription->endpoint,
                        'keys' => ['p256dh' => $subscription->p256dh, 'auth' => $subscription->auth],
                    ]),
                    json_encode($payload, JSON_UNESCAPED_UNICODE),
                );
            } catch (Throwable $e) {
                report($e);
            }
        }

        $entregues = 0;

        foreach ($push->flush() as $report) {
            $endpoint = $report->getRequest()->getUri()->__toString();
            $subscription = $porEndpoint[$endpoint] ?? null;

            if ($report->isSuccess()) {
                $entregues++;
                $subscription?->forceFill(['last_notified_at' => now()])->save();

                continue;
            }

            if ($report->isSubscriptionExpired()) {
                $subscription?->delete();

                continue;
            }

            Log::warning('Lembrete não entregue.', ['motivo' => $report->getReason()]);
        }

        return $entregues;
    }
}
