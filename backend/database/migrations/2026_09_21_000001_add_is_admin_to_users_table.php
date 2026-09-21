<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Quem pode entrar no painel de conteúdo. Nada a ver com plano: plano é
        // o que a pessoa estuda, isto é o que ela pode publicar.
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('plan');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
