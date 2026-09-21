<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            // 'image' ou 'video'. Guardado em coluna própria para a biblioteca
            // filtrar sem precisar interpretar o mime a cada listagem.
            $table->string('kind');
            $table->string('disk');
            $table->string('path')->unique();
            $table->string('original_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            // Descrição para quem usa leitor de tela. Toda figura precisa de uma
            // (regra 6 do guia de conteúdo), então ela nasce junto do arquivo.
            $table->string('alt')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('kind');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
