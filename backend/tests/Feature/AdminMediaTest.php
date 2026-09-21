<?php

namespace Tests\Feature;

use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminMediaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
    }

    public function test_biblioteca_exige_ser_administrador(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/admin/media')->assertForbidden();
    }

    public function test_envia_imagem_e_recebe_o_endereco_de_volta(): void
    {
        $response = $this->post('/api/admin/media', [
            'file' => UploadedFile::fake()->image('Gráfico de Barras.png', 400, 300),
            'alt' => 'Um gráfico de barras comparando três valores.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('media.kind', 'image')
            ->assertJsonPath('media.original_name', 'Gráfico de Barras.png')
            ->assertJsonPath('media.alt', 'Um gráfico de barras comparando três valores.');

        $media = Media::firstOrFail();
        Storage::disk('public')->assertExists($media->path);
        $this->assertStringContainsString('/storage/', $response->json('media.url'));
    }

    /** Acento, espaço e maiúscula em URL dão dor de cabeça: o nome guardado é outro. */
    public function test_o_nome_guardado_no_disco_e_seguro_para_url(): void
    {
        $this->post('/api/admin/media', [
            'file' => UploadedFile::fake()->image('Ação Rápida.png'),
        ])->assertCreated();

        $path = Media::firstOrFail()->path;

        $this->assertMatchesRegularExpression('#^midia/images/acao-rapida-[a-z0-9]{6}\.png$#', $path);
    }

    public function test_dois_arquivos_de_mesmo_nome_nao_brigam(): void
    {
        foreach (range(1, 2) as $ignored) {
            $this->post('/api/admin/media', ['file' => UploadedFile::fake()->image('figura.png')])->assertCreated();
        }

        $this->assertSame(2, Media::count());
        $this->assertSame(2, Media::distinct()->count('path'));
    }

    public function test_envia_video(): void
    {
        $this->post('/api/admin/media', [
            'file' => UploadedFile::fake()->create('aula.mp4', 500, 'video/mp4'),
        ])->assertCreated()->assertJsonPath('media.kind', 'video');
    }

    public function test_formato_nao_aceito_e_recusado(): void
    {
        $this->post('/api/admin/media', [
            'file' => UploadedFile::fake()->create('planilha.xlsx', 10, 'application/vnd.ms-excel'),
        ])->assertStatus(422)->assertJsonValidationErrors('file');

        $this->assertSame(0, Media::count());
    }

    public function test_video_grande_demais_sugere_o_youtube(): void
    {
        config(['castelei.media.max_video_kb' => 100]);

        $response = $this->post('/api/admin/media', [
            'file' => UploadedFile::fake()->create('aula.mp4', 400, 'video/mp4'),
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('YouTube', $response->json('message'));
        $this->assertSame(0, Media::count());
    }

    public function test_imagem_grande_demais_e_recusada(): void
    {
        config(['castelei.media.max_image_kb' => 50]);

        $this->post('/api/admin/media', [
            'file' => UploadedFile::fake()->create('figura.png', 200, 'image/png'),
        ])->assertStatus(422);
    }

    public function test_filtra_por_tipo(): void
    {
        $this->post('/api/admin/media', ['file' => UploadedFile::fake()->image('a.png')])->assertCreated();
        $this->post('/api/admin/media', ['file' => UploadedFile::fake()->create('b.mp4', 10, 'video/mp4')])->assertCreated();

        $this->getJson('/api/admin/media?kind=video')->assertOk()->assertJsonCount(1, 'media');
        $this->getJson('/api/admin/media')->assertOk()->assertJsonCount(2, 'media');
    }

    public function test_edita_a_descricao_depois_do_envio(): void
    {
        $this->post('/api/admin/media', ['file' => UploadedFile::fake()->image('a.png')])->assertCreated();
        $media = Media::firstOrFail();

        $this->putJson("/api/admin/media/{$media->id}", ['alt' => 'Uma descrição escrita depois.'])
            ->assertOk()
            ->assertJsonPath('media.alt', 'Uma descrição escrita depois.');
    }

    public function test_apagar_tira_o_arquivo_do_disco_tambem(): void
    {
        $this->post('/api/admin/media', ['file' => UploadedFile::fake()->image('a.png')])->assertCreated();
        $media = Media::firstOrFail();

        $this->deleteJson("/api/admin/media/{$media->id}")->assertOk();

        Storage::disk('public')->assertMissing($media->path);
        $this->assertSame(0, Media::count());
    }
}
