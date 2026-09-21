<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Biblioteca de mídia: as figuras e vídeos que as lições usam.
 *
 * O arquivo vai para o disco configurado em `castelei.media.disk` e o endereço
 * devolvido é o que se cola dentro da etapa. As figuras antigas continuam onde
 * estavam, em frontend/public/figuras — endereço que começa com "/" é servido
 * pelo próprio app, e nada disso muda.
 */
class MediaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $kind = $request->query('kind');

        $media = Media::query()
            ->when(in_array($kind, ['image', 'video'], true), fn ($query) => $query->where('kind', $kind))
            ->latest('id')
            ->limit(200)
            ->get();

        return response()->json([
            'media' => $media->map(fn (Media $item) => $item->payload())->values(),
            'limits' => [
                'max_image_kb' => (int) config('castelei.media.max_image_kb'),
                'max_video_kb' => (int) config('castelei.media.max_video_kb'),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $imagens = (array) config('castelei.media.image_mimes');
        $videos = (array) config('castelei.media.video_mimes');

        $request->validate([
            'file' => ['required', 'file', 'mimetypes:'.implode(',', [...$imagens, ...$videos])],
            'alt' => ['nullable', 'string', 'max:300'],
        ], [
            'file.required' => 'Escolha um arquivo.',
            'file.mimetypes' => 'Formato não aceito. Imagens: PNG, JPEG, WebP, GIF e SVG. Vídeos: MP4, WebM e OGG.',
        ]);

        $file = $request->file('file');
        $kind = in_array($file->getMimeType(), $videos, true) ? 'video' : 'image';

        $limiteKb = (int) config($kind === 'video' ? 'castelei.media.max_video_kb' : 'castelei.media.max_image_kb');

        if ($file->getSize() > $limiteKb * 1024) {
            $limiteMb = round($limiteKb / 1024, 1);

            return response()->json([
                'message' => $kind === 'video'
                    ? "O vídeo passou de {$limiteMb} MB. Corte o trecho que interessa ou hospede no YouTube e cole o link na etapa."
                    : "A imagem passou de {$limiteMb} MB. Diminua o tamanho antes de enviar.",
                'errors' => ['file' => ['Arquivo grande demais.']],
            ], 422);
        }

        $disk = (string) config('castelei.media.disk');
        $path = $file->storeAs(
            'midia/'.$kind.'s',
            $this->fileName($file),
            ['disk' => $disk, 'visibility' => 'public'],
        );

        if ($path === false) {
            return response()->json([
                'message' => 'Não foi possível guardar o arquivo. Tente de novo em instantes.',
            ], 500);
        }

        $media = Media::create([
            'kind' => $kind,
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'alt' => $request->input('alt'),
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json(['media' => $media->payload()], 201);
    }

    public function update(Request $request, Media $media): JsonResponse
    {
        $data = $request->validate([
            'alt' => ['nullable', 'string', 'max:300'],
        ]);

        $media->update($data);

        return response()->json(['media' => $media->payload()]);
    }

    /**
     * Tira o arquivo do disco e a ficha do banco.
     *
     * Não há como saber daqui se alguma etapa ainda aponta para ele — as etapas
     * guardam o endereço como texto solto dentro do JSON. Por isso o painel
     * avisa antes, e o que some é a figura, não a lição.
     */
    public function destroy(Media $media): JsonResponse
    {
        Storage::disk($media->disk)->delete($media->path);
        $media->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Nome novo para o arquivo guardado.
     *
     * O nome original vira só rótulo na biblioteca. No disco entra um nome
     * previsível e único: acentos, espaços e maiúsculas em URL dão problema, e
     * dois envios do mesmo "grafico.png" não podem brigar pelo mesmo lugar.
     */
    private function fileName(UploadedFile $file): string
    {
        $base = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'arquivo';
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin');

        return Str::limit($base, 60, '').'-'.Str::lower(Str::random(6)).'.'.$ext;
    }
}
