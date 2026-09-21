<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Quem administra o conteúdo.
 *
 * A lista de e-mails vem da variável ADMIN_EMAILS e serve de porta de entrada:
 * no Railway dá para criar uma variável pelo navegador, mas rodar
 * `php artisan castelei:admin` exige CLI. Sem a lista, a primeira conta de
 * administrador não teria como existir.
 */
class Admins
{
    /** @return list<string> e-mails normalizados (minúsculas, sem espaço) */
    public static function emails(): array
    {
        $raw = (string) config('castelei.admin_emails', '');

        return array_values(array_filter(array_map(
            fn (string $email) => Str::lower(trim($email)),
            explode(',', $raw),
        )));
    }

    public static function allows(?string $email): bool
    {
        if ($email === null || trim($email) === '') {
            return false;
        }

        return in_array(Str::lower(trim($email)), self::emails(), true);
    }
}
