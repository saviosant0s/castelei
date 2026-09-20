<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| O simulado reaproveita `attempts` e `answers`: muda só o que o simulado tem
| de diferente de uma lição. Ele não pertence a uma lição (sorteia questões de
| várias), então `lesson_id` passa a aceitar null e a tentativa guarda a matéria
| e a lista exata de questões sorteadas.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->foreignId('lesson_id')->nullable()->change();
            $table->string('kind', 16)->default('lesson')->after('user_id');
            $table->foreignId('subject_id')->nullable()->after('lesson_id')->constrained()->cascadeOnDelete();
            $table->json('question_ids')->nullable()->after('total_questions');

            $table->index(['user_id', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'kind']);
            $table->dropConstrainedForeignId('subject_id');
            $table->dropColumn(['kind', 'question_ids']);
            $table->foreignId('lesson_id')->nullable(false)->change();
        });
    }
};
