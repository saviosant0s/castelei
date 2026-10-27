<?php

namespace App\Support\Media;

use Illuminate\Support\Facades\DB;
use League\Flysystem\Config;
use League\Flysystem\DirectoryAttributes;
use League\Flysystem\FileAttributes;
use League\Flysystem\FilesystemAdapter;
use League\Flysystem\UnableToReadFile;
use League\Flysystem\UnableToSetVisibility;

/**
 * Disco que guarda o arquivo dentro do próprio banco (`media_files`).
 *
 * Existe por causa do Vercel: lá a API roda em função sem disco — o que se
 * grava some no fim da requisição. Armazenamento externo seria mais um
 * serviço, mais uma conta e mais uma chave, para meia dúzia de figuras. O
 * banco já existe e já tem cópia.
 *
 * O conteúdo vai em base64 num campo de texto, e não em coluna binária: o
 * PDO do Postgres devolve `bytea` como recurso e o do SQLite como texto, e
 * isso faria o teste passar e a produção quebrar. Custa um terço a mais de
 * espaço, e o envio já é limitado a poucos megabytes.
 *
 * Pasta não existe aqui: o caminho é só um nome. `directoryExists` diz sim
 * quando algum arquivo começa por ele, que é o que o Laravel precisa saber.
 */
class DatabaseAdapter implements FilesystemAdapter
{
    public function __construct(private string $table = 'media_files') {}

    private function query()
    {
        return DB::table($this->table);
    }

    public function fileExists(string $path): bool
    {
        return $this->query()->where('path', $path)->exists();
    }

    public function directoryExists(string $path): bool
    {
        return $this->query()->where('path', 'like', rtrim($path, '/').'/%')->exists();
    }

    public function write(string $path, string $contents, Config $config): void
    {
        $this->query()->updateOrInsert(['path' => $path], [
            'contents' => base64_encode($contents),
            'mime_type' => $config->get('mimetype') ?? (new \finfo(FILEINFO_MIME_TYPE))->buffer($contents) ?: null,
            'size' => strlen($contents),
            'updated_at' => now(),
            'created_at' => now(),
        ]);
    }

    public function writeStream(string $path, $contents, Config $config): void
    {
        $this->write($path, (string) stream_get_contents($contents), $config);
    }

    public function read(string $path): string
    {
        $row = $this->query()->where('path', $path)->first(['contents']);

        if ($row === null) {
            throw UnableToReadFile::fromLocation($path, 'O arquivo não existe.');
        }

        return (string) base64_decode($row->contents, true);
    }

    public function readStream(string $path)
    {
        $stream = fopen('php://temp', 'w+b');
        fwrite($stream, $this->read($path));
        rewind($stream);

        return $stream;
    }

    public function delete(string $path): void
    {
        $this->query()->where('path', $path)->delete();
    }

    public function deleteDirectory(string $path): void
    {
        $this->query()->where('path', 'like', rtrim($path, '/').'/%')->delete();
    }

    public function createDirectory(string $path, Config $config): void
    {
        // Pasta é só prefixo de nome: não há o que criar.
    }

    public function setVisibility(string $path, string $visibility): void
    {
        throw UnableToSetVisibility::atLocation($path, 'Todo arquivo daqui é público, servido pela rota de mídia.');
    }

    public function visibility(string $path): FileAttributes
    {
        return new FileAttributes($path, null, 'public');
    }

    public function mimeType(string $path): FileAttributes
    {
        return $this->attributes($path);
    }

    public function lastModified(string $path): FileAttributes
    {
        return $this->attributes($path);
    }

    public function fileSize(string $path): FileAttributes
    {
        return $this->attributes($path);
    }

    public function listContents(string $path, bool $deep): iterable
    {
        $prefixo = trim($path, '/');
        $rows = $this->query()
            ->when($prefixo !== '', fn ($q) => $q->where('path', 'like', $prefixo.'/%'))
            ->orderBy('path')
            ->get(['path', 'size', 'mime_type', 'updated_at']);

        $pastas = [];

        foreach ($rows as $row) {
            $resto = $prefixo === '' ? $row->path : substr($row->path, strlen($prefixo) + 1);

            if (! $deep && str_contains($resto, '/')) {
                $pasta = ($prefixo === '' ? '' : $prefixo.'/').explode('/', $resto)[0];
                $pastas[$pasta] ??= new DirectoryAttributes($pasta);

                continue;
            }

            yield $this->toAttributes($row);
        }

        yield from array_values($pastas);
    }

    public function move(string $source, string $destination, Config $config): void
    {
        $this->query()->where('path', $destination)->delete();
        $this->query()->where('path', $source)->update(['path' => $destination, 'updated_at' => now()]);
    }

    public function copy(string $source, string $destination, Config $config): void
    {
        $this->write($destination, $this->read($source), $config);
    }

    private function attributes(string $path): FileAttributes
    {
        $row = $this->query()->where('path', $path)->first(['path', 'size', 'mime_type', 'updated_at']);

        if ($row === null) {
            throw UnableToReadFile::fromLocation($path, 'O arquivo não existe.');
        }

        return $this->toAttributes($row);
    }

    private function toAttributes(object $row): FileAttributes
    {
        return new FileAttributes(
            $row->path,
            (int) $row->size,
            'public',
            $row->updated_at ? strtotime((string) $row->updated_at) : null,
            $row->mime_type,
        );
    }
}
