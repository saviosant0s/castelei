<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    protected $guarded = [];

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('position');
    }

    /** Veio dos arquivos do repositório e o seeder ainda manda nela? */
    public function isSeeded(): bool
    {
        return $this->origin === 'seed';
    }

    /**
     * Passa a matéria para o painel.
     *
     * Chamado por toda escrita vinda do painel, inclusive nas lições e questões
     * dela. A partir daqui o ContentSeeder pula esta matéria — se não pulasse, o
     * pre-deploy seguinte recarregaria o arquivo antigo por cima da edição e
     * ninguém veria acontecer.
     */
    public function takeOverByPanel(): void
    {
        if ($this->origin === 'painel') {
            return;
        }

        $this->origin = 'painel';
        $this->save();
    }
}
