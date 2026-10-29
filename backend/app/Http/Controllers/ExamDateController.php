<?php

namespace App\Http\Controllers;

use App\Models\ExamDate;
use App\Models\Subject;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * A data da prova, marcada por quem estuda.
 *
 * Decisão do Sávio: quem sabe quando é a prova é a pessoa, e não quem
 * escreve a matéria. É dessa data que sai o ritmo das revisões (Cepeda); sem
 * ela, o FSRS assume.
 */
class ExamDateController extends Controller
{
    public function update(Request $request, Subject $subject): JsonResponse
    {
        $data = $request->validate([
            // Hoje não serve: no dia da prova não há mais revisão para marcar.
            'exam_date' => ['nullable', 'date_format:Y-m-d', 'after:today'],
        ], [
            'exam_date.date_format' => 'Use uma data no formato do calendário.',
            'exam_date.after' => 'A prova precisa ser depois de hoje.',
        ]);

        $user = $request->user();

        if (($data['exam_date'] ?? null) === null) {
            // Apagar a data devolve a matéria ao plano sem prazo.
            ExamDate::where('user_id', $user->id)->where('subject_id', $subject->id)->delete();

            return response()->json(['exam_date' => null, 'days_to_exam' => null]);
        }

        ExamDate::updateOrCreate(
            ['user_id' => $user->id, 'subject_id' => $subject->id],
            ['exam_date' => $data['exam_date']],
        );

        return response()->json([
            'exam_date' => $data['exam_date'],
            'days_to_exam' => ReviewService::daysUntil($data['exam_date']),
        ]);
    }
}
