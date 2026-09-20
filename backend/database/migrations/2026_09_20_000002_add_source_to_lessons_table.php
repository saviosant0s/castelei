<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // De onde a lição veio (ex.: capítulo e seção do livro), para o aluno ler mais.
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('source')->nullable()->after('summary');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
