<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    /** Cinco alternativas, uma certa. O formato da prova, e o padrão. */
    public const FORMAT_CHOICE = 'choice';

    /** Pôr os passos na ordem. Mede sequência, que a múltipla escolha não mede. */
    public const FORMAT_ORDER = 'order';

    /** Ligar cada item da esquerda ao seu par na direita. */
    public const FORMAT_MATCH = 'match';

    /** Escrever uma parte de um texto (ou o texto inteiro, no simulado). Não tem gabarito. */
    public const FORMAT_WRITING = 'writing';

    /**
     * Julgar uma afirmação como certa ou errada, como no Cebraspe (PF, PRF e
     * muitas polícias). As opções são sempre "Certo" e "Errado", nessa ordem
     * e sem embaralhar: na prova elas não mudam de lugar, e o treino tem de
     * ser igual. A certa é guardada em `correct_index` (0 = Certo, 1 = Errado).
     */
    public const FORMAT_JUDGE = 'judge';

    public const FORMATS = [self::FORMAT_CHOICE, self::FORMAT_ORDER, self::FORMAT_MATCH, self::FORMAT_WRITING, self::FORMAT_JUDGE];

    /** As duas opções de uma questão de julgar, na ordem fixa. */
    public const JUDGE_OPTIONS = ['Certo', 'Errado'];

    /** Níveis de dificuldade. Opcional: questão sem nível não mostra etiqueta. */
    public const LEVELS = ['facil', 'media', 'dificil'];

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'pairs' => 'array',
            'writing' => 'array',
            'exam_only' => 'boolean',
            'correct_index' => 'integer',
        ];
    }

    public function isJudge(): bool
    {
        return $this->format === self::FORMAT_JUDGE;
    }

    public function isWriting(): bool
    {
        return $this->format === self::FORMAT_WRITING;
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
