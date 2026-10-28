<?php

namespace Tests\Unit;

use App\Support\Database\NeonUrl;
use PHPUnit\Framework\TestCase;

class NeonUrlTest extends TestCase
{
    public function test_url_do_neon_leva_o_endpoint_na_senha(): void
    {
        $config = NeonUrl::config('postgresql://neondb_owner:s%40nha@ep-quiet-rain-123-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

        $this->assertNull($config['url']);
        $this->assertSame('ep-quiet-rain-123-pooler.sa-east-1.aws.neon.tech', $config['host']);
        $this->assertSame('neondb', $config['database']);
        $this->assertSame('neondb_owner', $config['username']);
        $this->assertSame('endpoint=ep-quiet-rain-123$s@nha', $config['password']);
        $this->assertSame('require', $config['sslmode']);
    }

    public function test_outra_url_segue_como_sempre(): void
    {
        $url = 'postgresql://u:p@localhost:5432/castelei';

        $this->assertSame(['url' => $url], NeonUrl::config($url));
        $this->assertSame(['url' => null], NeonUrl::config(null));
    }
}
