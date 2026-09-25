<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MakesLessons;
use Tests\TestCase;

class StudyToolsTest extends TestCase
{
    use MakesLessons;
    use RefreshDatabase;

    public function test_a_anotacao_e_guardada_e_texto_vazio_apaga(): void
    {
        $lesson = $this->makeLesson(1);
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/lessons/{$lesson->id}/note")->assertOk()->assertJsonPath('note', null);

        $this->putJson("/api/lessons/{$lesson->id}/note", ['text' => '  Semáforo é um contador.  '])
            ->assertOk()->assertJsonPath('note.text', 'Semáforo é um contador.');
        $this->getJson("/api/lessons/{$lesson->id}/note")->assertJsonPath('note.text', 'Semáforo é um contador.');

        $this->putJson("/api/lessons/{$lesson->id}/note", ['text' => ''])->assertOk()->assertJsonPath('note', null);
        $this->assertDatabaseCount('lesson_notes', 0);
    }

    public function test_a_anotacao_de_um_nao_aparece_para_outro(): void
    {
        $lesson = $this->makeLesson(1);
        Sanctum::actingAs(User::factory()->create());
        $this->putJson("/api/lessons/{$lesson->id}/note", ['text' => 'segredo meu'])->assertOk();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/lessons/{$lesson->id}/note")->assertJsonPath('note', null);
        $this->getJson('/api/search?q=segredo')->assertJsonPath('notes', []);
    }

    public function test_a_busca_ignora_acento_e_acha_licao_palavra_e_anotacao(): void
    {
        $lesson = $this->makeLesson(1);
        $lesson->update([
            'title' => 'Semáforos e mutexes',
            'steps' => [['kind' => 'idea', 'title' => 'Ideia', 'body' => ['x'], 'terms' => [
                ['word' => 'Semáforo', 'meaning' => 'um contador que controla a entrada.'],
                ['word' => 'Mutex', 'meaning' => 'um semáforo que só vale zero ou um.'],
            ]]],
        ]);
        Sanctum::actingAs(User::factory()->create());
        $this->putJson("/api/lessons/{$lesson->id}/note", ['text' => 'Lembrar: semaforo começa em 1.'])->assertOk();

        $r = $this->getJson('/api/search?q=semaforo')->assertOk();

        $this->assertSame('Semáforos e mutexes', $r->json('lessons.0.title'));
        // A palavra que casa pelo nome vem antes da que casa só pelo significado.
        $this->assertSame(['Semáforo', 'Mutex'], array_column($r->json('terms'), 'word'));
        $this->assertCount(1, $r->json('notes'));
    }

    public function test_busca_curta_demais_nao_procura(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/search?q=a')->assertOk()->assertJsonPath('lessons', []);
    }
}
