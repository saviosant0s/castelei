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
 * seeder roda no build, longe do banco, e regravar as milhares de questões a
 * cada deploy leva tempo demais para não mudar nada. A marca é o resumo do
 * arquivo JUNTO com a versão da regra (ContentImporter::VERSAO): quem muda a
 * importação de um jeito que exige regravar tudo sobe a versão.
 *
 * Antes a regra era o resumo do arquivo do importador inteiro, e mexer nele
 * recarregava todas as matérias: o build estourou o limite de 45 minutos.
 * As marcas gravadas nesse regime continuam aceitas (MARCAS_ANTIGAS), senão a
 * troca de regra causaria a mesma recarga completa que ela existe para evitar.
 */
class ContentSeeder extends Seeder
{
    /**
     * Resumos do arquivo do ContentImporter das versões que já gravaram marcas
     * em produção (antes e depois da coluna de vídeo da lição). Um arquivo de
     * conteúdo cuja marca bate com uma delas já está no banco como deve.
     */
    private const MARCAS_ANTIGAS = ['76c81a4d9e56116126dc762a76631c4a', '49e71ed0575ab4d2aa3f9b1d93d5ca71'];

    public function run(): void
    {
        $files = glob(__DIR__.'/content/*.json') ?: [];
        sort($files);

        $doPainel = Subject::where('origin', 'painel')->pluck('slug')->all();
        $importer = new ContentImporter;
        $regra = 'versao-'.ContentImporter::VERSAO;

        foreach ($files as $index => $file) {
            $texto = file_get_contents($file);
            $data = json_decode($texto, true, 512, JSON_THROW_ON_ERROR);

            if (in_array($data['slug'], $doPainel, true)) {
                $this->command?->info("Pulando {$data['slug']}: agora é editada pelo painel.");

                continue;
            }

            $chave = "conteudo-carregado:{$data['slug']}";
            $marca = md5($texto.$regra.($index + 1));
            $guardada = Cache::get($chave);
            $antigas = array_map(fn ($r) => md5($texto.$r.($index + 1)), self::MARCAS_ANTIGAS);

            if (($guardada === $marca || in_array($guardada, $antigas, true)) && Subject::where('slug', $data['slug'])->exists()) {
                if ($guardada !== $marca) {
                    Cache::forever($chave, $marca);
                }

                continue;
            }

            $importer->import($data, origin: 'seed', position: $index + 1);
            Cache::forever($chave, $marca);
        }
    }
}
