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

        /*
        | Aqui havia um `storage:link`, e ele foi tirado por não fazer nada.
        |
        | Este comando roda no pre-deploy do Railway, que acontece num contêiner
        | separado e descartável: o atalho criado aqui morre antes de o contêiner
        | que atende as requisições subir. O log dizia "link has been connected"
        | e o arquivo respondia 404 do mesmo jeito.
        |
        | Quem entrega a mídia agora é uma rota — ver MediaFileController.
        */
        return self::SUCCESS;
    }
}
