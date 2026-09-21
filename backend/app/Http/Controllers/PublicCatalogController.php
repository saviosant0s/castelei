<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;

/**
 * O catálogo visto de fora, sem login.
 *
 * Existe para a vitrine (`/materias` e a home) anunciar o que o app tem de
 * verdade, inclusive matéria criada pelo painel — sem isso, publicar uma
 * matéria nova ainda exigiria editar código e publicar o site.
 *
 * Não é o `/subjects` sem tranca: aquele fala de *uma pessoa* (o que ela já
 * praticou, quanto o plano dela libera) e por isso exige sessão. Aqui só sai o
 * que já está escrito na página de divulgação — nome de matéria e título de
 * lição. Nenhum enunciado, nenhum gabarito, nenhum dado de ninguém.
 */
class PublicCatalogController extends Controller
{
    public function index(): JsonResponse
    {
        $subjects = Subject::query()
            ->with(['lessons' => fn ($query) => $query->withCount('questions')])
            ->orderBy('position')
            ->get();

        $lessons = $subjects->flatMap->lessons;
        $contagens = $lessons->pluck('questions_count')->unique();

        return response()->json([
            'subjects' => $subjects->map(fn (Subject $subject) => [
                'slug' => $subject->slug,
                'name' => $subject->name,
                'description' => $subject->description,
                'lessons' => $subject->lessons->map(fn (Lesson $lesson) => $lesson->title)->values(),
            ])->values(),

            'totals' => [
                'subjects' => $subjects->count(),
                'lessons' => $lessons->count(),
                'questions' => (int) $lessons->sum('questions_count'),
            ],

            /*
            | Quantas questões cada lição tem — ou null, quando não é a mesma
            | em todas. A vitrine diz "termina com 8 questões", e essa frase só
            | pode ser dita enquanto for verdade em toda lição. Uma matéria
            | importada com outro número transforma a promessa em mentira, e
            | null é o que avisa a vitrine para não prometer.
            */
            'questions_per_lesson' => $contagens->count() === 1 ? (int) $contagens->first() : null,
        ])->header('Cache-Control', 'public, max-age=300');
    }
}
