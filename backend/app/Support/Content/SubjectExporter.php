<?php

namespace App\Support\Content;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\Subject;

/**
 * Uma matéria de volta ao formato de arquivo.
 *
 * O caminho inverso do ContentImporter, e existe pelo mesmo motivo que ele:
 * matéria escrita no painel fica presa no banco. Sem exportar, não dá para
 * versionar, não dá para passar pelo verificador do Guia Editorial e não dá
 * para alguém revisar num editor de texto.
 *
 * O que sai daqui **entra de volta pelo importador sem perda** — as chaves são
 * exatamente as que o ContentValidator espera. Um teste garante isso: exportar
 * e reimportar tem que devolver a mesma matéria.
 *
 * Campo vazio é OMITIDO, não escrito como null. Arquivo cheio de `"figure":
 * null` é ruído para quem vai editar à mão.
 */
class SubjectExporter
{
    /** @return array<string, mixed> */
    public function export(Subject $subject): array
    {
        $subject->load(['lessons.questions']);

        return array_filter([
            'slug' => $subject->slug,
            'name' => $subject->name,
            'description' => $subject->description,
            'exam_date' => $subject->exam_date?->format('Y-m-d'),
            'lessons' => $subject->lessons->map(fn (Lesson $lesson) => $this->lesson($lesson))->values()->all(),
        ], fn ($valor) => $valor !== null);
    }

    /** @return array<string, mixed> */
    private function lesson(Lesson $lesson): array
    {
        return array_filter([
            'slug' => $lesson->slug,
            'title' => $lesson->title,
            // O nome do módulo, nunca o número: a trilha numera pela ordem.
            'module' => $lesson->module,
            'summary' => $lesson->summary,
            'steps' => $lesson->steps ?: null,
            'questions' => $lesson->questions->map(fn (Question $q) => $this->question($q))->values()->all(),
        ], fn ($valor) => $valor !== null);
    }

    /** @return array<string, mixed> */
    private function question(Question $question): array
    {
        $dados = [
            'topic' => $question->topic,
            // "choice" é o padrão: escrevê-lo em toda questão só polui o arquivo.
            'format' => $question->format === Question::FORMAT_CHOICE ? null : $question->format,
            'statement' => $question->statement,
            'options' => in_array($question->format, [Question::FORMAT_MATCH, Question::FORMAT_WRITING], true) ? null : $question->options,
            'pairs' => $question->pairs,
            'writing' => $question->writing,
            // false é o padrão: só sai no arquivo quando liga.
            'exam_only' => $question->exam_only ? true : null,
            /*
            | O gabarito sai SEMPRE, mesmo valendo 0.
            |
            | A alternativa A é o índice 0, e um `array_filter` sem callback
            | apagaria o campo por ele ser "falso". O arquivo sairia sem
            | gabarito, e a reimportação recusaria a matéria inteira. Por isso a
            | comparação abaixo é explicitamente com `null`.
            */
            // Questão de ordenar não tem alternativa certa: o gabarito é a
            // ordem das opções, e um `correct_index` aqui só confundiria.
            'correct_index' => in_array($question->format, [Question::FORMAT_ORDER, Question::FORMAT_WRITING], true) ? null : $question->correct_index,
            'explanation' => $question->explanation,
            'pitfall' => $question->pitfall,
        ];

        return array_filter($dados, fn ($valor) => $valor !== null);
    }
}
