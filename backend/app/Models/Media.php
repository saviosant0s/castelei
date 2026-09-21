<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * Um arquivo enviado pelo painel: figura ou vídeo de lição.
 *
 * O arquivo em si mora no disco configurado em `castelei.media.disk`; aqui fica
 * só a ficha dele. É a ficha que dá o endereço público usado dentro das etapas.
 */
class Media extends Model
{
    protected $table = 'media';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** Endereço público do arquivo, do jeito que entra no `src` da etapa. */
    public function url(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    /** @return array<string, mixed> */
    public function payload(): array
    {
        return [
            'id' => $this->id,
            'kind' => $this->kind,
            'url' => $this->url(),
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'alt' => $this->alt,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
