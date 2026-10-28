<?php

namespace App\Support\Database;

/**
 * Conexão com o Neon a partir da URL que a integração do Vercel cria.
 *
 * O Neon descobre QUAL banco atender pelo nome do servidor, lido no aperto de
 * mão do TLS (SNI). A biblioteca de Postgres do adaptador `vercel-php` é
 * antiga e não manda esse nome, e o Neon recusa: "Endpoint ID is not
 * specified". A saída documentada pelo próprio Neon é dizer o endpoint dentro
 * da senha, no formato `endpoint=<id>$<senha>`. Funciona com qualquer
 * biblioteca, nova ou velha.
 *
 * Por isso a URL do Neon é desmontada aqui, em vez de ir inteira para o
 * `url` do Laravel: os campos que saem de `url` vencem os outros, e não
 * haveria onde mexer na senha.
 */
class NeonUrl
{
    /**
     * Campos de conexão para o `config/database.php`. URL que não é do Neon
     * (ou nenhuma URL) devolve só `url`, e o Laravel segue como sempre.
     *
     * @return array<string, mixed>
     */
    public static function config(?string $url): array
    {
        $partes = $url ? parse_url($url) : false;
        $host = is_array($partes) ? ($partes['host'] ?? '') : '';

        if (! str_ends_with($host, '.neon.tech')) {
            return ['url' => $url];
        }

        parse_str($partes['query'] ?? '', $query);

        // ep-quiet-rain-123-pooler.sa-east-1.aws.neon.tech → ep-quiet-rain-123
        $endpoint = preg_replace('/-pooler$/', '', explode('.', $host)[0]);
        $senha = rawurldecode($partes['pass'] ?? '');

        return [
            'url' => null,
            'host' => $host,
            'port' => $partes['port'] ?? 5432,
            'database' => ltrim($partes['path'] ?? '/neondb', '/'),
            'username' => rawurldecode($partes['user'] ?? ''),
            'password' => "endpoint={$endpoint}\${$senha}",
            'sslmode' => $query['sslmode'] ?? 'require',
        ];
    }
}
