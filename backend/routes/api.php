<?php

use App\Http\Controllers\Admin\ImportController;
use App\Http\Controllers\Admin\LessonController as AdminLessonController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\SubjectController as AdminSubjectController;
use App\Http\Controllers\AttemptController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\MediaFileController;
use App\Http\Controllers\ProgressController;
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

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    // Exclusão de conta: exigida pela Google Play e prometida na política.
    Route::delete('/me', [AuthController::class, 'destroy']);

    Route::get('/subjects', [CatalogController::class, 'subjects']);

    /*
    | `whereNumber` não é capricho: sem ele, um id que não é número (um "null"
    | montado por engano numa URL) chega ao Postgres como texto e vira erro 500
    | em vez de "não encontrado". No SQLite do dev isso passa batido, então o
    | problema só aparece em produção.
    */
    Route::get('/lessons/{lesson}', [CatalogController::class, 'lesson'])->whereNumber('lesson');

    Route::post('/lessons/{lesson}/attempts', [AttemptController::class, 'store'])->whereNumber('lesson');
    Route::post('/subjects/{subject}/exams', [ExamController::class, 'store'])->whereNumber('subject');
    Route::post('/attempts/{attempt}/answers', [AttemptController::class, 'answer'])->whereNumber('attempt');
    Route::post('/attempts/{attempt}/finish', [AttemptController::class, 'finish'])->whereNumber('attempt');

    Route::get('/progress', [ProgressController::class, 'index']);

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
