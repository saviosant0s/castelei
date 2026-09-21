<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        | Data da prova da matéria.
        |
        | Não é enfeite de calendário: é o que o agendamento de revisão usa como
        | prazo. A regra de Cepeda et al. (2008) define o intervalo ideal como
        | uma PROPORÇÃO do tempo que falta até o teste, então sem esta data o
        | sistema não tem como calcular nada e cai no plano de longo prazo.
        |
        | Fica na matéria, e não no usuário, porque a prova é do semestre: todo
        | mundo que estuda Sistemas Operacionais faz a prova em 15/12.
        */
        Schema::table('subjects', function (Blueprint $table) {
            $table->date('exam_date')->nullable()->after('position');
        });

        /*
        | Uma linha por (aluno, lição): quando aquela lição deve voltar.
        |
        | Só entra aqui lição já praticada — não se revisa o que nunca se
        | estudou. A linha é criada e reagendada no fim de cada tentativa.
        */
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();

            // Quando a lição volta para a fila. É por isso que a tabela existe.
            $table->timestamp('due_at');
            // Quando foi praticada pela última vez, e com que resultado.
            $table->timestamp('reviewed_at');
            $table->unsignedTinyInteger('last_percent')->nullable();
            // Intervalo usado neste agendamento, em dias. Guardado para a tela
            // poder explicar a decisão ("volta em 13 dias") sem recalcular.
            $table->unsignedSmallInteger('interval_days');
            // Quantas vezes o aluno voltou abaixo do piso de acerto. Cresce a
            // cautela: quem erra sempre não deve receber intervalo de quem acerta.
            $table->unsignedSmallInteger('lapses')->default(0);
            $table->timestamps();

            // Uma lição só tem um próximo encontro marcado por aluno.
            $table->unique(['user_id', 'lesson_id']);
            // A pergunta que a tela faz: "o que vence para mim, em ordem?"
            $table->index(['user_id', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('exam_date');
        });
    }
};
