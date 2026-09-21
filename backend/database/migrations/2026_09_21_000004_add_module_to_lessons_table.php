<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A que módulo a lição pertence.
 *
 * Trinta lições numa lista só não mostram caminho nenhum. Agrupá-las por
 * assunto é o que transforma a tela em trilha, e o agrupamento precisa vir de
 * quem escreve o conteúdo: deduzir módulo do título é chute que erra na
 * primeira lição com nome fora do padrão.
 *
 * Guarda só o nome ("Processos"), nunca o número. O número sai da ordem das
 * lições na hora de mostrar — assim reordenar a matéria não deixa para trás um
 * "Módulo 5" no meio do caminho.
 *
 * Nulo é resposta válida: matéria curta não precisa de módulo e aparece como
 * uma trilha só, sem cabeçalho.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('module')->nullable()->after('position');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('module');
        });
    }
};
