<?php

namespace App\Support\Notes;

use Anthropic\Client;
use App\Models\Lesson;
use RuntimeException;

/**
 * A resposta da dúvida, pelo Claude, com a lição inteira junto.
 *
 * A lição vai junto para a resposta partir DELA: o mesmo vocabulário, os
 * mesmos exemplos, o mesmo recorte que cai na prova. Quando a pergunta vai
 * além do que a lição ensina, a resposta pode ir também — mas avisa, para a
 * pessoa saber o que é matéria e o que é complemento.
 */
class ClaudeDoubtAnswerer implements DoubtAnswerer
{
    private const SYSTEM = <<<'TXT'
    Você é o professor particular de um estudante brasileiro que acabou de ler uma lição e ficou com uma dúvida. A pergunta pode ter vindo de fala transcrita: entenda a intenção mesmo com palavras trocadas.

    Responda partindo do CONTEÚDO DA LIÇÃO que vem junto: use os mesmos termos e, quando ajudar, os mesmos exemplos. Se a resposta precisar ir além do que a lição diz, pode ir, mas comece esse trecho com "Indo além da lição:".

    Escreva para quem parte do zero. Todo termo técnico que você usar e que a pessoa talvez não conheça, explique numa frase. Prefira um exemplo do dia a dia a uma definição abstrata.

    Responda em português do Brasil, em texto simples, sem markdown, em parágrafos curtos. No máximo uns 250 palavras. Se a pergunta não tiver relação com a lição nem com estudo, diga com gentileza que aqui você responde dúvidas sobre a lição.
    TXT;

    public function answer(Lesson $lesson, string $question): string
    {
        $pedido = "CONTEÚDO DA LIÇÃO:\n\"\"\"\n".LessonText::of($lesson)."\n\"\"\"\n\nDÚVIDA DO ESTUDANTE:\n\"\"\"\n{$question}\n\"\"\"";

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
            throw new RuntimeException('A IA recusou esta pergunta.');
        }

        $texto = '';
        foreach ($resposta->content as $bloco) {
            if ($bloco->type === 'text') {
                $texto .= $bloco->text;
            }
        }

        $texto = trim($texto);
        if ($texto === '') {
            throw new RuntimeException('A IA respondeu vazio.');
        }

        return $texto;
    }
}
