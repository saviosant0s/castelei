<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'pitfalls' => 'array',
            'steps' => 'array',
        ];
    }

    /**
     * Etapas da lição. Se a lição ainda não tem etapas (conteúdo antigo), monta um conjunto
     * mínimo a partir dos campos antigos para a tela nunca ficar vazia.
     *
     * @return list<array<string, mixed>>
     */
    public function stepsOrFallback(): array
    {
        if (! empty($this->steps)) {
            return $this->steps;
        }

        $paragraphs = array_values(array_filter(preg_split("/\n{2,}/", (string) $this->explanation) ?: []));

        return array_values(array_filter([
            ['kind' => 'idea', 'title' => 'Resumo em 1 minuto', 'body' => [(string) $this->summary]],
            $paragraphs ? ['kind' => 'explain', 'title' => 'Explicando do jeito humano', 'body' => $paragraphs] : null,
            $this->exam_style ? ['kind' => 'exam', 'title' => 'Como cai na prova', 'body' => [(string) $this->exam_style]] : null,
            $this->pitfalls ? ['kind' => 'pitfall', 'title' => 'Pegadinhas clássicas', 'body' => ['Os erros mais comuns:'], 'bullets' => $this->pitfalls] : null,
        ]));
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('position');
    }
}
