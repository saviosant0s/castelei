<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    | Área do conhecimento da matéria (Português, Matemática, Informática…).
    |
    | É a porta de entrada da tela inicial: Sistemas Operacionais é uma
    | disciplina, e mora dentro de Informática. A lista de áreas fica em
    | `config/castelei.php` (`areas`); aqui só se guarda o slug.
    |
    | As matérias que já existem ganham a área agora, pelo slug. Sem isso, uma
    | matéria que passou para o painel (e que o seeder pula) ficaria sem área
    | até alguém lembrar de abrir o formulário.
    */
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('area', 40)->nullable()->after('description');
        });

        $mapa = [
            'matematica-basica' => 'matematica',
            'portugues' => 'portugues',
            'producao-textual' => 'portugues',
            'sistemas-operacionais' => 'informatica',
            'servidores-vps' => 'informatica',
            'refatoracao' => 'informatica',
        ];

        foreach ($mapa as $slug => $area) {
            DB::table('subjects')->where('slug', $slug)->whereNull('area')->update(['area' => $area]);
        }
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('area');
        });
    }
};
