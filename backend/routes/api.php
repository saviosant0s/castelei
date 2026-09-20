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

    Route::get('/subjects', [CatalogController::class, 'subjects']);
    Route::get('/lessons/{lesson}', [CatalogController::class, 'lesson']);

    Route::post('/lessons/{lesson}/attempts', [AttemptController::class, 'store']);
    Route::post('/subjects/{subject}/exams', [ExamController::class, 'store']);
    Route::post('/attempts/{attempt}/answers', [AttemptController::class, 'answer']);
    Route::post('/attempts/{attempt}/finish', [AttemptController::class, 'finish']);

    Route::get('/progress', [ProgressController::class, 'index']);
});
