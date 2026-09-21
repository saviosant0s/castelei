<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    public function index(): JsonResponse
    {
        $subjects = Subject::query()
            ->withCount('lessons')
            ->with(['lessons' => fn ($query) => $query->withCount('questions')])
            ->orderBy('position')
            ->get();

        return response()->json([
            'subjects' => $subjects->map(fn (Subject $subject) => [
                'id' => $subject->id,
                'slug' => $subject->slug,
                'name' => $subject->name,
                'description' => $subject->description,
                'exam_date' => $subject->exam_date?->format('Y-m-d'),
                'position' => $subject->position,
                'origin' => $subject->origin,
                'lessons_count' => $subject->lessons_count,
                'questions_count' => $subject->lessons->sum('questions_count'),
            ])->values(),
        ]);
    }

    public function show(Subject $subject): JsonResponse
    {
        $subject->load(['lessons' => fn ($query) => $query->withCount('questions')]);

        return response()->json([
            'subject' => [
                'id' => $subject->id,
                'slug' => $subject->slug,
                'name' => $subject->name,
                'description' => $subject->description,
                'exam_date' => $subject->exam_date?->format('Y-m-d'),
                'position' => $subject->position,
                'origin' => $subject->origin,
                'lessons' => $subject->lessons->map(fn (Lesson $lesson) => [
                    'id' => $lesson->id,
                    'slug' => $lesson->slug,
                    'title' => $lesson->title,
                    'position' => $lesson->position,
                    'module' => $lesson->module,
                    'summary' => $lesson->summary,
                    'steps_count' => count($lesson->steps ?? []),
                    'questions_count' => $lesson->questions_count,
                ])->values(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:subjects,slug'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'exam_date' => ['nullable', 'date_format:Y-m-d'],
        ], self::messages());

        $subject = Subject::create($data + [
            'position' => (int) Subject::max('position') + 1,
            'origin' => 'painel',
        ]);

        return response()->json(['subject' => $this->brief($subject)], 201);
    }

    /**
     * O slug não entra aqui de propósito.
     *
     * Ele é a identidade da matéria: é por ele que o importador reencontra o
     * que já existe. Trocá-lo não renomearia a matéria — criaria outra na
     * importação seguinte e deixaria a antiga para trás, com as tentativas
     * dos alunos presas nela.
     */
    public function update(Request $request, Subject $subject): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            /*
            | Data da prova: o agendamento de revisão calcula o intervalo como
            | uma fatia do tempo que falta até ela. Mexer aqui muda o calendário
            | de estudo de todo mundo que faz a matéria.
            */
            'exam_date' => ['nullable', 'date_format:Y-m-d'],
        ], self::messages());

        $subject->fill($data);
        $subject->origin = 'painel';
        $subject->save();

        return response()->json(['subject' => $this->brief($subject)]);
    }

    /** Reordena as lições. Recebe os ids na ordem em que devem aparecer. */
    public function reorder(Request $request, Subject $subject): JsonResponse
    {
        $data = $request->validate([
            'lessons' => ['required', 'array', 'min:1'],
            // `distinct` não é detalhe: sem ele, [7, 7] passa na contagem e o
            // resultado é uma lição em dois lugares e outra fora da lista.
            'lessons.*' => ['integer', 'distinct', Rule::exists('lessons', 'id')->where('subject_id', $subject->id)],
        ], [
            'lessons.required' => 'Informe a nova ordem das lições.',
            'lessons.*.distinct' => 'A mesma lição aparece duas vezes na nova ordem.',
            'lessons.*.exists' => 'Uma das lições não pertence a esta matéria.',
        ]);

        $ids = $data['lessons'];

        if (count($ids) !== $subject->lessons()->count()) {
            return response()->json([
                'message' => 'A nova ordem precisa listar todas as lições da matéria, uma única vez cada.',
            ], 422);
        }

        foreach ($ids as $index => $id) {
            Lesson::where('id', $id)->update(['position' => $index + 1]);
        }

        $subject->takeOverByPanel();

        return response()->json(['ok' => true]);
    }

    /**
     * Apaga a matéria inteira. Leva junto lições, questões e — por cascata no
     * banco — as tentativas e respostas de quem já estudou. Por isso exige que
     * o nome da matéria venha digitado na requisição.
     */
    public function destroy(Request $request, Subject $subject): JsonResponse
    {
        $request->validate([
            'confirm' => ['required', 'string'],
        ], ['confirm.required' => 'Digite o nome da matéria para confirmar.']);

        if (trim((string) $request->input('confirm')) !== $subject->name) {
            return response()->json([
                'message' => "Para apagar, digite exatamente o nome da matéria: {$subject->name}.",
            ], 422);
        }

        $subject->delete();

        return response()->json(['ok' => true]);
    }

    /** @return array<string, mixed> */
    private function brief(Subject $subject): array
    {
        return [
            'id' => $subject->id,
            'slug' => $subject->slug,
            'name' => $subject->name,
            'description' => $subject->description,
            'exam_date' => $subject->exam_date?->format('Y-m-d'),
            'position' => $subject->position,
            'origin' => $subject->origin,
        ];
    }

    /** @return array<string, string> */
    public static function messages(): array
    {
        return [
            'slug.required' => 'Informe o slug (o endereço curto da matéria).',
            'slug.regex' => 'O slug só aceita letras minúsculas sem acento, números e hífen. Exemplo: sistemas-operacionais.',
            'slug.unique' => 'Já existe uma matéria com este slug.',
            'name.required' => 'Informe o nome da matéria.',
            'name.max' => 'O nome ficou longo demais.',
            'exam_date.date_format' => 'A data da prova precisa estar no formato AAAA-MM-DD. Exemplo: 2026-12-15.',
        ];
    }
}
