<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Entrega as imagens e vídeos enviados pelo painel.
 *
 * Por que uma rota, e não o atalho `public/storage` que o Laravel usa:
 *
 * O atalho é criado por `php artisan storage:link`, que aqui roda no
 * pre-deploy do Railway — e o pre-deploy acontece num contêiner separado e
 * descartável, antes de o volume ser montado. O atalho morre com esse
 * contêiner e nunca chega ao que atende as requisições, então todo arquivo
 * enviado responderia 404 sem nada no log explicando.
 *
 * A rota não depende de atalho nenhum, e ainda cobre o dia em que a mídia sair
 * para armazenamento externo: com MEDIA_DISK=s3 ela redireciona em vez de
 * servir, sem que nada mais no código mude.
 *
 * É pública de propósito: uma figura dentro da lição é carregada por uma tag
 * `img`, que não tem como mandar o token da sessão. Não há segredo aqui — é o
 * mesmo desenho do `public/storage` que ela substitui.
 */
class MediaFileController extends Controller
{
    public function __invoke(string $path): BinaryFileResponse|RedirectResponse
    {
        $disk = (string) config('castelei.media.disk');
        $storage = Storage::disk($disk);

        abort_unless($storage->exists($path), 404);

        // Disco externo (S3, R2): quem entrega é ele, não o PHP.
        if (! method_exists($storage, 'path')) {
            return redirect()->away($storage->url($path));
        }

        /*
        | Cache longo sem medo: todo arquivo ganha um sufixo aleatório no nome
        | ao ser enviado, então um endereço nunca passa a apontar para outro
        | conteúdo. Trocar a figura gera um endereço novo.
        |
        | O `file()` responde a pedidos de trecho (Range), que é o que deixa
        | adiantar um vídeo sem baixá-lo inteiro.
        */
        return response()->file($storage->path($path), [
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
