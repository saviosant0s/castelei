<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\LessonDoubt;
use App\Models\LessonNote;
use App\Models\NoteReview;
use App\Models\Subject;
use App\Support\Content\Vocabulary;
use App\Support\Notes\DoubtAnswerer;
use App\Support\Notes\NoteReviewer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Throwable;

/**
 * Ferramentas de estudo que não são prática: a anotação da lição e a busca.
 */
class StudyToolsController extends Controller
{
    /** Tamanho máximo da anotação. Um caderno, não um trabalho. */
    private const NOTE_MAX = 4000;

    public function showNote(Request $request, Lesson $lesson): JsonResponse
    {
        $note = LessonNote::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->first();

        return response()->json([
            'note' => $note ? ['text' => $note->text, 'updated_at' => $note->updated_at?->toIso8601String()] : null,
            // A tela só mostra "Corrigir minha explicação" quando a correção existe.
            'ai' => self::noteAiEnabled(),
            // A última correção volta junto: rever não pode custar outra.
            'last_review' => NoteReview::where('user_id', $request->user()->id)
                ->where('lesson_id', $lesson->id)->latest('id')->first()?->toPayload(),
        ]);
    }

    /**
     * A IA confere a anotação contra a lição: o que acertou, o que corrigir e
     * o que faltou. Corrige o texto que está NA TELA, mesmo que o salvamento
     * automático ainda não tenha chegado.
     *
     * Sem chave ou desligada, a rota não existe. O limite por pessoa por dia é
     * a trava de custo, e falha da IA devolve a tentativa — mesmo acordo da
     * correção da escrita (`WritingController::review`).
     */
    public function reviewNote(Request $request, Lesson $lesson, NoteReviewer $reviewer): JsonResponse
    {
        abort_unless(self::noteAiEnabled(), 404);

        $data = $request->validate([
            'text' => ['required', 'string', 'min:20', 'max:'.self::NOTE_MAX],
        ], [
            'text.required' => 'Escreva ou fale a sua explicação antes de pedir a correção.',
            'text.min' => 'Escreva um pouco mais antes de pedir a correção: uma ou duas frases já servem.',
        ]);

        $chave = 'note-ai:'.$request->user()->id;
        $limite = (int) config('castelei.notes.ai.daily_limit');

        if (RateLimiter::tooManyAttempts($chave, $limite)) {
            return response()->json([
                'message' => "Você já usou as {$limite} correções de hoje. Amanhã tem mais.",
            ], 429);
        }

        RateLimiter::hit($chave, 60 * 60 * 24);

        try {
            $correcao = $reviewer->review($lesson, trim($data['text']));
        } catch (Throwable $e) {
            report($e);
            RateLimiter::decrement($chave);

            return response()->json(['message' => 'A correção não respondeu agora. Tente de novo daqui a pouco.'], 503);
        }

        $guardada = NoteReview::create([
            'user_id' => $request->user()->id,
            'lesson_id' => $lesson->id,
            'note_text' => trim($data['text']),
            'review' => $correcao,
        ]);

        return response()->json([
            'review' => $correcao,
            'saved' => $guardada->toPayload(),
            'remaining' => RateLimiter::remaining($chave, $limite),
        ]);
    }

    /**
     * Todas as correções da pessoa, da mais nova para a mais antiga, para
     * revisar sem pedir outra. Cem é bem mais do que um semestre de uso.
     */
    public function noteReviews(Request $request): JsonResponse
    {
        $lista = NoteReview::with('lesson.subject')
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (NoteReview $r) => $r->toPayload() + [
                'lesson' => ['id' => $r->lesson->id, 'title' => $r->lesson->title],
                'subject' => ['name' => $r->lesson->subject?->name],
            ]);

        return response()->json(['reviews' => $lista]);
    }

    /** As dúvidas da pessoa nesta lição, da mais nova para a mais antiga. */
    public function doubts(Request $request, Lesson $lesson): JsonResponse
    {
        return response()->json([
            'ai' => self::noteAiEnabled(),
            'doubts' => LessonDoubt::where('user_id', $request->user()->id)
                ->where('lesson_id', $lesson->id)->latest('id')->limit(20)->get()
                ->map(fn (LessonDoubt $d) => $d->toPayload())->values(),
        ]);
    }

    /**
     * Tirar uma dúvida: a IA responde com a lição inteira junto.
     *
     * Mesmas travas da correção (`reviewNote`): sem chave a rota não existe,
     * há limite por pessoa por dia, e falha da IA devolve a tentativa.
     */
    public function askDoubt(Request $request, Lesson $lesson, DoubtAnswerer $answerer): JsonResponse
    {
        abort_unless(self::noteAiEnabled(), 404);

        $data = $request->validate([
            'question' => ['required', 'string', 'min:5', 'max:1000'],
        ], [
            'question.required' => 'Escreva ou fale a sua dúvida antes de perguntar.',
            'question.min' => 'Escreva um pouco mais a sua dúvida.',
            'question.max' => 'A dúvida passou de 1000 caracteres. Tente dividir em duas.',
        ]);

        $chave = 'doubt-ai:'.$request->user()->id;
        $limite = (int) config('castelei.notes.ai.doubt_daily_limit');

        if ($limite <= 0 || RateLimiter::tooManyAttempts($chave, $limite)) {
            return response()->json([
                'message' => "Você já tirou as {$limite} dúvidas de hoje. Amanhã tem mais.",
            ], 429);
        }

        RateLimiter::hit($chave, 60 * 60 * 24);

        try {
            $resposta = $answerer->answer($lesson, trim($data['question']));
        } catch (Throwable $e) {
            report($e);
            RateLimiter::decrement($chave);

            return response()->json(['message' => 'A resposta não veio agora. Tente de novo daqui a pouco.'], 503);
        }

        $duvida = LessonDoubt::create([
            'user_id' => $request->user()->id,
            'lesson_id' => $lesson->id,
            'question' => trim($data['question']),
            'answer' => $resposta,
        ]);

        return response()->json([
            'doubt' => $duvida->toPayload(),
            'remaining' => RateLimiter::remaining($chave, $limite),
        ]);
    }

    /** Todas as dúvidas da pessoa, para rever sem perguntar de novo. */
    public function allDoubts(Request $request): JsonResponse
    {
        $lista = LessonDoubt::with('lesson.subject')
            ->where('user_id', $request->user()->id)
            ->latest('id')->limit(100)->get()
            ->map(fn (LessonDoubt $d) => $d->toPayload() + [
                'lesson' => ['id' => $d->lesson->id, 'title' => $d->lesson->title],
                'subject' => ['name' => $d->lesson->subject?->name],
            ]);

        return response()->json(['doubts' => $lista]);
    }

    public static function noteAiEnabled(): bool
    {
        return (string) config('castelei.notes.ai.key') !== ''
            && (bool) config('castelei.notes.ai.enabled')
            && (int) config('castelei.notes.ai.daily_limit') > 0;
    }

    /**
     * Guarda a anotação. Texto vazio APAGA — assim "limpar a caixa" faz o que
     * parece fazer, e não sobra uma anotação vazia marcando a lição.
     */
    public function saveNote(Request $request, Lesson $lesson): JsonResponse
    {
        $data = $request->validate([
            'text' => ['nullable', 'string', 'max:'.self::NOTE_MAX],
        ], ['text.max' => 'A anotação passou de '.self::NOTE_MAX.' caracteres.']);

        $texto = trim((string) ($data['text'] ?? ''));
        $chave = ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id];

        if ($texto === '') {
            LessonNote::where($chave)->delete();

            return response()->json(['note' => null]);
        }

        $note = LessonNote::updateOrCreate($chave, ['text' => $texto]);

        return response()->json([
            'note' => ['text' => $note->text, 'updated_at' => $note->updated_at?->toIso8601String()],
        ]);
    }

    /**
     * Busca em todas as matérias: lições (título e resumo), palavras do
     * vocabulário (a palavra e o significado) e as anotações da pessoa.
     *
     * Sem índice de busca, de propósito: são dezenas de lições, e comparar
     * texto sem acento em memória é instantâneo nesse tamanho. Um motor de
     * busca seria mais um serviço para manter e mais uma coisa para cair.
     */
    public function search(Request $request): JsonResponse
    {
        $termo = self::sem_acento(trim((string) $request->query('q', '')));

        if (mb_strlen($termo) < 2) {
            return response()->json(['query' => $termo, 'lessons' => [], 'terms' => [], 'notes' => []]);
        }

        $subjects = Subject::visibleTo($request->user())->with('lessons')->orderBy('position')->get();
        $casa = fn (?string $texto) => $texto !== null && str_contains(self::sem_acento($texto), $termo);

        $lessons = [];
        $terms = [];

        foreach ($subjects as $subject) {
            foreach ($subject->lessons as $lesson) {
                if ($casa($lesson->title) || $casa($lesson->summary)) {
                    $lessons[] = [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'summary' => $lesson->summary,
                        'subject' => ['slug' => $subject->slug, 'name' => $subject->name],
                    ];
                }
            }

            foreach (Vocabulary::fromLessons($subject->lessons) as $term) {
                if ($casa($term['word']) || $casa($term['meaning'])) {
                    // A palavra vale mais que o significado: quem busca "tese" quer o verbete "tese" primeiro.
                    $terms[] = $term + [
                        'subject' => ['slug' => $subject->slug, 'name' => $subject->name],
                        '_rank' => $casa($term['word']) ? 0 : 1,
                    ];
                }
            }
        }

        usort($terms, fn ($a, $b) => $a['_rank'] <=> $b['_rank']);
        $terms = array_map(fn ($t) => array_diff_key($t, ['_rank' => true]), array_slice($terms, 0, 30));

        $notes = LessonNote::with('lesson.subject')
            ->where('user_id', $request->user()->id)
            ->get()
            ->filter(fn (LessonNote $n) => $casa($n->text))
            ->map(fn (LessonNote $n) => [
                'lesson' => ['id' => $n->lesson->id, 'title' => $n->lesson->title],
                'subject' => ['name' => $n->lesson->subject->name],
                'excerpt' => Str::limit($n->text, 160),
            ])
            ->values()
            ->all();

        return response()->json([
            'query' => $termo,
            'lessons' => array_slice($lessons, 0, 20),
            'terms' => $terms,
            'notes' => $notes,
        ]);
    }

    /** "Índice" e "indice" são a mesma busca. */
    private static function sem_acento(string $texto): string
    {
        return mb_strtolower(Str::ascii($texto));
    }
}
