<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

/**
 * O cordão que alguém de fora puxa na hora marcada.
 *
 * Existe porque o Railway, no plano em uso, não tem cron: o serviço `backend`
 * atende requisições e ninguém chama `schedule:run`. Quem agenda hoje é o
 * GitHub Actions.
 *
 * Sem `CRON_SECRET` configurado a rota responde 404 — não 403. A diferença
 * importa: 403 confirma que a rota existe e convida a tentar de novo com outro
 * segredo; 404 não conta nada a ninguém.
 */
class CronController extends Controller
{
    public function reminders(Request $request): JsonResponse
    {
        $this->authorizeCaller($request);

        /*
        | Roda o comando em vez de repetir a lógica aqui. Dois caminhos para a
        | mesma decisão viram duas regras diferentes na primeira correção feita
        | em um só — e a regra de quem recebe lembrete é justamente a parte
        | delicada.
        */
        Artisan::call('castelei:lembretes');

        return response()->json([
            'ok' => true,
            'output' => trim(Artisan::output()),
        ]);
    }

    /**
     * Confere o segredo, sem vazar nada pelo caminho.
     *
     * `hash_equals` compara em tempo constante: um `===` comum devolve mais
     * rápido quando o primeiro caractere já difere, e essa diferença de tempo é
     * o bastante para descobrir o segredo letra por letra.
     */
    private function authorizeCaller(Request $request): void
    {
        $esperado = (string) config('castelei.cron.secret');

        // Sem segredo configurado, a função não existe.
        abort_if($esperado === '', 404);

        $recebido = (string) $request->header('X-Castelei-Cron', '');

        abort_unless(hash_equals($esperado, $recebido), 404);
    }
}
