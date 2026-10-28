<?php

namespace App\Support\Auth;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Troca o código que o Google devolve pela identidade da pessoa.
 *
 * Quem fala com o Google é o servidor, com o segredo do cliente, e o
 * `id_token` chega pela própria conexão TLS com o Google. A especificação do
 * OpenID Connect dispensa conferir a assinatura nesse caso; o que se confere
 * é para QUEM o token foi emitido (`aud`), por QUEM (`iss`), se ainda vale
 * (`exp`) e se o Google confirmou o e-mail. Sem isso, um token emitido para
 * outro site entraria aqui.
 *
 * Sem `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`, a função não existe: a
 * rota responde 404 e o botão não aparece.
 */
class GoogleSignIn
{
    public static function enabled(): bool
    {
        return filled(config('services.google.client_id')) && filled(config('services.google.client_secret'));
    }

    /**
     * @return array{sub: string, email: string, name: string}
     *
     * @throws RuntimeException quando o código não vale ou a identidade não confere
     */
    public function exchange(string $code, string $redirectUri): array
    {
        $clientId = (string) config('services.google.client_id');

        $response = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => $clientId,
            'client_secret' => (string) config('services.google.client_secret'),
            'redirect_uri' => $redirectUri,
            'grant_type' => 'authorization_code',
        ]);

        $idToken = $response->json('id_token');
        if (! $response->successful() || ! is_string($idToken)) {
            throw new RuntimeException('O Google não aceitou o código.');
        }

        $partes = explode('.', $idToken);
        $claims = count($partes) === 3
            ? json_decode((string) base64_decode(strtr($partes[1], '-_', '+/')), true)
            : null;

        if (! is_array($claims)
            || ($claims['aud'] ?? null) !== $clientId
            || ! in_array($claims['iss'] ?? null, ['https://accounts.google.com', 'accounts.google.com'], true)
            || (int) ($claims['exp'] ?? 0) < time()
            || ($claims['email_verified'] ?? false) !== true
            || ! is_string($claims['sub'] ?? null)
            || ! is_string($claims['email'] ?? null)
        ) {
            throw new RuntimeException('A identidade devolvida pelo Google não confere.');
        }

        return [
            'sub' => $claims['sub'],
            'email' => mb_strtolower($claims['email']),
            'name' => is_string($claims['name'] ?? null) && $claims['name'] !== '' ? $claims['name'] : explode('@', $claims['email'])[0],
        ];
    }
}
