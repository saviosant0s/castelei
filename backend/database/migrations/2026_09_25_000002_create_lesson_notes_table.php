<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    | Anotação da pessoa numa lição: o que ela entendeu, com as palavras dela.
    |
    | Mora no servidor, e não no aparelho, porque é histórico de estudo — o
    | mesmo motivo de a conta existir. Uma por pessoa por lição: é um caderno,
    | não um fórum.
    */
    public function up(): void
    {
        Schema::create('lesson_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->text('text');
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_notes');
    }
};
