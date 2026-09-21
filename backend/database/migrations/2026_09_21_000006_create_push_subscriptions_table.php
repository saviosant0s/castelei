<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        | Assinaturas de notificação, uma por aparelho.
        |
        | Quem assina é o NAVEGADOR, não a conta: a mesma pessoa no celular e no
        | computador tem duas linhas, e desligar num não desliga no outro. É o
        | que o padrão Web Push permite, e também o que a pessoa espera.
        |
        | `endpoint` é o endereço que o serviço de push do navegador (FCM, Mozilla,
        | Apple) deu para este aparelho. É único no mundo — por isso é ele a chave,
        | e não (usuário, aparelho), que não temos como identificar.
        |
        | `p256dh` e `auth` são as chaves com que o navegador decifra a mensagem.
        | Sem elas o servidor até entrega o aviso, mas o aparelho não consegue ler.
        */
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('endpoint');
            $table->string('p256dh');
            $table->string('auth');
            /*
            | Quando este aparelho recebeu o último lembrete.
            |
            | É o que garante "no máximo um por dia": sem isso, rodar o comando
            | duas vezes (uma repetição do agendador, uma execução à mão) mandaria
            | dois avisos, e app de estudo que avisa duas vezes vira app desinstalado.
            */
            $table->timestamp('last_notified_at')->nullable();
            $table->timestamps();

            /*
            | O endpoint é longo demais para um índice único no MySQL/Postgres
            | sem limite de tamanho, então a unicidade vai por um resumo dele.
            */
            $table->string('endpoint_hash', 64)->unique();
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
