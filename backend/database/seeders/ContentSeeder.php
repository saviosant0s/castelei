<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Support\Content\ContentImporter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

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
 *
 * Arquivo que não mudou desde a última carga também é pulado. No Vercel o
 * seeder roda no build, longe do banco, e regravar as quase duas mil questões
 * a cada deploy levava uns dez minutos para não mudar nada. A marca é o resumo
 * do arquivo JUNTO com o do importador: mudar a regra de importação também
 * conta como mudança, senão uma coluna derivada nova nunca seria preenchida.
 */
class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $files = glob(__DIR__.'/content/*.json') ?: [];
        sort($files);

        $doPainel = Subject::where('origin', 'painel')->pluck('slug')->all();
        $importer = new ContentImporter;
        $regra = md5_file((new \ReflectionClass(ContentImporter::class))->getFileName());

        foreach ($files as $index => $file) {
            $texto = file_get_contents($file);
            $data = json_decode($texto, true, 512, JSON_THROW_ON_ERROR);

            if (in_array($data['slug'], $doPainel, true)) {
                $this->command?->info("Pulando {$data['slug']}: agora é editada pelo painel.");

                continue;
            }

            $chave = "conteudo-carregado:{$data['slug']}";
            $marca = md5($texto.$regra.($index + 1));

            if (Cache::get($chave) === $marca && Subject::where('slug', $data['slug'])->exists()) {
                continue;
            }

            $importer->import($data, origin: 'seed', position: $index + 1);
            Cache::forever($chave, $marca);
        }
    }
}
