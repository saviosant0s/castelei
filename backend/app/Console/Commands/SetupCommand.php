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

        // As figuras e vídeos enviados pelo painel são servidos por public/storage,
        // que é um atalho para storage/app/public. O contêiner nasce sem ele a cada
        // deploy, então o atalho é refeito aqui. Só vale para o disco local: com
        // MEDIA_DISK=s3 os arquivos nem passam por aqui.
        if (config('castelei.media.disk') === 'public') {
            $this->call('storage:link', ['--force' => true]);
        }

        return self::SUCCESS;
    }
}
