<?php

namespace App\Support\Practice;

/**
 * A ordem em que os passos de uma questão de ordenar aparecem na tela.
 *
 * DOIS PROBLEMAS, UMA SOLUÇÃO. O primeiro: o gabarito de uma questão de
 * ordenar é a própria lista de passos, na ordem certa. Mandá-la ao navegador
 * como está entregaria a resposta a quem abrisse as ferramentas do
 * desenvolvedor — a questão de múltipla escolha já toma esse cuidado, e só
 * revela o `correct_index` depois de respondida.
 *
 * O segundo: o embaralhamento precisa ser o MESMO nas duas pontas. O servidor
 * embaralha para entregar, e precisa desembaralhar para conferir. Guardar a
 * ordem sorteada numa tabela seria estado a mais para uma conta que cabe numa
 * função: a semente é a tentativa mais a questão, então a mesma dupla sempre
 * dá a mesma ordem, e duas pessoas na mesma questão veem ordens diferentes.
 *
 * Não usa `shuffle()` nem `mt_srand`: as duas mexem no sorteio global do PHP,
 * e a sequência de `mt_srand` não é garantida entre versões.
 */
class StepShuffle
{
    /**
     * Os índices originais, na ordem em que vão aparecer.
     *
     * @return list<int>
     */
    public static function display(int $attemptId, int $questionId, int $total): array
    {
        if ($total < 2) {
            return $total < 1 ? [] : [0];
        }

        $chaves = [];
        for ($i = 0; $i < $total; $i++) {
            $chaves[$i] = md5("{$attemptId}:{$questionId}:{$i}");
        }
        asort($chaves);
        $ordem = array_keys($chaves);

        // Sorteio que caiu na ordem certa entrega a resposta de graça.
        if ($ordem === range(0, $total - 1)) {
            $ordem[] = array_shift($ordem);
        }

        return array_values($ordem);
    }

    /**
     * A resposta está certa?
     *
     * @param  list<int>  $resposta  índices DO QUE ESTÁ NA TELA, na ordem em que a pessoa pôs
     */
    public static function isCorrect(array $resposta, int $attemptId, int $questionId, int $total): bool
    {
        if (count($resposta) !== $total || count(array_unique($resposta)) !== $total) {
            return false;
        }

        $mostrados = self::display($attemptId, $questionId, $total);
        $originais = [];

        foreach ($resposta as $indiceNaTela) {
            if (! isset($mostrados[$indiceNaTela])) {
                return false;
            }
            $originais[] = $mostrados[$indiceNaTela];
        }

        return $originais === range(0, $total - 1);
    }
}
