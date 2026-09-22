<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function store(Request $request, Lesson $lesson): JsonResponse
    {
        $data = $this->validated($request);

        $question = Question::create($data + [
            'lesson_id' => $lesson->id,
            'position' => (int) $lesson->questions()->max('position') + 1,
        ]);

        $lesson->subject->takeOverByPanel();

        return response()->json(['question' => $this->payload($question)], 201);
    }

    public function update(Request $request, Question $question): JsonResponse
    {
        $question->fill($this->validated($request));
        $question->save();

        $question->lesson->subject->takeOverByPanel();

        return response()->json(['question' => $this->payload($question)]);
    }

    /**
     * Apaga a questão e fecha o buraco na numeração.
     *
     * Renumerar aqui é seguro: as respostas já dadas apontam para o id da
     * questão, não para a posição. Sem renumerar, a próxima importação —
     * que numera de 1 a N — gravaria a questão seguinte por cima do buraco.
     */
    public function destroy(Question $question): JsonResponse
    {
        $lesson = $question->lesson;
        $question->delete();

        foreach ($lesson->questions()->orderBy('position')->get() as $index => $restante) {
            $restante->update(['position' => $index + 1]);
        }

        $lesson->subject->takeOverByPanel();

        return response()->json(['ok' => true]);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'topic' => ['required', 'string', 'max:120'],
            'statement' => ['required', 'string'],
            'options' => ['required_unless:format,match', 'array', 'min:2', 'max:8'],
            'options.*' => ['required', 'string'],
            'format' => ['nullable', 'string', 'in:choice,order,match'],
            'pairs' => ['required_if:format,match', 'array', 'min:3', 'max:5'],
            'pairs.*.left' => ['required', 'string', 'max:120'],
            'pairs.*.right' => ['required', 'string', 'max:120'],
            // Na questão de ordenar não existe alternativa certa: o gabarito
            // é a ordem em que as opções foram escritas.
            'correct_index' => ['required_unless:format,order', 'integer', 'min:0'],
            'explanation' => ['required', 'string'],
            'pitfall' => ['nullable', 'string'],
        ], [
            'topic.required' => 'Informe o tópico da questão (é o que aparece no seu progresso).',
            'statement.required' => 'Escreva o enunciado.',
            'options.required' => 'A questão precisa de alternativas.',
            'options.min' => 'A questão precisa de pelo menos duas alternativas.',
            'options.*.required' => 'Nenhuma alternativa pode ficar em branco.',
            'correct_index.required' => 'Marque qual alternativa é a certa.',
            'explanation.required' => 'Escreva a explicação que aparece depois da resposta.',
        ]);

        $data['format'] = $data['format'] ?? Question::FORMAT_CHOICE;

        if ($data['format'] === Question::FORMAT_MATCH) {
            $esquerda = array_map(fn (array $par) => trim($par['left']), $data['pairs']);
            $direita = array_map(fn (array $par) => trim($par['right']), $data['pairs']);

            if (count(array_unique($esquerda)) !== count($esquerda) || count(array_unique($direita)) !== count($direita)) {
                abort(response()->json([
                    'message' => 'Há itens repetidos numa das colunas. Com repetidos, a questão fica impossível de acertar com certeza.',
                    'errors' => ['pairs' => ['Itens repetidos.']],
                ], 422));
            }

            // A questão de associar não tem alternativas nem gabarito único.
            $data['options'] = [];
            $data['correct_index'] = 0;

            return $data;
        }

        $data['pairs'] = null;

        $limpas = array_map(fn (string $option) => trim($option), $data['options']);

        if (count(array_unique($limpas)) !== count($limpas)) {
            abort(response()->json([
                'message' => 'Há alternativas repetidas. Cada uma precisa dizer algo diferente.',
                'errors' => ['options' => ['Há alternativas repetidas.']],
            ], 422));
        }

        if ($data['format'] === Question::FORMAT_ORDER) {
            if (count($data['options']) < 3) {
                abort(response()->json([
                    'message' => 'Uma questão de ordenar precisa de pelo menos três passos. Com dois, metade acerta no chute.',
                    'errors' => ['options' => ['Pelo menos três passos.']],
                ], 422));
            }

            // A coluna não aceita nulo, e ninguém lê este valor numa questão
            // de ordenar. Zero é o menos enganoso.
            $data['correct_index'] = 0;

            return $data;
        }

        if ($data['correct_index'] >= count($data['options'])) {
            abort(response()->json([
                'message' => 'A alternativa marcada como certa não existe nesta questão.',
                'errors' => ['correct_index' => ['Escolha uma das alternativas da lista.']],
            ], 422));
        }

        return $data;
    }

    /** @return array<string, mixed> */
    private function payload(Question $question): array
    {
        return [
            'id' => $question->id,
            'position' => $question->position,
            'topic' => $question->topic,
            'format' => $question->format,
            'statement' => $question->statement,
            'options' => $question->options,
            'pairs' => $question->pairs,
            'correct_index' => $question->correct_index,
            'explanation' => $question->explanation,
            'pitfall' => $question->pitfall,
        ];
    }
}
