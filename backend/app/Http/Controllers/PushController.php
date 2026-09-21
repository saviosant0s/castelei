<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Services\PushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Assinatura de lembrete, um aparelho por vez.
 *
 * Sem chaves VAPID configuradas tudo aqui responde 503 de propósito: é melhor a
 * tela saber que a função não existe do que oferecer um botão que não funciona.
 */
class PushController extends Controller
{
    public function __construct(private PushService $push)
    {
    }

    /**
     * A chave pública com que o navegador monta a assinatura.
     *
     * Pública mesmo: ela vai parar no JavaScript de qualquer jeito. O segredo é
     * a privada, que nunca sai do servidor.
     */
    public function key(): JsonResponse
    {
        return response()->json([
            'enabled' => $this->push->enabled(),
            'public_key' => $this->push->enabled() ? $this->push->publicKey() : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($this->push->enabled(), 503, 'Os lembretes ainda não estão configurados neste servidor.');

        $data = $request->validate([
            'endpoint' => ['required', 'string', 'max:2000', 'url'],
            'keys.p256dh' => ['required', 'string', 'max:255'],
            'keys.auth' => ['required', 'string', 'max:255'],
        ], [
            'endpoint.required' => 'Faltou o endereço da assinatura.',
        ]);

        /*
        | `updateOrCreate` pelo resumo do endpoint, e não `create`: o navegador
        | reapresenta a MESMA assinatura a cada visita, e às vezes ela troca de
        | dono (a pessoa sai da conta e entra em outra no mesmo aparelho). Sem
        | isto, o aparelho acumularia linhas e receberia o aviso várias vezes.
        */
        $subscription = PushSubscription::updateOrCreate(
            ['endpoint_hash' => PushSubscription::hashOf($data['endpoint'])],
            [
                'user_id' => $request->user()->id,
                'endpoint' => $data['endpoint'],
                'p256dh' => $data['keys']['p256dh'],
                'auth' => $data['keys']['auth'],
            ],
        );

        return response()->json(['subscribed' => true], $subscription->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Desliga o lembrete neste aparelho.
     *
     * Só apaga assinatura do próprio usuário. Sem isso, saber o endpoint de
     * alguém bastaria para desligar o lembrete dessa pessoa.
     */
    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['endpoint' => ['required', 'string', 'max:2000']]);

        PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint_hash', PushSubscription::hashOf($data['endpoint']))
            ->delete();

        return response()->json(['subscribed' => false]);
    }
}
