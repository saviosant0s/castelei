<?php

namespace App\Support\Content;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\Subject;
use Illuminate\Support\Facades\DB;

/**
 * Grava um arquivo de conteúdo no banco.
 *
 * É o único caminho de escrita em massa: o seeder do deploy e o painel usam
 * este mesmo código. Antes eram dois, e dois caminhos para a mesma tabela
 * viram duas regras diferentes na primeira vez que alguém corrige um sem
 * lembrar do outro.
 *
 * É idempotente: lições são achadas por (matéria, slug) e questões por
 * (lição, posição), então reenviar o mesmo arquivo não duplica nada e não
 * embaralha a ordem de questões já publicadas.
 *
 * Não apaga nada por conta própria. Se o arquivo encolheu, o que sobrou no app
 * é apontado no relatório (`orphan_*`) e só sai com `prune` ligado — quem
 * apagou uma questão sem querer apagou junto as respostas de quem já estudou.
 */
class ContentImporter
{
    /**
     * As colunas antigas continuam preenchidas (derivadas das etapas) enquanto o app antigo
     * ainda pode estar no ar durante um deploy.
     *
     * @param  list<array<string, mixed>>  $steps
     * @return array{explanation: string, exam_style: string, pitfalls: list<string>}
     */
    public static function legacyFields(array $steps): array
    {
        $explanation = [];
        $exam = [];
        $pitfalls = [];

        foreach ($steps as $step) {
            $body = $step['body'] ?? [];
            $bullets = $step['bullets'] ?? [];

            match ($step['kind']) {
                'exam' => $exam = [...$exam, ...$body, ...$bullets],
                'pitfall' => $pitfalls = [...$pitfalls, ...$bullets],
                'recap' => null,
                default => $explanation = [...$explanation, ...$body],
            };
        }

        return [
            'explanation' => implode("\n\n", $explanation),
            'exam_style' => implode("\n\n", $exam),
            'pitfalls' => $pitfalls,
        ];
    }

    /**
     * Tira as chaves de comentário do arquivo-modelo.
     *
     * O JSON não tem comentário, então o modelo que o painel entrega explica os
     * campos em chaves começadas por "_". Elas são ajuda para quem escreve e
     * não podem virar dado.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function stripComments(array $data): array
    {
        $limpo = [];

        foreach ($data as $key => $value) {
            if (is_string($key) && str_starts_with($key, '_')) {
                continue;
            }

            if (is_array($value)) {
                $value = self::stripComments($value);
            }

            $limpo[$key] = $value;
        }

        return $limpo;
    }

    /**
     * @param  array<string, mixed>  $data  conteúdo já validado
     * @param  string  $origin  'seed' (arquivos do repositório) ou 'painel'
     * @param  int|null  $position  ordem da matéria; null mantém a que já existe
     * @param  bool  $prune  apagar lições e questões que não vieram no arquivo
     */
    public function import(array $data, string $origin, ?int $position = null, bool $prune = false): ImportReport
    {
        $data = self::stripComments($data);
        $report = new ImportReport;

        DB::transaction(function () use ($data, $origin, $position, $prune, $report) {
            $subject = Subject::firstOrNew(['slug' => $data['slug']]);

            $report->subjectCreated = ! $subject->exists;
            $subject->name = $data['name'];
            $subject->description = $data['description'] ?? null;
            // Prazo da matéria: é dele que sai o intervalo entre revisões.
            $subject->exam_date = $this->examDate($data['exam_date'] ?? null);
            $subject->origin = $origin;

            if ($position !== null) {
                $subject->position = $position;
            } elseif (! $subject->exists) {
                $subject->position = (int) Subject::max('position') + 1;
            }

            $subject->save();

            $report->subjectId = $subject->id;
            $report->subjectSlug = $subject->slug;
            $report->subjectName = $subject->name;

            $slugs = [];

            foreach ($data['lessons'] as $index => $lessonData) {
                $slugs[] = $lessonData['slug'];
                $this->lesson($subject, $lessonData, $index + 1, $prune, $report);
            }

            $this->handleOrphanLessons($subject, $slugs, $prune, $report);
        });

        return $report;
    }

    /** @param  array<string, mixed>  $data */
    private function lesson(Subject $subject, array $data, int $position, bool $prune, ImportReport $report): void
    {
        $lesson = Lesson::firstOrNew(['subject_id' => $subject->id, 'slug' => $data['slug']]);
        $novo = ! $lesson->exists;

        $lesson->fill([
            'title' => $data['title'],
            'position' => $position,
            'module' => $this->module($data['module'] ?? null),
            'summary' => $data['summary'],
            'steps' => $data['steps'],
        ] + self::legacyFields($data['steps']));

        $lesson->save();

        $novo ? $report->lessonsCreated++ : $report->lessonsUpdated++;

        foreach ($data['questions'] as $index => $questionData) {
            $question = Question::firstOrNew(['lesson_id' => $lesson->id, 'position' => $index + 1]);
            $criada = ! $question->exists;

            $question->fill([
                'topic' => $questionData['topic'],
                'format' => $questionData['format'] ?? Question::FORMAT_CHOICE,
                'statement' => $questionData['statement'],
                // Na questão de associar não há alternativas: os pares é que
                // são o conteúdo, e `options` fica vazia de propósito.
                'options' => $questionData['options'] ?? [],
                'pairs' => $questionData['pairs'] ?? null,
                // Na questão de ordenar não existe alternativa certa: o
                // gabarito é a própria ordem das opções. A coluna não aceita
                // nulo, então fica em zero e ninguém a lê.
                'correct_index' => $questionData['correct_index'] ?? 0,
                'explanation' => $questionData['explanation'],
                'pitfall' => $questionData['pitfall'] ?? null,
            ]);

            $question->save();

            $criada ? $report->questionsCreated++ : $report->questionsUpdated++;
        }

        $sobrando = $lesson->questions()->where('position', '>', count($data['questions']))->count();

        if ($sobrando === 0) {
            return;
        }

        if ($prune) {
            $lesson->questions()->where('position', '>', count($data['questions']))->delete();
            $report->questionsRemoved += $sobrando;

            return;
        }

        $report->orphanQuestions[] = [
            'lesson' => $lesson->title,
            'slug' => $lesson->slug,
            'count' => $sobrando,
        ];
    }

    /**
     * O nome do módulo, ou null.
     *
     * Texto em branco vira null de propósito: quem apagou o campo no painel
     * quis tirar a lição do módulo, e "" no banco faria a tela abrir um grupo
     * sem nome no meio da trilha.
     */
    private function module(mixed $value): ?string
    {
        $nome = trim((string) ($value ?? ''));

        return $nome === '' ? null : $nome;
    }

    /**
     * Data da prova da matéria. Vazio vira nulo: matéria sem prova marcada cai
     * no plano de revisão de longo prazo em vez de travar.
     */
    private function examDate(mixed $value): ?string
    {
        $data = trim((string) ($value ?? ''));

        return $data === '' ? null : $data;
    }

    /** @param  list<string>  $slugs  as lições que vieram no arquivo */
    private function handleOrphanLessons(Subject $subject, array $slugs, bool $prune, ImportReport $report): void
    {
        $sobrando = $subject->lessons()->whereNotIn('slug', $slugs)->get();

        foreach ($sobrando as $lesson) {
            if ($prune) {
                $lesson->delete();

                continue;
            }

            $report->orphanLessons[] = ['title' => $lesson->title, 'slug' => $lesson->slug];
        }
    }
}
