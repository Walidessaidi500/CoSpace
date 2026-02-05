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

// Rutas Públicas
Route::get('/test-conexion', [TestController::class, 'index']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/register-client', [AuthController::class, 'registerClient']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-2fa', [AuthController::class, 'verify2FA']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::get('/espacios', [EspacioController::class, 'index']); // Exploración Pública
Route::get('/espacios/{id}', [EspacioController::class, 'show']);

// Rutas Protegidas
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/update-profile', [AuthController::class, 'updateProfile']);
    Route::post('/update-2fa-settings', [AuthController::class, 'update2FASettings']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Gestión de Anfitrión
    Route::get('/anfitrion/espacios', [EspacioController::class, 'indexAnfitrion']);
    Route::post('/espacios', [EspacioController::class, 'store']);
    Route::post('/espacios/{id}', [EspacioController::class, 'update']); // Usando POST para subida de archivos vía FormData por simplicidad
    Route::delete('/espacios/{id}', [EspacioController::class, 'destroy']);

    // Acciones de Reserva
    Route::post('/create-payment-intent', [App\Http\Controllers\ReservaController::class, 'createPaymentIntent']);
    Route::post('/reservas', [App\Http\Controllers\ReservaController::class, 'store']);
    Route::get('/anfitrion/reservas-recibidas', [App\Http\Controllers\ReservaController::class, 'indexAnfitrion']);
    
    // Reservas del Cliente
    Route::get('/cliente/mis-reservas', [App\Http\Controllers\ReservaController::class, 'indexCliente']);
    Route::post('/reservas/{id}/cancelar', [App\Http\Controllers\ReservaController::class, 'cancelar']);
});
