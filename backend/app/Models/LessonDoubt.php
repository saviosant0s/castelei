<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Uma dúvida tirada com a IA no fim da lição, com a resposta. */
class LessonDoubt extends Model
{
    protected $fillable = ['user_id', 'lesson_id', 'question', 'answer'];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'question' => $this->question,
            'answer' => $this->answer,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
