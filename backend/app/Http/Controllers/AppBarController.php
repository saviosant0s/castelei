<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Review;
use App\Models\Subject;
use App\Services\GamificationService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

/**
 * O que o cabeçalho fixo e a barra de baixo mostram em toda tela do app.
 *
 * Uma rota própria, e pequena, porque roda em toda navegação: `/progress`
 * agrega todas as respostas da pessoa, e o cabeçalho só precisa de quatro
 * números. Falha aqui nunca derruba a tela (o layout cai num cabeçalho vazio).
 */
class AppBarController extends Controller
{
    public function __construct(private GamificationService $gamification)
    {
    }

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $gami = null;
        if ($user->hasGamification()) {
            try {
                $streak = $this->gamification->streak($user);
                $gami = [
                    'streak' => $streak['current'],
                    'studied_today' => $streak['studied_today'],
                    'xp' => $this->gamification->xpTotal($user),
                ];
            } catch (Throwable $e) {
                report($e);
            }
        }

        // A área da última coisa estudada: é a "matéria do momento" do topo.
        $last = Attempt::query()
            ->where('user_id', $user->id)
            ->with(['lesson.subject', 'subject'])
            ->latest('id')
            ->first();
        $subject = $last?->lesson?->subject ?? $last?->subject;
        $areas = collect(Subject::areas())->keyBy('slug');
        $area = $subject && $subject->isVisibleTo($user) && $areas->has($subject->area)
            ? $areas[$subject->area]
            : null;

        // Revisões vencidas, só das matérias que a pessoa enxerga.
        $visiveis = Subject::visibleTo($user)->pluck('id');
        $vencidas = Review::query()
            ->where('user_id', $user->id)
            ->where('due_at', '<=', CarbonImmutable::now())
            ->whereHas('lesson', fn ($q) => $q->whereIn('subject_id', $visiveis))
            ->count();

        return response()->json([
            'gamification' => $gami,
            'area' => $area,
            'reviews_due' => $vencidas,
        ]);
    }
}
