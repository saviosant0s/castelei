<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Services\ReviewService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * "O que eu estudo hoje?"
 *
 * A pergunta que o app não sabia responder. Os dados para responder já
 * existiam — o que faltava era alguém decidir.
 */
class ReviewController extends Controller
{
    /** Quantas revisões vencidas a tela mostra. Lista sem fim vira lista ignorada. */
    private const MAX = 20;

    public function __construct(private ReviewService $reviews)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $due = $this->reviews->due($user, self::MAX);
        $next = $due->isEmpty() ? $this->reviews->next($user) : null;

        return response()->json([
            'due' => $due->map(fn (Review $review) => $this->row($review))->values(),
            'next' => $next ? $this->row($next) : null,
        ]);
    }

    /** @return array<string, mixed> */
    private function row(Review $review): array
    {
        $lesson = $review->lesson;
        $subject = $lesson?->subject;
        $today = CarbonImmutable::now(config('castelei.timezone'))->startOfDay();
        $due = $review->due_at->copy()->setTimezone(config('castelei.timezone'))->startOfDay();

        return [
            'lesson_id' => $lesson?->id,
            'lesson_title' => $lesson?->title,
            'subject_name' => $subject?->name,
            'subject_slug' => $subject?->slug,
            'due_at' => $review->due_at->toIso8601String(),
            /*
            | Positivo = atrasada, negativo = ainda vai vencer. Em dias de
            | calendário, porque é assim que a pessoa conta: quem revisou
            | ontem à noite e abre o app hoje de manhã atrasou "um dia",
            | não "onze horas".
            */
            'days_late' => (int) $due->diffInDays($today, absolute: false),
            'last_percent' => $review->last_percent,
            'interval_days' => $review->interval_days,
            // O que dá sentido ao intervalo na tela: ele é uma fatia disto.
            'days_to_exam' => $this->reviews->daysToExam($subject),
        ];
    }
}
