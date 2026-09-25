<?php

namespace App\Providers;

use App\Support\Writing\ClaudeWritingReviewer;
use App\Support\Writing\WritingReviewer;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Quem comenta o sentido de um texto. Nos testes, um leitor falso toma o lugar.
        $this->app->bind(WritingReviewer::class, ClaudeWritingReviewer::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
