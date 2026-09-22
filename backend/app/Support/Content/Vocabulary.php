<?php

namespace App\Support\Content;

use App\Models\Lesson;
use Illuminate\Support\Collection;

/**
 * O vocabulário de uma matéria, montado a partir das lições.
 *
 * NÃO EXISTE TABELA DE GLOSSÁRIO, E ISSO É A DECISÃO. As palavras já moram no
 * bloco `terms` das etapas, ao lado da primeira vez que aparecem — que é onde
 * a regra do Guia Editorial manda explicá-las ("nunca use um termo sem
 * explicá-lo antes, na própria lição"). Uma tabela separada seria uma segunda
 * fonte de verdade: ela envelheceria calada, e o glossário passaria a discordar
 * da lição.
 *
 * O efeito colateral é o ponto: escrever a palavra no `terms` passou a render
 * uma página. Quem escreve ganha motivo para explicar o termo em vez de supor
 * que a pessoa já sabe.
 */
class Vocabulary
{
    /**
     * @param  Collection<int, Lesson>  $lessons  na ordem de estudo
     * @return list<array<string, mixed>>
     */
    public static function fromLessons(Collection $lessons): array
    {
        $termos = [];

        foreach ($lessons as $lesson) {
            foreach ($lesson->stepsOrFallback() as $step) {
                foreach ($step['terms'] ?? [] as $term) {
                    $word = trim((string) ($term['word'] ?? ''));
                    $meaning = trim((string) ($term['meaning'] ?? ''));

                    if ($word === '' || $meaning === '') {
                        continue;
                    }

                    $chave = self::key($word);

                    /*
                    | Vence a PRIMEIRA aparição, na ordem de estudo. A palavra
                    | pode voltar mais à frente com uma explicação encurtada,
                    | e é a de estreia que foi escrita para quem nunca viu o
                    | termo — que é exatamente o leitor do glossário.
                    */
                    if (isset($termos[$chave])) {
                        continue;
                    }

                    $termos[$chave] = [
                        'word' => $word,
                        'meaning' => $meaning,
                        'lesson' => [
                            'id' => $lesson->id,
                            'title' => $lesson->title,
                            'position' => $lesson->position,
                        ],
                    ];
                }
            }
        }

        // Ordem alfabética de dicionário: "ápice" vem antes de "base".
        uksort($termos, fn (string $a, string $b) => $a <=> $b);

        return array_values($termos);
    }

    /**
     * A chave de ordenação e de unicidade: minúscula e sem acento.
     *
     * Sem tirar o acento, "índice" cairia depois de "zona" — a tabela ASCII põe
     * as letras acentuadas atrás de todo o alfabeto. E "Kernel" e "kernel"
     * virariam duas entradas.
     */
    private static function key(string $word): string
    {
        $sem = strtr(
            mb_strtolower($word),
            [
                'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a',
                'é' => 'e', 'ê' => 'e', 'ë' => 'e',
                'í' => 'i', 'î' => 'i', 'ï' => 'i',
                'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
                'ú' => 'u', 'û' => 'u', 'ü' => 'u',
                'ç' => 'c', 'ñ' => 'n',
            ],
        );

        return $sem;
    }
}
