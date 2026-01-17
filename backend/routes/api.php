<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
use App\Http\Controllers\TestController;
use App\Http\Controllers\AuthController;

Route::get('/test-conexion', [TestController::class, 'index']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/register-client', [AuthController::class, 'registerClient']);