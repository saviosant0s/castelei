<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Lição LIDA até o fim, com ou sem prática. É o meio-termo da trilha: quem leu
| tudo e não fez as questões não está no zero, mas também não praticou. Mora
| na conta, e não no aparelho, porque a trilha é o mapa do estudo e tem que
| ser a mesma no celular e no computador.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_reads');
    }
};
