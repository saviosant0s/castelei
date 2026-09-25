<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    | O quarto formato de questão: escrever.
    |
    | Na questão de escrita não há gabarito. Há um roteiro do que produzir
    | (`writing.steps`), o tamanho esperado, as conferências automáticas da
    | forma, a lista para a pessoa se avaliar e um texto-modelo que só aparece
    | depois de ela escrever. Tudo isso mora num JSON só porque é uma coisa só:
    | a folha de instruções daquela parte do texto.
    |
    | `exam_only` separa a proposta de texto inteiro, sem roteiro, que só o
    | simulado usa. Na lição o texto nasce por partes; no simulado, do zero.
    |
    | Na resposta, `text` é o que a pessoa escreveu e `checklist` é a
    | autoavaliação, item a item.
    */
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->json('writing')->nullable()->after('pairs');
            $table->boolean('exam_only')->default(false)->after('writing');
        });

        Schema::table('answers', function (Blueprint $table) {
            $table->text('text')->nullable()->after('selected_order');
            $table->json('checklist')->nullable()->after('text');
        });
    }

    public function down(): void
    {
        Schema::table('answers', fn (Blueprint $table) => $table->dropColumn(['text', 'checklist']));
        Schema::table('questions', fn (Blueprint $table) => $table->dropColumn(['writing', 'exam_only']));
    }
};
