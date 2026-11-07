<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Classroom extends Model
{
    /** Letras e números sem os que se confundem lidos em voz alta (0 e O, 1 e I). */
    private const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public const CODE_LENGTH = 6;

    /** Teto de alunos por turma: protege a conta do painel e o servidor. */
    public const MAX_MEMBERS = 200;

    /** Teto de turmas por dono. */
    public const MAX_OWNED = 20;

    protected $guarded = [];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classroom_members')->withTimestamps();
    }

    public function isOwner(?User $user): bool
    {
        return $user !== null && $this->owner_id === $user->id;
    }

    public function hasMember(?User $user): bool
    {
        return $user !== null && $this->members()->whereKey($user->id)->exists();
    }

    /** O código vai em voz alta na sala de aula: maiúsculo, curto e sem 0/O nem 1/I. */
    public static function newCode(): string
    {
        do {
            $code = '';
            for ($i = 0; $i < self::CODE_LENGTH; $i++) {
                $code .= self::CODE_ALPHABET[random_int(0, strlen(self::CODE_ALPHABET) - 1)];
            }
        } while (self::where('code', $code)->exists());

        return $code;
    }

    /** O que a pessoa digitou, do jeito que fica guardado. */
    public static function normalizeCode(string $code): string
    {
        return Str::upper(preg_replace('/[^A-Za-z0-9]/', '', $code) ?? '');
    }
}
