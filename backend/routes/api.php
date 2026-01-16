<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
use App\Http\Controllers\TestController;
use App\Http\Controllers\EspacioController;

Route::get('/test-conexion', [TestController::class, 'index']);
Route::post('/espacios', [EspacioController::class, 'store']);
Route::get('/espacios', [EspacioController::class, 'index']);
Route::delete('/espacios/{id}', [EspacioController::class, 'destroy']);

