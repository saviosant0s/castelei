<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
| A data da prova passa a ser de CADA PESSOA, e não da matéria.
|
| Decisão do Sávio: quem diz quando é a prova é quem estuda. Na matéria ela
| servia a um semestre só (Sistemas Operacionais, 15/12); numa matéria
| pública, cada um tem a sua — o ENEM, o vestibular, o concurso.
|
| E as revisões ganham o estado do FSRS (estabilidade e dificuldade), usado
| quando a pessoa não marcou data. Ver docs/revisao-espacada.md.
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->date('exam_date');
            $table->timestamps();

            $table->unique(['user_id', 'subject_id']);
        });

        // Quem já estudava uma matéria com data marcada continua com ela: o
        // cronograma de revisão dessa pessoa não pode mudar sem ela pedir.
        $comData = DB::table('subjects')->whereNotNull('exam_date')->get(['id', 'exam_date']);
        foreach ($comData as $subject) {
            $usuarios = DB::table('attempts')
                ->join('lessons', 'lessons.id', '=', 'attempts.lesson_id')
                ->where('lessons.subject_id', $subject->id)
                ->distinct()
                ->pluck('attempts.user_id');

            foreach ($usuarios as $userId) {
                DB::table('exam_dates')->insertOrIgnore([
                    'user_id' => $userId,
                    'subject_id' => $subject->id,
                    'exam_date' => $subject->exam_date,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        Schema::table('reviews', function (Blueprint $table) {
            // Dias até a chance de lembrar cair para 90% (FSRS).
            $table->float('stability')->nullable()->after('lapses');
            // De 1 a 10: o quanto esta lição custa para esta pessoa (FSRS).
            $table->float('difficulty')->nullable()->after('stability');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['stability', 'difficulty']);
        });
        Schema::dropIfExists('exam_dates');
    }
};
