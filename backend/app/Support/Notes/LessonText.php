<?php

namespace App\Support\Notes;

use App\Models\Lesson;

/**
 * A lição em texto corrido, para a IA conferir a anotação contra ELA.
 *
 * Vai tudo que é conteúdo: título, parágrafos, exemplo, tabela, tópicos,
 * palavras novas e a tradução do código. O código em si fica de fora — a
 * pessoa explica a ideia, não decora a sintaxe.
 */
class LessonText
{
    public static function of(Lesson $lesson): string
    {
        $partes = ["Lição: {$lesson->title}"];

        foreach ($lesson->steps ?? [] as $etapa) {
            $bloco = ['## '.($etapa['title'] ?? '')];

            foreach ((array) ($etapa['body'] ?? []) as $paragrafo) {
                $bloco[] = $paragrafo;
            }

            if (! empty($etapa['example']['lines'])) {
                $bloco[] = ($etapa['example']['label'] ?? 'Exemplo').':';
                foreach ($etapa['example']['lines'] as $linha) {
                    $bloco[] = "- {$linha}";
                }
            }

            if (! empty($etapa['table']['rows'])) {
                $cabecalho = $etapa['table']['headers'] ?? [];
                $bloco[] = 'Tabela'.(isset($etapa['table']['label']) ? " ({$etapa['table']['label']})" : '').': '.implode(' | ', $cabecalho);
                foreach ($etapa['table']['rows'] as $linha) {
                    $bloco[] = '- '.implode(' | ', $linha);
                }
            }

            foreach ((array) ($etapa['code']['notes'] ?? []) as $nota) {
                $bloco[] = "- {$nota}";
            }

            foreach ((array) ($etapa['bullets'] ?? []) as $topico) {
                $bloco[] = "- {$topico}";
            }

            foreach ((array) ($etapa['terms'] ?? []) as $termo) {
                $bloco[] = ($termo['word'] ?? '').': '.($termo['meaning'] ?? '');
            }

            $partes[] = implode("\n", $bloco);
        }

        return implode("\n\n", $partes);
    }
}
