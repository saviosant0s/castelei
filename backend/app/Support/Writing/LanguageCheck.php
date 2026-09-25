<?php

namespace App\Support\Writing;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Ortografia, acentuação, crase, concordância e pontuação, pelo LanguageTool.
 *
 * É a segunda camada da conferência de um texto (ver `castelei.writing`). A
 * primeira, a forma, é código nosso na tela; a terceira, o sentido, é da IA.
 *
 * NUNCA QUEBRA A PRÁTICA. O serviço é de fora e gratuito, sem garantia de
 * que esteja no ar: se ele cair, demorar ou recusar, a resposta é `null` e a
 * tela diz que a conferência de língua ficou indisponível desta vez. O texto
 * da pessoa, o modelo e a autoavaliação continuam de pé.
 *
 * O mesmo texto não é conferido duas vezes: quem aperta "Conferir" de novo
 * sem mudar nada recebe a resposta guardada. Isso poupa o limite de 20
 * pedidos por minuto, que é dividido entre todo mundo que usa o app.
 *
 * As posições (`offset`, `length`) vêm como o LanguageTool conta: unidades de
 * UTF-16, que é exatamente como o JavaScript conta. A tela recorta o trecho
 * sem converter nada.
 */
class LanguageCheck
{
    /** Categorias do LanguageTool agrupadas no que a pessoa entende. */
    private const GROUPS = [
        'TYPOS' => 'ortografia',
        'SPELLING' => 'ortografia',
        'PUNCTUATION' => 'pontuação',
        'TYPOGRAPHY' => 'pontuação',
        'GRAMMAR' => 'gramática',
        'CONFUSED_WORDS' => 'gramática',
        'CASING' => 'gramática',
        'AGREEMENT' => 'gramática',
    ];

    public static function enabled(): bool
    {
        return (string) config('castelei.writing.languagetool_url') !== '';
    }

    /**
     * @return list<array{offset: int, length: int, message: string, replacements: list<string>, group: string}>|null
     *                                                                                                             null = a conferência não rodou
     */
    public static function check(string $text): ?array
    {
        if (! self::enabled() || trim($text) === '') {
            return self::enabled() ? [] : null;
        }

        $chave = 'languagetool:'.sha1($text);

        if (($guardado = Cache::get($chave)) !== null) {
            return $guardado;
        }

        try {
            $resposta = Http::asForm()
                ->timeout(8)
                ->post((string) config('castelei.writing.languagetool_url'), [
                    'text' => $text,
                    'language' => 'pt-BR',
                ]);

            if (! $resposta->successful()) {
                return null;
            }

            $apontamentos = self::issues($resposta->json('matches') ?? []);
        } catch (Throwable $e) {
            report($e);

            return null;
        }

        Cache::put($chave, $apontamentos, now()->addDay());

        return $apontamentos;
    }

    /**
     * @param  array<int, mixed>  $matches
     * @return list<array{offset: int, length: int, message: string, replacements: list<string>, group: string}>
     */
    private static function issues(array $matches): array
    {
        $lista = [];

        foreach ($matches as $match) {
            if (! is_array($match) || ! isset($match['offset'], $match['length'], $match['message'])) {
                continue;
            }

            $categoria = (string) ($match['rule']['category']['id'] ?? '');

            $lista[] = [
                'offset' => (int) $match['offset'],
                'length' => (int) $match['length'],
                'message' => (string) $match['message'],
                // Três sugestões bastam: a lista inteira de uma palavra errada passa de dez.
                'replacements' => array_values(array_slice(array_map(
                    fn ($r) => (string) ($r['value'] ?? ''),
                    array_filter($match['replacements'] ?? [], 'is_array'),
                ), 0, 3)),
                'group' => self::GROUPS[$categoria] ?? 'estilo',
            ];
        }

        return $lista;
    }
}
