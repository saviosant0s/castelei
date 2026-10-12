<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Uma correção por IA da anotação, com o texto que foi corrigido. */
class NoteReview extends Model
{
    protected $fillable = ['user_id', 'lesson_id', 'note_text', 'review'];

    protected function casts(): array
    {
        return ['review' => 'array'];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'note_text' => $this->note_text,
            'review' => $this->review,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
