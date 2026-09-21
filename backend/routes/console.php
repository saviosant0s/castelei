<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
| O lembrete diário de revisão.
|
| A hora sai da configuração e é interpretada no fuso do aluno — sem
| `timezone()`, o agendador do Laravel usa UTC e o aviso das 18h chegaria às 15h
| em São Paulo.
|
| `withoutOverlapping` porque o envio fala com serviços de push externos e pode
| demorar: duas execuções ao mesmo tempo mandariam dois avisos.
|
| ATENÇÃO, RAILWAY: isto só roda se houver um processo chamando
| `php artisan schedule:run` a cada minuto. O serviço `backend` atende
| requisições e não tem cron — enquanto não existir esse processo (um serviço de
| cron do Railway ou um worker separado), o comando precisa ser chamado de fora.
| Ver docs/deploy-railway.md.
*/
Schedule::command('castelei:lembretes')
    ->dailyAt(sprintf('%02d:00', (int) config('castelei.review.reminder.hour')))
    ->timezone(config('castelei.timezone'))
    ->withoutOverlapping();
