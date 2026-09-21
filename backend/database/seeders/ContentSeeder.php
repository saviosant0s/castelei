<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Support\Content\ContentImporter;
use Illuminate\Database\Seeder;

/**
 * Carrega matérias, lições e questões de database/seeders/content/*.json.
 * É idempotente: pode rodar a cada deploy sem duplicar nada.
 *
 * O trabalho de gravar é do ContentImporter — o mesmo que o painel usa. Aqui só
 * sobra decidir *quais* arquivos ainda mandam.
 *
 * Uma matéria marcada como `origin = 'painel'` é pulada. Sem isso, o seeder
 * roda no pre-deploy e desfaz em silêncio tudo que foi editado pelo painel: o
 * arquivo é antigo, mas é ele que roda por último. A matéria muda de dono no
 * momento em que o painel escreve nela, e a partir daí o arquivo vira histórico.
 */
class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $files = glob(__DIR__.'/content/*.json') ?: [];
        sort($files);

        $doPainel = Subject::where('origin', 'painel')->pluck('slug')->all();
        $importer = new ContentImporter;

        foreach ($files as $index => $file) {
            $data = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);

            if (in_array($data['slug'], $doPainel, true)) {
                $this->command?->info("Pulando {$data['slug']}: agora é editada pelo painel.");

                continue;
            }

            $importer->import($data, origin: 'seed', position: $index + 1);
        }
    }
}
