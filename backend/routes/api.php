<?php

use App\Http\Controllers\Admin\ImportController;
use App\Http\Controllers\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\SubjectController as AdminSubjectController;
use App\Http\Controllers\AttemptController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CronController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\StudyToolsController;
use App\Http\Controllers\WritingController;
use App\Http\Controllers\MediaFileController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\PushController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\PublicCatalogController;
use Illuminate\Support\Facades\Route;

/*
| Sem login: a vitrine do site público lê daqui.
|
| Só nome de matéria e título de lição — o mesmo que já está escrito na página
| de divulgação. Enunciado e gabarito continuam atrás da sessão.
*/
Route::get('/catalog', [PublicCatalogController::class, 'index']);

/*
| Imagens e vídeos das lições. Sem login porque uma tag `img` não manda token.
|
| A expressão limita o que pode ser pedido às pastas da biblioteca de mídia —
| sem ela, `..%2F..%2F.env` viraria um caminho válido.
*/
Route::get('/media/{path}', MediaFileController::class)
    ->where('path', 'midia/(images|videos)/[A-Za-z0-9._-]+');

/*
| Gatilho de tarefa agendada, puxado de fora.
|
| Fica ANTES do grupo de sessão porque quem chama é uma máquina, não um aluno:
| a autorização é o segredo em `X-Castelei-Cron`, não um token de Sanctum.
|
| `throttle` porque é uma rota sem login que faz trabalho de verdade. O limite é
| folgado para o uso legítimo (uma chamada por dia) e apertado o bastante para
| ninguém ficar martelando segredo.
*/
Route::post('/cron/lembretes', [CronController::class, 'reminders'])->middleware('throttle:6,1');

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    // Exclusão de conta: exigida pela Google Play e prometida na política.
    Route::delete('/me', [AuthController::class, 'destroy']);
    // Visitante vira conta de verdade, levando o histórico junto.
    Route::post('/me/claim', [AuthController::class, 'claim'])->middleware('throttle:10,1');

    Route::get('/subjects', [CatalogController::class, 'subjects']);
    // O vocabulário da matéria, montado das etapas das lições.
    Route::get('/subjects/{subject}/vocabulario', [CatalogController::class, 'vocabulary'])->whereNumber('subject');

    /*
    | `whereNumber` não é capricho: sem ele, um id que não é número (um "null"
    | montado por engano numa URL) chega ao Postgres como texto e vira erro 500
    | em vez de "não encontrado". No SQLite do dev isso passa batido, então o
    | problema só aparece em produção.
    */
    Route::get('/lessons/{lesson}', [CatalogController::class, 'lesson'])->whereNumber('lesson');
    // Anotação da pessoa na lição, e a busca em todas as matérias.
    Route::get('/lessons/{lesson}/note', [StudyToolsController::class, 'showNote'])->whereNumber('lesson');
    Route::put('/lessons/{lesson}/note', [StudyToolsController::class, 'saveNote'])->whereNumber('lesson')->middleware('throttle:60,1');
    Route::get('/search', [StudyToolsController::class, 'search'])->middleware('throttle:60,1');

    Route::post('/lessons/{lesson}/attempts', [AttemptController::class, 'store'])->whereNumber('lesson');
    Route::post('/subjects/{subject}/exams', [ExamController::class, 'store'])->whereNumber('subject');
    Route::post('/attempts/{attempt}/answers', [AttemptController::class, 'answer'])->whereNumber('attempt');
    Route::post('/attempts/{attempt}/finish', [AttemptController::class, 'finish'])->whereNumber('attempt');
    // Conferir um texto não grava nada, e pode ser feito muitas vezes. O limite existe pelo LanguageTool.
    Route::post('/attempts/{attempt}/writing/check', [WritingController::class, 'check'])->whereNumber('attempt')->middleware('throttle:30,1');
    Route::post('/attempts/{attempt}/writing/review', [WritingController::class, 'review'])->whereNumber('attempt')->middleware('throttle:10,1');

    Route::get('/progress', [ProgressController::class, 'index']);

    /*
    | O que revisar hoje. O intervalo entre revisões é uma proporção do tempo
    | que falta até a prova da matéria (Cepeda et al., 2008) — ver
    | docs/revisao-espacada.md e a configuração em config/castelei.php.
    */
    Route::get('/review', [ReviewController::class, 'index']);

    /*
    | Lembrete de revisão (Web Push). Uma assinatura por APARELHO, não por conta.
    | Sem chaves VAPID no servidor, `key` avisa que está desligado e `store`
    | responde 503 — de propósito, para a tela não oferecer o que não funciona.
    */
    Route::get('/push/key', [PushController::class, 'key']);
    Route::post('/push/subscriptions', [PushController::class, 'store']);
    Route::delete('/push/subscriptions', [PushController::class, 'destroy']);

    /*
    | Painel de conteúdo. Tudo aqui exige `is_admin` (ou o e-mail em
    | ADMIN_EMAILS) — ver App\Http\Middleware\EnsureAdmin.
    |
    | Estas rotas escrevem no conteúdo que todos os alunos veem, então o
    | navegador nunca fala com elas direto: passam pelo proxy do Next, que é
    | quem guarda o token. Ver frontend/src/app/api/admin/[...path]/route.ts.
    */
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/subjects', [AdminSubjectController::class, 'index']);
        Route::post('/subjects', [AdminSubjectController::class, 'store']);
        Route::get('/subjects/{subject}', [AdminSubjectController::class, 'show'])->whereNumber('subject');
        // Baixa a matéria como arquivo de importação: o caminho de volta do
        // conteúdo escrito no painel para um arquivo que dá para versionar.
        Route::get('/subjects/{subject}/export', [AdminSubjectController::class, 'export'])->whereNumber('subject');
        Route::put('/subjects/{subject}', [AdminSubjectController::class, 'update'])->whereNumber('subject');
        Route::delete('/subjects/{subject}', [AdminSubjectController::class, 'destroy'])->whereNumber('subject');
        Route::put('/subjects/{subject}/order', [AdminSubjectController::class, 'reorder'])->whereNumber('subject');

        Route::post('/subjects/{subject}/lessons', [AdminLessonController::class, 'store'])->whereNumber('subject');
        Route::get('/lessons/{lesson}', [AdminLessonController::class, 'show'])->whereNumber('lesson');
        Route::put('/lessons/{lesson}', [AdminLessonController::class, 'update'])->whereNumber('lesson');
        Route::delete('/lessons/{lesson}', [AdminLessonController::class, 'destroy'])->whereNumber('lesson');

        Route::post('/lessons/{lesson}/questions', [QuestionController::class, 'store'])->whereNumber('lesson');
        Route::put('/questions/{question}', [QuestionController::class, 'update'])->whereNumber('question');
        Route::delete('/questions/{question}', [QuestionController::class, 'destroy'])->whereNumber('question');

        Route::post('/import', [ImportController::class, 'store']);
        Route::get('/import/template', [ImportController::class, 'template']);

        Route::get('/media', [MediaController::class, 'index']);
        Route::post('/media', [MediaController::class, 'store']);
        Route::put('/media/{media}', [MediaController::class, 'update'])->whereNumber('media');
        Route::delete('/media/{media}', [MediaController::class, 'destroy'])->whereNumber('media');
    });
});
