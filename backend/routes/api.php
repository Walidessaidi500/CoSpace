<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EspacioController;
use App\Http\Controllers\TestController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::get('/test-conexion', [TestController::class, 'index']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/register-client', [AuthController::class, 'registerClient']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/espacios', [EspacioController::class, 'index']); // Public Exploration
Route::get('/espacios/{id}', [EspacioController::class, 'show']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Host Management
    Route::get('/anfitrion/espacios', [EspacioController::class, 'indexAnfitrion']);
    Route::post('/espacios', [EspacioController::class, 'store']);
    Route::delete('/espacios/{id}', [EspacioController::class, 'destroy']);
});
