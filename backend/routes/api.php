<?php

use App\Http\Controllers\AttemptController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\ProgressController;
use Illuminate\Support\Facades\Route;

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
});
