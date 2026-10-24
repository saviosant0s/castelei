<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    | Nível de dificuldade da questão: facil, media ou dificil. Opcional —
    | questão sem nível não mostra etiqueta. As oito primeiras de cada lição
    | continuam sendo o que o grátis recebe (o corte é por posição, no limite
    | do plano); as que vierem depois delas, já com nível, são do Pro.
    */
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->string('difficulty', 10)->nullable()->after('format');
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('difficulty');
        });
    }
};
