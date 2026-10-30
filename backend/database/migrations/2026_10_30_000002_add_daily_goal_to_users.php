<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| A meta do dia: quanto XP a pessoa quer ganhar por dia. Mora na conta (e não
| no aparelho) porque o cabeçalho a mostra em toda tela e em todo aparelho.
| Nulo é o padrão, "normal" — guardar o número deixaria todo mundo preso ao
| valor de hoje se a régua mudar.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('daily_goal')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('daily_goal');
        });
    }
};
