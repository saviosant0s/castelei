<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * De onde vem cada matéria.
     *
     * Até aqui os JSON em database/seeders/content eram a única fonte, e o
     * ContentSeeder rodava a cada deploy com updateOrCreate. Com o painel,
     * passam a existir duas mãos escrevendo no mesmo lugar — e a do seeder
     * roda depois, no pre-deploy, então ela venceria: toda edição feita no
     * painel voltaria atrás sozinha no deploy seguinte, sem aviso.
     *
     * Esta coluna decide quem manda em cada matéria. `seed` = os arquivos
     * continuam mandando. `painel` = o seeder não encosta mais nela.
     */
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('origin')->default('seed')->after('position');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('origin');
        });
    }
};
