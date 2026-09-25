<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            /*
            | `date:Y-m-d` e não `date`: a prova é um dia do calendário, não um
            | instante. Sem o formato, a API devolveria "2026-12-15T00:00:00Z" e
            | quem lesse isso em São Paulo veria 14/12.
            */
            'exam_date' => 'date:Y-m-d',
        ];
    }

    /**
     * As áreas do conhecimento, na ordem da tela inicial.
     *
     * @return list<array{slug: string, name: string}>
     */
    public static function areas(): array
    {
        return collect((array) config('castelei.areas'))
            ->map(fn (string $name, string $slug) => ['slug' => $slug, 'name' => $name])
            ->values()
            ->all();
    }

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
