<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;
use Throwable;

class GenerateVapidKeys extends Command
{
    protected $signature = 'castelei:vapid';

    protected $description = 'Gera o par de chaves VAPID usado pelos lembretes (Web Push).';

    public function handle(): int
    {
        try {
            $keys = VAPID::createVapidKeys();
        } catch (Throwable $e) {
            $this->error('Não deu para gerar as chaves: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->newLine();
        $this->line('Ponha estas duas variáveis no ambiente (no Railway, no serviço <fg=cyan>backend</>):');
        $this->newLine();
        $this->line("<fg=green>VAPID_PUBLIC_KEY</>={$keys['publicKey']}");
        $this->line("<fg=green>VAPID_PRIVATE_KEY</>={$keys['privateKey']}");
        $this->newLine();
        $this->warn('A chave PRIVADA é segredo: quem a tiver manda notificação em nome do Castelei.');
        $this->warn('Nunca commite. Nunca cole em chat.');
        $this->newLine();
        $this->line('Trocar o par depois derruba TODAS as assinaturas existentes: cada aparelho');
        $this->line('precisaria aceitar o lembrete de novo. Gere uma vez e guarde.');

        return self::SUCCESS;
    }
}
