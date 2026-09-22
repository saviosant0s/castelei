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

    public const FORMATS = [self::FORMAT_CHOICE, self::FORMAT_ORDER];

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'correct_index' => 'integer',
        ];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
