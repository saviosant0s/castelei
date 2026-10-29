<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
| Matéria pública ou privada.
|
| Privada só aparece para quem administra o conteúdo: é o rascunho que o
| Sávio estuda e revisa antes de abrir para todo mundo. O padrão é pública,
| então matéria nova continua aparecendo como sempre.
*/
return new class extends Migration
{
    /** As matérias que nasceram para o semestre ou para a trilha pessoal. */
    private const PRIVADAS = [
        'sistemas-operacionais', 'servidores-vps', 'refatoracao', 'programacao-python',
        'algebra-linear', 'calculo', 'probabilidade-estatistica', 'redes-neurais',
        'llms-como-funcionam', 'llms-na-pratica', 'montar-pc',
    ];

    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('visibility', 10)->default('public')->after('area');
        });

        // O arquivo do repositório também diz isso, mas a matéria que passou para
        // o painel o seeder pula: sem esta linha, ela continuaria aberta.
        DB::table('subjects')->whereIn('slug', self::PRIVADAS)->update(['visibility' => 'private']);
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('visibility');
        });
    }
};
