<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| O quanto um assunto cai na prova, e de qual prova a questão veio.
|
| Pedido do Sávio, novembro de 2026, ao montar a trilha de perito: "esse
| assunto é bem importante, cai bastante". A importância é da LIÇÃO (`alta`,
| `media` ou `baixa`) e sai da contagem de itens das provas reais, em
| docs/trilha-perito.md. Lição sem marca não mostra nada.
|
| `exam_ref` diz qual item de prova real inspirou a questão ("PF 2025, item
| 108"). A questão é escrita por nós; a referência mostra que o assunto caiu,
| sem copiar o texto da banca.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('incidence', 8)->nullable();
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->string('exam_ref', 120)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('incidence');
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('exam_ref');
        });
    }
};
