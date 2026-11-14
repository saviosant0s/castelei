<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    public const PUBLIC = 'public';

    /** Só quem administra o conteúdo vê: é a matéria em revisão, ou de uso pessoal. */
    public const PRIVATE = 'private';

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

    /**
     * Os grupos de uma área, na ordem de estudo, só com o que esta pessoa vê.
     *
     * Vem de `config('castelei.area_groups')`. Matéria que a pessoa não vê
     * (privada) sai da lista, e o grupo que fica vazio some — o nome de uma
     * matéria privada nunca chega a quem não administra. A matéria da área
     * que não está em grupo nenhum vai para "Mais matérias", no fim, na
     * ordem de posição.
     *
     * @param  list<array{slug: string, area: ?string}>  $visiveis  na ordem de posição
     * @return list<array{name: ?string, items: list<array{subject: string}|array{soon: string}>}>
     */
    public static function groupsFor(string $area, array $visiveis): array
    {
        $daArea = array_values(array_map(fn ($s) => $s['slug'], array_filter($visiveis, fn ($s) => $s['area'] === $area)));
        $usadas = [];
        $grupos = [];

        foreach ((array) config("castelei.area_groups.$area", []) as $grupo) {
            $itens = [];
            foreach ($grupo['items'] as $item) {
                if (is_array($item)) {
                    $itens[] = ['soon' => (string) $item['soon']];
                } elseif (in_array($item, $daArea, true)) {
                    $itens[] = ['subject' => $item];
                    $usadas[] = $item;
                }
            }
            // Grupo só de "em breve" fica: é o que mostra o que vem por aí.
            if ($itens !== []) {
                $grupos[] = ['name' => (string) $grupo['name'], 'items' => $itens];
            }
        }

        $soltas = array_values(array_diff($daArea, $usadas));
        if ($soltas !== []) {
            $grupos[] = ['name' => $grupos === [] ? null : 'Mais matérias', 'items' => array_map(fn ($slug) => ['subject' => $slug], $soltas)];
        }

        return $grupos;
    }

    /**
     * As matérias que esta pessoa enxerga. A matéria "private" é exclusiva do
     * Pro: aparece para quem tem o Pro e para quem administra. Sem pessoa (a
     * vitrine pública), só as públicas.
     */
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        return $user?->seesProSubjects() ? $query : $query->where('visibility', self::PUBLIC);
    }

    public function isVisibleTo(?User $user): bool
    {
        return $this->visibility !== self::PRIVATE || (bool) $user?->seesProSubjects();
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
