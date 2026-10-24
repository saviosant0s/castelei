<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    | As dúvidas que a pessoa tirou com a IA no fim da lição, com a resposta.
    |
    | Guardadas pelo mesmo motivo das correções: cada resposta custa dinheiro,
    | e rever a de ontem não pode exigir perguntar de novo.
    */
    public function up(): void
    {
        Schema::create('lesson_doubts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->text('question');
            $table->text('answer');
            $table->timestamps();

            $table->index(['user_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_doubts');
    }
};
