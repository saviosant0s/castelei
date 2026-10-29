<?php

namespace App\Http\Middleware;

use App\Models\Lesson;
use App\Models\Subject;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Matéria privada responde 404 para quem não pode vê-la.
 *
 * 404 e não 403: 403 confirmaria que a lição existe. Fica numa tranca só, nas
 * rotas que recebem uma lição ou uma matéria, para nenhuma rota nova esquecer
 * a conferência.
 */
class EnsureContentVisible
{
    public function handle(Request $request, Closure $next): Response
    {
        $subject = $request->route('subject');
        $lesson = $request->route('lesson');

        if ($lesson instanceof Lesson) {
            $subject = $lesson->subject;
        }

        if ($subject instanceof Subject && ! $subject->isVisibleTo($request->user())) {
            abort(404);
        }

        return $next($request);
    }
}
