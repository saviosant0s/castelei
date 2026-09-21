<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Question;
use App\Models\Subject;
use App\Support\Content\ContentImporter;
use App\Support\Content\ContentValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function show(Lesson $lesson): JsonResponse
    {
        $lesson->load(['subject', 'questions']);

        return response()->json([
            'lesson' => [
                'id' => $lesson->id,
                'slug' => $lesson->slug,
                'title' => $lesson->title,
                'position' => $lesson->position,
                'summary' => $lesson->summary,
                'steps' => $lesson->steps ?? [],
                'subject' => [
                    'id' => $lesson->subject->id,
                    'slug' => $lesson->subject->slug,
                    'name' => $lesson->subject->name,
                    'origin' => $lesson->subject->origin,
                ],
                'questions' => $lesson->questions->map(fn (Question $question) => [
                    'id' => $question->id,
                    'position' => $question->position,
                    'topic' => $question->topic,
                    'statement' => $question->statement,
                    'options' => $question->options,
                    'correct_index' => $question->correct_index,
                    'explanation' => $question->explanation,
                    'pitfall' => $question->pitfall,
                ])->values(),
            ],
        ]);
    }

    public function store(Request $request, Subject $subject): JsonResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'title' => ['required', 'string', 'max:160'],
            'summary' => ['required', 'string'],
            'steps' => ['required', 'array', 'min:1'],
        ], self::messages());

        if ($subject->lessons()->where('slug', $data['slug'])->exists()) {
            return response()->json([
                'message' => 'Esta matéria já tem uma lição com este slug.',
                'errors' => ['slug' => ['Este slug já está em uso nesta matéria.']],
            ], 422);
        }

        if ($erro = $this->stepsProblem($data['steps'])) {
            return $erro;
        }

        $lesson = new Lesson([
            'subject_id' => $subject->id,
            'slug' => $data['slug'],
            'title' => $data['title'],
            'summary' => $data['summary'],
            'steps' => $data['steps'],
            'position' => (int) $subject->lessons()->max('position') + 1,
        ] + ContentImporter::legacyFields($data['steps']));

        $lesson->save();
        $subject->takeOverByPanel();

        return response()->json([
            'lesson' => ['id' => $lesson->id, 'slug' => $lesson->slug, 'title' => $lesson->title],
            'warnings' => $this->stepWarnings($data['steps']),
        ], 201);
    }

    /** O slug fica de fora pelo mesmo motivo que na matéria: é a identidade da lição. */
    public function update(Request $request, Lesson $lesson): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'summary' => ['required', 'string'],
            'steps' => ['required', 'array', 'min:1'],
        ], self::messages());

        if ($erro = $this->stepsProblem($data['steps'])) {
            return $erro;
        }

        $lesson->fill([
            'title' => $data['title'],
            'summary' => $data['summary'],
            'steps' => $data['steps'],
        ] + ContentImporter::legacyFields($data['steps']));

        $lesson->save();
        $lesson->subject->takeOverByPanel();

        return response()->json([
            'lesson' => ['id' => $lesson->id, 'slug' => $lesson->slug, 'title' => $lesson->title],
            'warnings' => $this->stepWarnings($data['steps']),
        ]);
    }

    /**
     * Apaga a lição. As tentativas de quem já estudou caem por cascata no
     * banco, então o título vem digitado na requisição como confirmação.
     */
    public function destroy(Request $request, Lesson $lesson): JsonResponse
    {
        $request->validate(['confirm' => ['required', 'string']], [
            'confirm.required' => 'Digite o título da lição para confirmar.',
        ]);

        if (trim((string) $request->input('confirm')) !== $lesson->title) {
            return response()->json([
                'message' => "Para apagar, digite exatamente o título da lição: {$lesson->title}.",
            ], 422);
        }

        $subject = $lesson->subject;
        $lesson->delete();
        $this->renumber($subject);
        $subject->takeOverByPanel();

        return response()->json(['ok' => true]);
    }

    /**
     * Fecha o buraco deixado por uma lição apagada.
     *
     * A posição é só ordem de exibição — o que identifica a lição é o slug —,
     * mas o importador numera de 1 a N, e um buraco faria a próxima
     * importação parecer que mexeu em tudo.
     */
    private function renumber(Subject $subject): void
    {
        foreach ($subject->lessons()->orderBy('position')->get() as $index => $lesson) {
            $lesson->update(['position' => $index + 1]);
        }
    }

    /**
     * As etapas chegam como JSON solto (é assim que o painel edita), então
     * passam pelo mesmo validador da importação antes de virar lição.
     *
     * @param  array<int, mixed>  $steps
     */
    private function stepsProblem(array $steps): ?JsonResponse
    {
        $resultado = (new ContentValidator)->validate($this->fakeSubject($steps));
        $erros = $this->onlyStepIssues($resultado['errors']);

        if ($erros === []) {
            return null;
        }

        return response()->json([
            'message' => 'As etapas têm '.count($erros).' '.(count($erros) === 1 ? 'problema' : 'problemas').'.',
            'content_errors' => $erros,
        ], 422);
    }

    /**
     * @param  array<int, mixed>  $steps
     * @return list<array{path: string, message: string}>
     */
    private function stepWarnings(array $steps): array
    {
        return $this->onlyStepIssues((new ContentValidator)->validate($this->fakeSubject($steps))['warnings']);
    }

    /**
     * O validador trabalha em cima de uma matéria inteira. Para conferir só as
     * etapas, monta-se uma matéria mínima em volta delas e joga-se fora tudo
     * que não fala de `steps`.
     *
     * @param  array<int, mixed>  $steps
     * @return array<string, mixed>
     */
    private function fakeSubject(array $steps): array
    {
        return [
            'slug' => 'conferencia',
            'name' => 'Conferência',
            'lessons' => [[
                'slug' => 'conferencia',
                'title' => 'Conferência',
                'summary' => 'Conferência',
                'steps' => $steps,
                'questions' => [[
                    'topic' => 'Conferência',
                    'statement' => 'Conferência',
                    'options' => ['a', 'b', 'c', 'd', 'e'],
                    'correct_index' => 0,
                    'explanation' => 'Conferência',
                ]],
            ]],
        ];
    }

    /**
     * @param  list<array{path: string, message: string}>  $issues
     * @return list<array{path: string, message: string}>
     */
    private function onlyStepIssues(array $issues): array
    {
        return array_values(array_map(
            fn (array $issue) => [
                // O caminho volta relativo às etapas: "steps[3].title" em vez de
                // "lessons[0].steps[3].title", que fala de uma lição inventada aqui dentro.
                'path' => preg_replace('/^lessons\[0\]\./', '', $issue['path']) ?? $issue['path'],
                'message' => $issue['message'],
            ],
            array_filter($issues, fn (array $issue) => str_starts_with($issue['path'], 'lessons[0].steps')),
        ));
    }

    /** @return array<string, string> */
    public static function messages(): array
    {
        return [
            'slug.required' => 'Informe o slug da lição.',
            'slug.regex' => 'O slug só aceita letras minúsculas sem acento, números e hífen. Exemplo: memoria-virtual.',
            'title.required' => 'Informe o título da lição.',
            'summary.required' => 'Escreva o resumo de uma frase da lição.',
            'steps.required' => 'A lição precisa de pelo menos uma etapa.',
            'steps.array' => 'As etapas precisam ser uma lista.',
        ];
    }
}
