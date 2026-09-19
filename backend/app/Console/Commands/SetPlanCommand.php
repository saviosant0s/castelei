<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Plans;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SetPlanCommand extends Command
{
    protected $signature = 'castelei:plan {email : E-mail do usuário} {plan : free, plus ou pro}';

    protected $description = 'Define o plano de um usuário (o pagamento ainda não está integrado no MVP).';

    public function handle(): int
    {
        $plan = Str::lower((string) $this->argument('plan'));

        if (! Plans::exists($plan)) {
            $this->error('Plano inválido. Use: '.implode(', ', array_keys(Plans::all())).'.');

            return self::FAILURE;
        }

        $user = User::where('email', Str::lower((string) $this->argument('email')))->first();

        if (! $user) {
            $this->error('Usuário não encontrado.');

            return self::FAILURE;
        }

        $user->forceFill(['plan' => $plan])->save();
        $this->info("{$user->email} agora está no plano {$plan}.");

        return self::SUCCESS;
    }
}
