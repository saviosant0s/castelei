<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_check_responde_ok(): void
    {
        $this->get('/up')->assertOk();
    }

    public function test_raiz_responde_json(): void
    {
        $this->getJson('/')->assertOk()->assertJson(['status' => 'ok']);
    }

    public function test_rotas_da_api_exigem_login_e_respondem_json(): void
    {
        // Sem header Accept de propósito: a API deve responder JSON mesmo assim.
        $this->get('/api/me')->assertStatus(401)->assertJsonStructure(['message']);
    }
}
