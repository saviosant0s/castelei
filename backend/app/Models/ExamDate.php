<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A data da prova que UMA pessoa marcou para UMA matéria. */
class ExamDate extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        // Dia de calendário, não instante: ver Subject::casts.
        return ['exam_date' => 'date:Y-m-d'];
    }

    /** subject_id => "AAAA-MM-DD" das datas desta pessoa. @return array<int, string> */
    public static function mapFor(?User $user): array
    {
        if ($user === null) {
            return [];
        }

        return self::where('user_id', $user->id)
            ->get(['subject_id', 'exam_date'])
            ->mapWithKeys(fn (self $d) => [(int) $d->subject_id => $d->exam_date->format('Y-m-d')])
            ->all();
    }
}
