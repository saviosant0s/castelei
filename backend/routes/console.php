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
| ATENÇÃO: isto NÃO é o que dispara os lembretes em produção hoje.
|
| O agendador do Laravel só roda se alguém chamar `schedule:run` a cada minuto,
| e o plano do Railway em uso não dá isso (cron nativo tem intervalo mínimo de 5
| minutos, e um serviço só de cron esbarra no limite de serviços). Quem puxa o
| cordão hoje é o GitHub Actions, em POST /api/cron/lembretes.
|
| Esta definição fica porque em qualquer host com cron de verdade ela é o
| caminho certo, e porque é aqui que o horário está escrito uma vez só. Rodar
| pelos dois caminhos não manda aviso dobrado: o limite de um por dia mora no
| próprio comando. Ver docs/deploy-railway.md, passo 5.2.
*/
Schedule::command('castelei:lembretes')
    ->dailyAt(sprintf('%02d:00', (int) config('castelei.review.reminder.hour')))
    ->timezone(config('castelei.timezone'))
    ->withoutOverlapping();
