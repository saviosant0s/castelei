<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| O vídeo da LIÇÃO (não de uma etapa): uma aula do YouTube que a tela da
| lição oferece ao lado de "Ler" e "Fazer questões". Pedido do Sávio,
| novembro de 2026: no fim da leitura o vídeo ficava preso; na tela da lição,
| ele é um jeito a mais de estudar o mesmo assunto.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->json('video')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('video');
        });
    }
};
