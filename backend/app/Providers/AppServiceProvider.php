<?php

namespace App\Providers;

use App\Support\Media\DatabaseAdapter;
use App\Support\Notes\ClaudeDoubtAnswerer;
use App\Support\Notes\ClaudeNoteReviewer;
use App\Support\Notes\DoubtAnswerer;
use App\Support\Notes\NoteReviewer;
use App\Support\Writing\ClaudeWritingReviewer;
use App\Support\Writing\WritingReviewer;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\Filesystem;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Quem comenta o sentido de um texto. Nos testes, um leitor falso toma o lugar.
        $this->app->bind(WritingReviewer::class, ClaudeWritingReviewer::class);
        // Quem confere a anotação da lição contra o conteúdo dela.
        $this->app->bind(NoteReviewer::class, ClaudeNoteReviewer::class);
        // Quem responde a dúvida do fim da lição.
        $this->app->bind(DoubtAnswerer::class, ClaudeDoubtAnswerer::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Disco de mídia dentro do banco (ver DatabaseAdapter).
        Storage::extend('database', function ($app, array $config) {
            $adapter = new DatabaseAdapter($config['table'] ?? 'media_files');

            return new FilesystemAdapter(new Filesystem($adapter, $config), $adapter, $config);
        });
    }
}
