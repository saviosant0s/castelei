<?php

namespace App\Support\Content;

/**
 * Confere um arquivo de conteúdo antes de ele entrar no banco.
 *
 * Separa o que quebra o app do que só foge da convenção:
 *
 * - **erro** impede a importação. É o que faria a tela quebrar ou mentir:
 *   campo que falta, tipo errado, resposta certa apontando para uma
 *   alternativa que não existe, dois slugs iguais.
 * - **aviso** deixa passar. É o Guia Editorial: etapa de abertura, etapa de
 *   fechamento, "Como cai na prova". Conteúdo fora dessa forma funciona —
 *   fica pior, e quem enviou precisa saber, mas não é o importador que decide.
 *
 * Cada apontamento carrega o caminho dentro do arquivo
 * (`lessons[3].questions[2].correct_index`), porque "campo obrigatório" sem
 * endereço não ajuda ninguém a achar o erro num arquivo de mil linhas.
 *
 * O verificador completo do Guia (vírgulas, jargão, tamanho de frase) é outro:
 * `scripts/lint-content.mjs`, que roda na máquina de quem escreve. Aqui a régua
 * é mais larga de propósito — o painel existe para publicar sem depender do
 * ambiente de desenvolvimento.
 */
class ContentValidator
{
    private const KINDS = ['idea', 'explain', 'exam', 'pitfall', 'recap'];

    private const SLUG = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    /** Quantas questões por lição o site público anuncia. */
    private const QUESTIONS_PER_LESSON = 8;

    /** @var list<array{path: string, message: string}> */
    private array $errors = [];

    /** @var list<array{path: string, message: string}> */
    private array $warnings = [];

    /**
     * @param  mixed  $data  o conteúdo já decodificado do JSON
     * @return array{errors: list<array{path: string, message: string}>, warnings: list<array{path: string, message: string}>}
     */
    public function validate(mixed $data): array
    {
        $this->errors = [];
        $this->warnings = [];

        if (! is_array($data) || array_is_list($data)) {
            $this->error('', 'O arquivo precisa ser um objeto JSON com os campos da matéria (slug, name, lessons).');

            return $this->result();
        }

        $this->slug($data['slug'] ?? null, 'slug');
        $this->text($data['name'] ?? null, 'name', max: 120);
        $this->optionalText($data['description'] ?? null, 'description', max: 500);
        $this->optionalDate($data['exam_date'] ?? null, 'exam_date');

        $lessons = $data['lessons'] ?? null;

        if (! is_array($lessons) || ! array_is_list($lessons) || $lessons === []) {
            $this->error('lessons', 'A matéria precisa de uma lista com pelo menos uma lição.');

            return $this->result();
        }

        $slugs = [];

        foreach ($lessons as $index => $lesson) {
            $path = "lessons[{$index}]";

            if (! is_array($lesson) || array_is_list($lesson)) {
                $this->error($path, 'Cada lição precisa ser um objeto JSON.');

                continue;
            }

            $slug = $lesson['slug'] ?? null;

            if ($this->slug($slug, "{$path}.slug")) {
                if (isset($slugs[$slug])) {
                    $this->error("{$path}.slug", "Slug repetido: \"{$slug}\" já é usado na lição {$slugs[$slug]}. Dentro de uma matéria cada lição precisa do seu.");
                } else {
                    $slugs[$slug] = $index + 1;
                }
            }

            $this->text($lesson['title'] ?? null, "{$path}.title", max: 160);
            // Opcional: matéria curta não precisa de módulo. Quando existe, é
            // o nome do assunto ("Processos") — o número sai da ordem na tela.
            $this->optionalText($lesson['module'] ?? null, "{$path}.module", max: 60);
            $this->text($lesson['summary'] ?? null, "{$path}.summary");
            $this->steps($lesson['steps'] ?? null, "{$path}.steps");
            $this->questions($lesson['questions'] ?? null, "{$path}.questions");
        }

        return $this->result();
    }

    /** @return array{errors: list<array{path: string, message: string}>, warnings: list<array{path: string, message: string}>} */
    private function result(): array
    {
        return ['errors' => $this->errors, 'warnings' => $this->warnings];
    }

    private function error(string $path, string $message): void
    {
        $this->errors[] = ['path' => $path, 'message' => $message];
    }

    private function warn(string $path, string $message): void
    {
        $this->warnings[] = ['path' => $path, 'message' => $message];
    }

    private function text(mixed $value, string $path, int $max = 0): bool
    {
        if (! is_string($value) || trim($value) === '') {
            $this->error($path, 'Campo obrigatório: preencha com um texto.');

            return false;
        }

        if ($max > 0 && mb_strlen($value) > $max) {
            $this->error($path, "Texto longo demais: são {$max} caracteres no máximo.");

            return false;
        }

        return true;
    }

    private function optionalText(mixed $value, string $path, int $max = 0): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $this->text($value, $path, $max);
    }

    /**
     * Data opcional no formato AAAA-MM-DD.
     *
     * É a data da prova da matéria, e o agendamento de revisão calcula o
     * intervalo como uma fatia do tempo que falta até ela. Por isso o formato é
     * exigido em vez de adivinhado: "15/12/2026" lido como mês 15 mandaria toda
     * revisão da matéria para um ponto errado do calendário, sem erro nenhum na
     * tela.
     */
    private function optionalDate(mixed $value, string $path): void
    {
        if ($value === null || $value === '') {
            return;
        }

        if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            $this->error($path, 'A data da prova precisa ser um texto no formato AAAA-MM-DD. Exemplo: 2026-12-15.');

            return;
        }

        [$ano, $mes, $dia] = array_map('intval', explode('-', $value));

        if (! checkdate($mes, $dia, $ano)) {
            $this->error($path, "A data da prova \"{$value}\" não existe no calendário.");
        }
    }

    private function slug(mixed $value, string $path): bool
    {
        if (! $this->text($value, $path, max: 80)) {
            return false;
        }

        if (! preg_match(self::SLUG, (string) $value)) {
            $this->error($path, 'O slug só aceita letras minúsculas sem acento, números e hífen entre as palavras. Exemplo: memoria-virtual.');

            return false;
        }

        return true;
    }

    /** @return list<string>|null lista de textos, ou null se o campo estiver errado */
    private function textList(mixed $value, string $path, bool $required): ?array
    {
        if ($value === null && ! $required) {
            return null;
        }

        if (! is_array($value) || ! array_is_list($value)) {
            $this->error($path, 'Este campo precisa ser uma lista de textos.');

            return null;
        }

        foreach ($value as $index => $item) {
            if (! is_string($item)) {
                $this->error("{$path}[{$index}]", 'Item da lista precisa ser um texto.');

                return null;
            }
        }

        return array_values($value);
    }

    private function steps(mixed $steps, string $path): void
    {
        if (! is_array($steps) || ! array_is_list($steps) || $steps === []) {
            $this->error($path, 'A lição precisa de uma lista com pelo menos uma etapa.');

            return;
        }

        $kinds = [];

        foreach ($steps as $index => $step) {
            $stepPath = "{$path}[{$index}]";

            if (! is_array($step) || array_is_list($step)) {
                $this->error($stepPath, 'Cada etapa precisa ser um objeto JSON.');

                continue;
            }

            $kind = $step['kind'] ?? null;

            if (! is_string($kind) || ! in_array($kind, self::KINDS, true)) {
                $this->error("{$stepPath}.kind", 'Tipo de etapa desconhecido. Use um destes: '.implode(', ', self::KINDS).'.');
            } else {
                $kinds[] = $kind;
            }

            $this->text($step['title'] ?? null, "{$stepPath}.title", max: 160);

            $body = $this->textList($step['body'] ?? null, "{$stepPath}.body", required: true) ?? [];
            $bullets = $this->textList($step['bullets'] ?? null, "{$stepPath}.bullets", required: false) ?? [];

            $this->terms($step['terms'] ?? null, "{$stepPath}.terms");
            $this->example($step['example'] ?? null, "{$stepPath}.example");
            $this->figure($step['figure'] ?? null, "{$stepPath}.figure");
            $this->video($step['video'] ?? null, "{$stepPath}.video");
            $this->code($step['code'] ?? null, "{$stepPath}.code");
            $this->table($step['table'] ?? null, "{$stepPath}.table");

            $hasExtra = isset($step['example'])
                || isset($step['figure'])
                || isset($step['video'])
                || isset($step['code'])
                || isset($step['table']);

            if ($body === [] && $bullets === [] && ! $hasExtra) {
                $this->error($stepPath, 'Etapa vazia: ela precisa de pelo menos um parágrafo, item, exemplo, figura, vídeo, código ou tabela.');
            }
        }

        $this->stepConventions($kinds, $steps, $path);
    }

    /**
     * O Guia Editorial em forma de aviso. Nada aqui impede a publicação.
     *
     * @param  list<string>  $kinds
     * @param  array<int, mixed>  $steps
     */
    private function stepConventions(array $kinds, array $steps, string $path): void
    {
        if ($kinds === []) {
            return;
        }

        if ($kinds[0] !== 'idea') {
            $this->warn("{$path}[0].kind", 'A primeira etapa costuma ser "idea": a ideia central antes de qualquer detalhe.');
        }

        if (end($kinds) !== 'recap') {
            $this->warn($path, 'A última etapa costuma ser "recap": o resumo que fecha a lição.');
        }

        foreach (['exam' => 'Como cai na prova', 'pitfall' => 'Pegadinhas clássicas'] as $kind => $nome) {
            $total = count(array_filter($kinds, fn (string $k) => $k === $kind));

            if ($total !== 1) {
                $this->warn($path, "A lição tem {$total} etapas do tipo \"{$kind}\" ({$nome}). O normal é exatamente uma.");
            }
        }

        if (count($steps) < 6) {
            $this->warn($path, 'A lição tem '.count($steps).' etapas. Abaixo de 6 costuma ser sinal de que o assunto foi explicado rápido demais para quem parte do zero.');
        }

        $this->tooMuchProse($steps, $path);
    }

    /**
     * Lição que é só texto corrido.
     *
     * O aviso existe porque isto aconteceu de verdade: um curso inteiro foi
     * escrito pelo painel e saiu sem uma figura, uma tabela ou um exemplo em
     * nenhuma lição. O conteúdo estava certo; a tela ficava um paredão.
     *
     * O app se propõe a explicar para quem parte do zero, e quem parte do zero
     * precisa de algo para olhar. Não é enfeite: é a diferença entre ler sobre
     * uma ideia e ver a ideia.
     *
     * É AVISO, nunca erro. Existe lição que é legitimamente só texto, e não
     * cabe ao verificador reprovar conteúdo por causa de forma.
     *
     * @param  array<int, mixed>  $steps
     */
    private function tooMuchProse(array $steps, string $path): void
    {
        /*
        | `bullets` e `terms` contam: uma lista de itens e uma caixa de palavras
        | novas já quebram o paredão de parágrafo, mesmo não sendo imagem.
        */
        $comApoio = 0;

        foreach ($steps as $step) {
            if (! is_array($step)) {
                continue;
            }

            foreach (['figure', 'video', 'table', 'code', 'example', 'bullets', 'terms'] as $bloco) {
                if (! empty($step[$bloco])) {
                    $comApoio++;

                    break;
                }
            }
        }

        $total = count($steps);

        if ($comApoio === 0) {
            $this->warn($path, "A lição é só texto corrido: nenhuma das {$total} etapas tem figura, tabela, exemplo, código, vídeo, lista ou glossário. Quem parte do zero precisa de algo para olhar.");

            return;
        }

        // Um terço das etapas é o piso: abaixo disso a lição ainda lê como paredão.
        if ($total >= 6 && $comApoio * 3 < $total) {
            $this->warn($path, "Só {$comApoio} de {$total} etapas têm algo além de parágrafo (figura, tabela, exemplo, código, vídeo, lista ou glossário). A lição ainda lê como texto corrido.");
        }
    }

    private function terms(mixed $terms, string $path): void
    {
        if ($terms === null) {
            return;
        }

        if (! is_array($terms) || ! array_is_list($terms)) {
            $this->error($path, 'As palavras explicadas precisam ser uma lista.');

            return;
        }

        foreach ($terms as $index => $term) {
            if (! is_array($term) || array_is_list($term)) {
                $this->error("{$path}[{$index}]", 'Cada palavra precisa ser um objeto com "word" e "meaning".');

                continue;
            }

            $this->text($term['word'] ?? null, "{$path}[{$index}].word", max: 120);
            $this->text($term['meaning'] ?? null, "{$path}[{$index}].meaning");
        }
    }

    private function example(mixed $example, string $path): void
    {
        if ($example === null) {
            return;
        }

        if (! is_array($example) || array_is_list($example)) {
            $this->error($path, 'O exemplo precisa ser um objeto com "label" e "lines".');

            return;
        }

        $this->text($example['label'] ?? null, "{$path}.label", max: 160);
        $lines = $this->textList($example['lines'] ?? null, "{$path}.lines", required: true);

        if ($lines === []) {
            $this->error("{$path}.lines", 'O exemplo precisa de pelo menos uma linha.');
        }
    }

    private function figure(mixed $figure, string $path): void
    {
        if ($figure === null) {
            return;
        }

        if (! is_array($figure) || array_is_list($figure)) {
            $this->error($path, 'A figura precisa ser um objeto com "src" e "alt".');

            return;
        }

        $this->text($figure['src'] ?? null, "{$path}.src", max: 500);

        // Descrição é obrigatória, e curta não serve: quem usa leitor de tela
        // recebe "imagem" e perde a etapa inteira. É a regra 6 do guia.
        if ($this->text($figure['alt'] ?? null, "{$path}.alt", max: 300)
            && mb_strlen(trim((string) $figure['alt'])) < 20) {
            $this->error("{$path}.alt", 'A descrição da figura está curta demais. Escreva o que a figura mostra, em uma frase, para quem não pode vê-la.');
        }

        $this->optionalText($figure['caption'] ?? null, "{$path}.caption", max: 300);
    }

    private function video(mixed $video, string $path): void
    {
        if ($video === null) {
            return;
        }

        if (! is_array($video) || array_is_list($video)) {
            $this->error($path, 'O vídeo precisa ser um objeto com "src".');

            return;
        }

        $this->text($video['src'] ?? null, "{$path}.src", max: 500);
        $this->optionalText($video['title'] ?? null, "{$path}.title", max: 160);
        $this->optionalText($video['caption'] ?? null, "{$path}.caption", max: 300);
        $this->optionalText($video['poster'] ?? null, "{$path}.poster", max: 500);

        if (! isset($video['caption']) && ! isset($video['title'])) {
            $this->warn($path, 'O vídeo não tem título nem legenda. Sem um dos dois, quem não pode assistir não sabe o que perdeu.');
        }
    }

    private function code(mixed $code, string $path): void
    {
        if ($code === null) {
            return;
        }

        if (! is_array($code) || array_is_list($code)) {
            $this->error($path, 'O bloco de código precisa ser um objeto com "text".');

            return;
        }

        $this->text($code['text'] ?? null, "{$path}.text");
        $this->optionalText($code['label'] ?? null, "{$path}.label", max: 160);
    }

    private function table(mixed $table, string $path): void
    {
        if ($table === null) {
            return;
        }

        if (! is_array($table) || array_is_list($table)) {
            $this->error($path, 'A tabela precisa ser um objeto com "headers" e "rows".');

            return;
        }

        $this->optionalText($table['label'] ?? null, "{$path}.label", max: 160);
        $headers = $this->textList($table['headers'] ?? null, "{$path}.headers", required: true);

        if ($headers === null || $headers === []) {
            $this->error("{$path}.headers", 'A tabela precisa de pelo menos uma coluna.');

            return;
        }

        $rows = $table['rows'] ?? null;

        if (! is_array($rows) || ! array_is_list($rows) || $rows === []) {
            $this->error("{$path}.rows", 'A tabela precisa de pelo menos uma linha.');

            return;
        }

        $colunas = count($headers);

        foreach ($rows as $index => $row) {
            $cells = $this->textList($row, "{$path}.rows[{$index}]", required: true);

            if ($cells !== null && count($cells) !== $colunas) {
                $this->error("{$path}.rows[{$index}]", 'A linha tem '.count($cells)." células e a tabela tem {$colunas} colunas. Toda linha precisa ter uma célula por coluna.");
            }
        }

        if (isset($table['mono']) && ! is_bool($table['mono'])) {
            $this->error("{$path}.mono", 'O campo "mono" só aceita true ou false.');
        }
    }

    private function questions(mixed $questions, string $path): void
    {
        if (! is_array($questions) || ! array_is_list($questions) || $questions === []) {
            $this->error($path, 'A lição precisa de uma lista com pelo menos uma questão.');

            return;
        }

        foreach ($questions as $index => $question) {
            $qPath = "{$path}[{$index}]";

            if (! is_array($question) || array_is_list($question)) {
                $this->error($qPath, 'Cada questão precisa ser um objeto JSON.');

                continue;
            }

            $this->text($question['topic'] ?? null, "{$qPath}.topic", max: 120);
            $this->text($question['statement'] ?? null, "{$qPath}.statement");
            $this->text($question['explanation'] ?? null, "{$qPath}.explanation");
            $this->optionalText($question['pitfall'] ?? null, "{$qPath}.pitfall");

            $options = $this->textList($question['options'] ?? null, "{$qPath}.options", required: true);

            if ($options === null) {
                continue;
            }

            $this->options($options, $question['correct_index'] ?? null, $qPath);
        }

        $total = count($questions);

        if ($total !== self::QUESTIONS_PER_LESSON) {
            $this->warn($path, "A lição tem {$total} questões. O site público anuncia ".self::QUESTIONS_PER_LESSON.' por lição, então fora desse número a vitrine passa a prometer o que o app não entrega.');
        }
    }

    /** @param  list<string>  $options */
    private function options(array $options, mixed $correct, string $path): void
    {
        if (count($options) < 2) {
            $this->error("{$path}.options", 'A questão precisa de pelo menos duas alternativas.');

            return;
        }

        $limpas = array_map(fn (string $option) => trim($option), $options);

        if (count(array_unique($limpas)) !== count($limpas)) {
            $this->error("{$path}.options", 'Há alternativas repetidas. Cada uma precisa dizer algo diferente.');
        }

        if (count($options) !== 5) {
            $this->warn("{$path}.options", 'A questão tem '.count($options).' alternativas. O padrão do Castelei é 5, como nas bancas.');
        }

        if (! is_int($correct)) {
            $this->error("{$path}.correct_index", 'Informe qual alternativa é a certa, pelo número dela começando em zero.');

            return;
        }

        if ($correct < 0 || $correct >= count($options)) {
            $ultima = count($options) - 1;
            $this->error("{$path}.correct_index", "A resposta certa aponta para a alternativa {$correct}, que não existe. A questão tem ".count($options)." alternativas, numeradas de 0 a {$ultima}.");
        }
    }
}
