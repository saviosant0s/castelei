<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\LessonNote;
use App\Models\Subject;
use App\Support\Content\Vocabulary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
        ]);
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

        $subjects = Subject::with('lessons')->orderBy('position')->get();
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
