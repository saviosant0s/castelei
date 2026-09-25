<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Question;
use App\Support\Writing\LanguageCheck;
use App\Support\Writing\WritingReviewer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Throwable;

/**
 * Conferir um texto antes de entregá-lo.
 *
 * Fica separado de responder, de propósito: conferir NÃO grava nada e pode
 * ser feito quantas vezes a pessoa quiser. Escrever, conferir, reescrever e
 * conferir de novo é o exercício inteiro — se conferir gastasse a questão,
 * o app ensinaria a entregar a primeira versão.
 */
class WritingController extends Controller
{
    /**
     * Língua (LanguageTool), texto-modelo e lista de autoavaliação.
     *
     * O modelo só sai daqui: a tela recebe o roteiro antes de escrever e o
     * modelo depois de conferir.
     */
    public function check(Request $request, Attempt $attempt): JsonResponse
    {
        [$question, $texto] = $this->validated($request, $attempt);

        $apontamentos = LanguageCheck::check($texto);
        $writing = $question->writing ?? [];

        return response()->json([
            'language' => [
                // false = o serviço estava fora ou está desligado; a tela diz isso em vez de "nenhum erro".
                'available' => $apontamentos !== null,
                'issues' => $apontamentos ?? [],
            ],
            'model' => $writing['model'] ?? null,
            'checklist' => array_values($writing['checklist'] ?? []),
            'ai' => self::aiEnabled(),
        ]);
    }

    /**
     * O comentário da IA sobre o sentido. Sem chave, a rota não existe.
     *
     * O limite é por pessoa e por dia, e é a trava de custo: a API é paga por
     * uso, e sem ele um botão apertado em sequência (ou um robô) gastaria o
     * crédito inteiro de uma vez.
     */
    public function review(Request $request, Attempt $attempt, WritingReviewer $reviewer): JsonResponse
    {
        abort_unless(self::aiEnabled(), 404);

        [$question, $texto] = $this->validated($request, $attempt);
        abort_if($texto === '', 422, 'Escreva o texto antes de pedir a correção.');

        $chave = 'writing-ai:'.$request->user()->id;
        $limite = max((int) config('castelei.writing.ai.daily_limit'), 0);

        if (RateLimiter::tooManyAttempts($chave, $limite)) {
            return response()->json([
                'message' => "Você já usou as {$limite} correções por IA de hoje. Amanhã tem mais.",
            ], 429);
        }

        RateLimiter::hit($chave, 60 * 60 * 24);

        try {
            $comentario = $reviewer->review($question, $texto);
        } catch (Throwable $e) {
            report($e);
            // Não cobrou nada de útil, então devolve a tentativa do dia.
            RateLimiter::decrement($chave);

            return response()->json(['message' => 'A correção por IA não respondeu agora. Tente de novo daqui a pouco.'], 503);
        }

        return response()->json([
            'feedback' => $comentario,
            'remaining' => RateLimiter::remaining($chave, $limite),
        ]);
    }

    public static function aiEnabled(): bool
    {
        return (string) config('castelei.writing.ai.key') !== ''
            && (int) config('castelei.writing.ai.daily_limit') > 0;
    }

    /** @return array{0: Question, 1: string} */
    private function validated(Request $request, Attempt $attempt): array
    {
        abort_unless((int) $attempt->user_id === (int) $request->user()->id, 404);

        $data = $request->validate([
            'question_id' => ['required', 'integer'],
            'text' => ['nullable', 'string', 'max:'.config('castelei.writing.max_chars')],
        ]);

        abort_unless(in_array((int) $data['question_id'], $attempt->allowedQuestionIds(), true), 422, 'Questão inválida para esta tentativa.');

        $question = Question::findOrFail($data['question_id']);
        abort_unless($question->isWriting(), 422, 'Esta questão não é de escrita.');

        return [$question, trim((string) ($data['text'] ?? ''))];
    }
}
