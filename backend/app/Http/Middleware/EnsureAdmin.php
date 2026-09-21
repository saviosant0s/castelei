<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Deixa passar só quem administra o conteúdo.
 *
 * Responde 403, e não 404: quem chegou aqui já está autenticado, e esconder a
 * existência do painel de uma pessoa logada só atrapalha o suporte. Quem não
 * tem sessão nenhuma é barrado antes, pelo auth:sanctum, com 401.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json([
                'message' => 'Esta área é só para quem administra o conteúdo do Castelei.',
            ], 403);
        }

        return $next($request);
    }
}
