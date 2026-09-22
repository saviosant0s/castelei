<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    | O formato da questão.
    |
    | Até aqui só existia um: cinco alternativas, uma certa. Ele continua
    | sendo o principal, porque é o formato da prova que o aluno vai fazer —
    | mas ele só mede RECONHECER. Pôr quatro passos na ordem é outra
    | habilidade, e é a que a matéria mais cobra: fork antes de execve, o
    | pedido antes do TRAP, liberar o SSH antes de ligar o firewall.
    |
    | `format` nasce com "choice" em todas as questões que já existem, então
    | nada muda para quem já estudou.
    */
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->string('format', 16)->default('choice')->after('position');
        });

        /*
        | O que a pessoa respondeu numa questão de ordenar.
        |
        | `selected_index` não serve: a resposta é uma sequência, não uma
        | alternativa. Sem esta coluna, pular e errar ficariam iguais no
        | banco — e responder errado não é o mesmo que não responder.
        */
        Schema::table('answers', function (Blueprint $table) {
            $table->json('selected_order')->nullable()->after('selected_index');
        });
    }

    public function down(): void
    {
        Schema::table('questions', fn (Blueprint $table) => $table->dropColumn('format'));
        Schema::table('answers', fn (Blueprint $table) => $table->dropColumn('selected_order'));
    }
};
