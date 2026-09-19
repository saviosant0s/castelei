<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SetupCommand extends Command
{
    protected $signature = 'castelei:setup';

    protected $description = 'Roda as migrations e carrega o conteúdo (idempotente). Usado no pre-deploy do Railway.';

    public function handle(): int
    {
        $this->call('migrate', ['--force' => true]);
        $this->call('db:seed', ['--force' => true]);

        return self::SUCCESS;
    }
}
