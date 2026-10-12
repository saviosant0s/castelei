<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    | Cada correção por IA da anotação fica guardada, com o texto que foi
    | corrigido. Correção custa dinheiro: rever a de ontem não pode exigir
    | pedir outra. E guardar o texto junto — não só a correção — é o que deixa
    | comparar "o que eu disse" com "o que estava errado" depois que a
    | anotação já foi reescrita.
    */
    public function up(): void
    {
        Schema::create('note_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->text('note_text');
            $table->json('review');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('note_reviews');
    }
};
