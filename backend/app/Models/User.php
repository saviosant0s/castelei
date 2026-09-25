<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\Admins;
use App\Support\Plans;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** Valores padrão em memória (o banco também tem default). */
    protected $attributes = [
        'plan' => 'free',
        'is_admin' => false,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Pode entrar no painel de conteúdo?
     *
     * Duas portas de propósito. A coluna é o caminho normal, ligada pelo
     * comando `castelei:admin`. A lista em ADMIN_EMAILS existe para o primeiro
     * acesso: no Railway dá para criar uma variável pelo navegador, mas rodar
     * um comando exige CLI — sem ela, ninguém entraria na primeira vez.
     */
    /**
     * Conta de visitante, criada sozinha pelo modo de teste (GUEST_MODE).
     *
     * O e-mail de visitante termina num domínio que não existe de propósito
     * (`.invalid` é reservado para isso): ninguém recebe e-mail nele, e ele
     * não colide com conta de verdade.
     */
    public function isGuest(): bool
    {
        return str_ends_with((string) $this->email, '@guest.invalid');
    }

    public function isAdmin(): bool
    {
        if ($this->is_admin) {
            return true;
        }

        return Admins::allows($this->email);
    }

    public function questionLimit(): ?int
    {
        return Plans::questionLimit($this->plan);
    }

    /** O plano que vale na prática (na fase de testes, todo mundo estuda como Pro). */
    public function effectivePlan(): string
    {
        return Plans::effective($this->plan);
    }

    public function planLabel(): string
    {
        return Plans::label($this->effectivePlan());
    }

    public function hasGamification(): bool
    {
        return Plans::hasGamification($this->plan);
    }

    public function hasExam(): bool
    {
        return Plans::hasExam($this->plan);
    }
}
