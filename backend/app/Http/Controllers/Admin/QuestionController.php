<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Question;
use App\Support\Content\ContentValidator;
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

        return response()->json(['question' => self::payload($question)], 201);
    }

    public function update(Request $request, Question $question): JsonResponse
    {
        /*
        | A questão de escrita tem um formulário próprio: roteiro, critérios,
        | texto-modelo e conferências. Ela nunca passa pelas regras das
        | alternativas — se passasse, viraria múltipla escolha sem aviso e
        | perderia o roteiro.
        */
        $question->fill($question->isWriting() ? $this->validatedWriting($request, $question) : $this->validated($request));
        $question->save();

        $question->lesson->subject->takeOverByPanel();

        return response()->json(['question' => self::payload($question)]);
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

    /**
     * Os campos de uma questão de escrita. Chaves de `writing` que o
     * formulário não conhece (escritas à mão no JSON) são mantidas.
     *
     * @return array<string, mixed>
     */
    private function validatedWriting(Request $request, Question $question): array
    {
        $maximo = (int) config('castelei.writing.max_chars');
        $data = $request->validate([
            'topic' => ['required', 'string', 'max:120'],
            'statement' => ['required', 'string'],
            'explanation' => ['required', 'string'],
            'pitfall' => ['nullable', 'string'],
            'exam_only' => ['boolean'],
            'writing' => ['required', 'array'],
            'writing.steps' => ['required', 'array', 'min:1'],
            'writing.steps.*' => ['required', 'string'],
            'writing.checklist' => ['required', 'array', 'min:1', 'max:12'],
            'writing.checklist.*' => ['required', 'string'],
            'writing.model' => ['required', 'string'],
            'writing.placeholder' => ['nullable', 'string', 'max:200'],
            'writing.min_chars' => ['nullable', 'integer', 'min:0'],
            'writing.max_chars' => ['nullable', 'integer', 'min:1', 'max:'.$maximo],
            'writing.checks' => ['nullable', 'array'],
            'writing.checks.*' => ['string', 'in:'.implode(',', ContentValidator::WRITING_CHECKS)],
            'writing.assemble' => ['boolean'],
            'writing.draft_only' => ['boolean'],
        ], [
            'writing.steps.required' => 'O roteiro precisa de pelo menos um passo.',
            'writing.checklist.required' => 'A lista de critérios precisa de pelo menos um item.',
            'writing.model.required' => 'Escreva o texto-modelo: ele aparece depois que a pessoa confere o próprio texto.',
        ]);

        $min = $data['writing']['min_chars'] ?? 0;
        $max = $data['writing']['max_chars'] ?? $maximo;
        abort_if($min >= $max, 422, 'O mínimo de caracteres precisa ser menor que o máximo.');

        $writing = array_merge($question->writing ?? [], $data['writing']);
        // Campo opcional vazio sai do registro, em vez de ficar valendo null.
        $writing = array_filter($writing, fn ($v) => $v !== null && $v !== [] && $v !== '');

        return [
            'topic' => $data['topic'],
            'statement' => $data['statement'],
            'explanation' => $data['explanation'],
            'pitfall' => $data['pitfall'] ?? null,
            'exam_only' => (bool) ($data['exam_only'] ?? false),
            'writing' => $writing,
        ];
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
            'difficulty' => ['nullable', 'string', 'in:facil,media,dificil'],
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

    /**
     * A questão como o painel a edita. A tela da lição usa o mesmo: quando
     * ela montava a lista por conta própria, esquecia o formato, e a questão
     * de ordenar abria no formulário como múltipla escolha.
     *
     * @return array<string, mixed>
     */
    public static function payload(Question $question): array
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
            'difficulty' => $question->difficulty,
            'writing' => $question->writing,
            'exam_only' => (bool) $question->exam_only,
        ];
    }
}
