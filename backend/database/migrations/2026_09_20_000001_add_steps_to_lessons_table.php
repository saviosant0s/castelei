<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Etapas da lição (uma ideia por tela). As colunas antigas (explanation, exam_style,
        // pitfalls) continuam existindo e são preenchidas a partir das etapas, para o app antigo
        // não quebrar durante o deploy. Podem ser removidas numa migration futura.
        Schema::table('lessons', function (Blueprint $table) {
            $table->json('steps')->nullable()->after('summary');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('steps');
        });
    }
};
