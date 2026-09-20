<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // O Castelei é independente: as lições não citam fontes. A coluna ficou sem uso.
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('source')->nullable()->after('summary');
        });
    }
};
