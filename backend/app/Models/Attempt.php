<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Attempt extends Model
{
    public const KIND_LESSON = 'lesson';

    public const KIND_EXAM = 'exam';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'total_questions' => 'integer',
            'correct_count' => 'integer',
            'avg_seconds' => 'float',
            'question_ids' => 'array',
        ];
    }

    public function isExam(): bool
    {
        return $this->kind === self::KIND_EXAM;
    }

    /**
     * Questões que valem nesta tentativa. Tentativas antigas não guardaram a
     * lista, então caímos na regra original: as primeiras da lição.
     *
     * @return list<int>
     */
    public function allowedQuestionIds(): array
    {
        if (is_array($this->question_ids)) {
            return array_map('intval', $this->question_ids);
        }

        return $this->lesson
            ? $this->lesson->questions()->orderBy('position')->limit($this->total_questions)->pluck('id')->all()
            : [];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }
}
