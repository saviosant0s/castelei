<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Um aparelho que aceitou receber lembrete.
 *
 * Quem assina é o navegador, não a conta: a mesma pessoa no celular e no
 * computador tem duas linhas.
 */
class PushSubscription extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['last_notified_at' => 'datetime'];
    }

    /** O endpoint é longo demais para índice único; a unicidade vai pelo resumo. */
    public static function hashOf(string $endpoint): string
    {
        return hash('sha256', $endpoint);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
