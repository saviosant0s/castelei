<?php

namespace App\Support\Notes;

use Anthropic\Client;
use App\Models\Lesson;
use RuntimeException;

/**
 * A correção da anotação feita pelo Claude.
 *
 * A lição inteira vai junto, e a instrução manda conferir CONTRA ELA: a IA não
 * corrige o que acha de cabeça, e não cobra o que a lição não ensinou.
 *
 * A resposta vem em três listas marcadas por rótulo fixo, e o texto é
 * separado aqui. Rótulo que não vier vira lista vazia, nunca erro: uma
 * correção torta ainda é melhor do que nenhuma.
 */
class ClaudeNoteReviewer implements NoteReviewer
{
    private const SYSTEM = <<<'TXT'
    Você confere a anotação de um estudante brasileiro que acabou de ler uma lição e escreveu, com as próprias palavras, o que entendeu. A anotação pode ter vindo de fala transcrita: ignore pontuação, ortografia e frases soltas, e julgue só as IDEIAS.

    Compare a anotação com o CONTEÚDO DA LIÇÃO que vem junto. Não use conhecimento de fora para cobrar o que a lição não ensina, e não invente fato.

    Responda em português do Brasil, em texto simples, sem markdown, exatamente com estes três rótulos, cada um numa linha sozinha, e itens começando com "- ":

    ACERTOU:
    - cada ideia que a anotação explicou certo, em uma frase curta.

    CORRIGIR:
    - cada ideia errada ou confusa: o que a anotação disse e como é de verdade, segundo a lição.

    FALTOU:
    - as ideias mais importantes da lição que a anotação não citou (no máximo três).

    Se uma parte não tiver nada, escreva "- nada" nela. Seja direto e gentil: quem lê está aprendendo. Não dê nota.
    TXT;

    public function review(Lesson $lesson, string $note): array
    {
        $pedido = "CONTEÚDO DA LIÇÃO:\n\"\"\"\n".LessonText::of($lesson)."\n\"\"\"\n\nANOTAÇÃO DO ESTUDANTE:\n\"\"\"\n{$note}\n\"\"\"";

        $client = new Client(apiKey: (string) config('castelei.notes.ai.key'));

        $resposta = $client->beta->messages->create(
            maxTokens: 8000,
            model: (string) config('castelei.notes.ai.model'),
            system: self::SYSTEM,
            messages: [['role' => 'user', 'content' => $pedido]],
            fallbacks: 'default',
            betas: ['server-side-fallback-2026-07-01'],
        );

        if ($resposta->stopReason === 'refusal') {
            throw new RuntimeException('A correção por IA recusou esta anotação.');
        }

        $texto = '';
        foreach ($resposta->content as $bloco) {
            if ($bloco->type === 'text') {
                $texto .= $bloco->text;
            }
        }

        return self::parse($texto);
    }

    /** @return array{right: list<string>, wrong: list<string>, missing: list<string>} */
    public static function parse(string $texto): array
    {
        $listas = ['right' => [], 'wrong' => [], 'missing' => []];
        $rotulos = ['ACERTOU' => 'right', 'CORRIGIR' => 'wrong', 'FALTOU' => 'missing'];
        $atual = null;

        foreach (preg_split('/\R/u', $texto) as $linha) {
            $linha = trim($linha);
            $rotulo = mb_strtoupper(rtrim($linha, ': '));
            if (isset($rotulos[$rotulo])) {
                $atual = $rotulos[$rotulo];

                continue;
            }
            if ($atual === null || ! preg_match('/^[-•*]\s*(.+)$/u', $linha, $m)) {
                continue;
            }
            $item = trim($m[1]);
            if ($item !== '' && mb_strtolower(rtrim($item, '.')) !== 'nada') {
                $listas[$atual][] = $item;
            }
        }

        return $listas;
    }
}
