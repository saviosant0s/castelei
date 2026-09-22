<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    | Os pares da questão de associar.
    |
    | Por que uma coluna nova, e não `options`: uma questão de associar não
    | tem alternativas, tem DUPLAS — "open" com "abrir um arquivo", "read"
    | com "ler". Espremer isso numa lista de textos pediria duas listas
    | paralelas, alinhadas por posição, e duas listas paralelas desalinham
    | na primeira edição feita numa só.
    |
    | Guardar {left, right} junto torna o desalinhamento impossível de
    | escrever.
    */
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->json('pairs')->nullable()->after('options');
        });
    }

    public function down(): void
    {
        Schema::table('questions', fn (Blueprint $table) => $table->dropColumn('pairs'));
    }
};
