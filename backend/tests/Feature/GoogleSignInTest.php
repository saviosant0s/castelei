<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleSignInTest extends TestCase
{
    use RefreshDatabase;

    private const PEDIDO = ['code' => 'codigo-do-google', 'redirect_uri' => 'https://castelei.test/api/auth/google/callback'];

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.google.client_id' => 'cliente-castelei', 'services.google.client_secret' => 'segredo']);
    }

    /** O Google responde com um id_token cujas declarações são estas. */
    private function googleResponde(array $claims = []): void
    {
        $claims += [
            'iss' => 'https://accounts.google.com',
            'aud' => 'cliente-castelei',
            'exp' => time() + 600,
            'sub' => 'google-123',
            'email' => 'Savio@Exemplo.com',
            'email_verified' => true,
            'name' => 'Sávio',
        ];
        $meio = rtrim(strtr(base64_encode(json_encode($claims)), '+/', '-_'), '=');

        Http::fake(['oauth2.googleapis.com/token' => Http::response(['id_token' => "cabeca.{$meio}.assinatura"])]);
    }

    public function test_sem_chaves_a_funcao_nao_existe(): void
    {
        config(['services.google.client_id' => null]);

        $this->postJson('/api/auth/google', self::PEDIDO)->assertNotFound();
    }

    public function test_primeira_vez_cria_a_conta_e_devolve_o_token(): void
    {
        $this->googleResponde();

        $this->postJson('/api/auth/google', self::PEDIDO)
            ->assertOk()
            ->assertJsonPath('user.email', 'savio@exemplo.com')
            ->assertJsonPath('user.name', 'Sávio')
            ->assertJsonStructure(['token']);

        $this->assertSame('google-123', User::firstOrFail()->google_id);
    }

    public function test_conta_com_o_mesmo_email_ganha_o_google_em_vez_de_duplicar(): void
    {
        $antiga = User::factory()->create(['email' => 'savio@exemplo.com']);
        $this->googleResponde();

        $this->postJson('/api/auth/google', self::PEDIDO)->assertOk()->assertJsonPath('user.id', $antiga->id);

        $this->assertSame(1, User::count());
        $this->assertSame('google-123', $antiga->fresh()->google_id);
    }

    public function test_visitante_vira_a_conta_google_sem_perder_o_historico(): void
    {
        $visitante = User::factory()->create(['name' => 'Visitante', 'email' => 'guest-1@guest.invalid']);
        $token = $visitante->createToken('web')->plainTextToken;
        $this->googleResponde();

        $this->withToken($token)->postJson('/api/auth/google', self::PEDIDO)
            ->assertOk()
            ->assertJsonPath('user.id', $visitante->id)
            ->assertJsonPath('user.email', 'savio@exemplo.com');

        $this->assertSame(1, User::count());
    }

    public function test_token_emitido_para_outro_site_e_recusado(): void
    {
        $this->googleResponde(['aud' => 'outro-site']);

        $this->postJson('/api/auth/google', self::PEDIDO)->assertStatus(422);
        $this->assertSame(0, User::count());
    }

    public function test_email_nao_confirmado_pelo_google_e_recusado(): void
    {
        $this->googleResponde(['email_verified' => false]);

        $this->postJson('/api/auth/google', self::PEDIDO)->assertStatus(422);
    }

    public function test_codigo_recusado_pelo_google_vira_mensagem_e_nao_erro(): void
    {
        Http::fake(['oauth2.googleapis.com/token' => Http::response(['error' => 'invalid_grant'], 400)]);

        $this->postJson('/api/auth/google', self::PEDIDO)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Não deu para entrar com o Google. Tente de novo.');
    }
}
