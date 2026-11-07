<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| Turmas: o professor cria a turma de UMA matéria e convida os alunos por
| código. Quem entra concorda em mostrar ao dono o progresso naquela matéria —
| e só nela. Turma não é dona de conteúdo: a matéria continua a mesma de todo
| mundo, e o progresso continua morando em cada aluno.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classrooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->string('code', 12)->unique();
            $table->timestamps();
        });

        Schema::create('classroom_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['classroom_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classroom_members');
        Schema::dropIfExists('classrooms');
    }
};
