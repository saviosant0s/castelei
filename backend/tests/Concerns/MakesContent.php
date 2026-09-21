<?php

namespace Tests\Concerns;

use Illuminate\Http\Testing\File;
use Illuminate\Http\UploadedFile;

trait MakesContent
{
    /**
     * Um arquivo de matéria válido, do jeito que o painel espera receber.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function contentPayload(array $overrides = []): array
    {
        return array_replace([
            'slug' => 'materia-nova',
            'name' => 'Matéria nova',
            'description' => 'Uma frase.',
            'lessons' => [$this->lessonPayload()],
        ], $overrides);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function lessonPayload(array $overrides = []): array
    {
        return array_replace([
            'slug' => 'licao-um',
            'title' => 'Lição um',
            'summary' => 'O que se aprende aqui.',
            'steps' => $this->stepsPayload(),
            'questions' => $this->questionsPayload(8),
        ], $overrides);
    }

    /** @return list<array<string, mixed>> */
    protected function stepsPayload(): array
    {
        return [
            ['kind' => 'idea', 'title' => 'A ideia', 'body' => ['Uma analogia curta.']],
            ['kind' => 'explain', 'title' => 'Explicando', 'body' => ['Um passo de cada vez.']],
            ['kind' => 'explain', 'title' => 'Mais um pedaço', 'body' => ['Outro passo.']],
            ['kind' => 'explain', 'title' => 'E o último', 'body' => ['O fecho da explicação.']],
            ['kind' => 'exam', 'title' => 'Como cai na prova', 'body' => ['Assim.']],
            ['kind' => 'pitfall', 'title' => 'Pegadinhas', 'body' => ['Cuidado:'], 'bullets' => ['A mais comum.']],
            ['kind' => 'recap', 'title' => 'Resumo', 'body' => ['Resumindo.']],
        ];
    }

    /** @return list<array<string, mixed>> */
    protected function questionsPayload(int $total): array
    {
        $questions = [];

        for ($i = 1; $i <= $total; $i++) {
            $questions[] = [
                'topic' => 'Tópico',
                'statement' => "Enunciado {$i}",
                'options' => ["Certa {$i}", "Errada A{$i}", "Errada B{$i}", "Errada C{$i}", "Errada D{$i}"],
                'correct_index' => 0,
                'explanation' => "Porque sim, {$i}.",
            ];
        }

        return $questions;
    }

    /** Transforma o conteúdo num upload de arquivo, como o painel faz. */
    protected function contentFile(array $data, string $name = 'materia.json'): File
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        );
    }
}
