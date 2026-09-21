<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class AdminCommand extends Command
{
    protected $signature = 'castelei:admin {email} {--remover : Tira o acesso em vez de dar}';

    protected $description = 'Dá (ou tira) acesso ao painel de conteúdo para uma conta já existente.';

    public function handle(): int
    {
        $email = Str::lower(trim((string) $this->argument('email')));
        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("Não existe conta com o e-mail {$email}. Cadastre-se no app primeiro.");

            return self::FAILURE;
        }

        $user->is_admin = ! $this->option('remover');
        $user->save();

        $this->info($user->is_admin
            ? "{$user->name} ({$email}) agora administra o conteúdo."
            : "{$user->name} ({$email}) não administra mais o conteúdo.");

        return self::SUCCESS;
    }
}
