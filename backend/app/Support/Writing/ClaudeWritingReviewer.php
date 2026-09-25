<?php

namespace App\Support\Writing;

use Anthropic\Client;
use App\Models\Question;
use RuntimeException;

/**
 * A correção do sentido feita pelo Claude.
 *
 * Só existe com ANTHROPIC_API_KEY configurada — ver `castelei.writing.ai`.
 *
 * O pedido leva a folha de instruções daquela parte (o que produzir, a lista
 * de critérios) e o texto. A resposta é comentário, nunca nota: quem está
 * aprendendo a escrever precisa saber O QUE mudar, e "7,5" não diz isso.
 *
 * `fallbacks: "default"`: se o modelo principal recusar o pedido por engano,
 * a própria API refaz com outro modelo, sem código nosso no meio.
 */
class ClaudeWritingReviewer implements WritingReviewer
{
    private const SYSTEM = <<<'TXT'
    Você é um professor de produção textual que corrige textos de um estudante universitário brasileiro que está aprendendo a escrever.

    Comente o SENTIDO e a ORGANIZAÇÃO do texto, não a ortografia (isso já foi conferido por outra ferramenta). Avalie contra a proposta e os critérios que vêm junto do texto.

    Responda em português do Brasil, em texto simples, sem títulos e sem markdown, neste formato:
    - uma frase dizendo o que o texto já faz bem;
    - de dois a quatro pontos para melhorar, cada um em uma linha começando com "• ", dizendo o problema, o trecho em que ele aparece e como reescrever;
    - uma frase final com a próxima coisa a treinar.

    Não dê nota. Não reescreva o texto inteiro. Seja direto e gentil: quem lê está aprendendo.
    TXT;

    public function review(Question $question, string $text): string
    {
        $writing = $question->writing ?? [];

        $pedido = "Proposta: {$question->statement}\n\n";

        if (! empty($writing['steps'])) {
            $pedido .= "O que esta parte precisa ter:\n- ".implode("\n- ", $writing['steps'])."\n\n";
        }

        if (! empty($writing['checklist'])) {
            $pedido .= "Critérios de avaliação:\n- ".implode("\n- ", $writing['checklist'])."\n\n";
        }

        $pedido .= "Texto do estudante:\n\"\"\"\n{$text}\n\"\"\"";

        $client = new Client(apiKey: (string) config('castelei.writing.ai.key'));

        $resposta = $client->beta->messages->create(
            maxTokens: 8000,
            model: (string) config('castelei.writing.ai.model'),
            system: self::SYSTEM,
            messages: [['role' => 'user', 'content' => $pedido]],
            fallbacks: 'default',
            betas: ['server-side-fallback-2026-07-01'],
        );

        if ($resposta->stopReason === 'refusal') {
            throw new RuntimeException('A correção por IA recusou este texto.');
        }

        $comentario = '';

        foreach ($resposta->content as $bloco) {
            if ($bloco->type === 'text') {
                $comentario .= $bloco->text;
            }
        }

        return trim($comentario);
    }
}
