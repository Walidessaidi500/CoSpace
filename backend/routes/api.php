<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EspacioController;
use App\Http\Controllers\ValoracionController;
use App\Http\Controllers\ReporteController;
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
Route::get('/espacios/{id}/valoraciones', [ValoracionController::class, 'index']); // Valoraciones públicas

// Rutas Protegidas
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Admin Routes
    Route::get('/admin/dashboard', [App\Http\Controllers\AdminController::class, 'getDashboardStats']);
    
    // Admin Spaces Management
    Route::get('/admin/espacios', [App\Http\Controllers\AdminController::class, 'getAllSpaces']);
    Route::delete('/admin/espacios/{id}', [App\Http\Controllers\AdminController::class, 'destroy']);
    Route::post('/admin/espacios/{id}', [App\Http\Controllers\AdminController::class, 'update']);

    // Admin Users Management
    Route::get('/admin/usuarios', [App\Http\Controllers\AdminController::class, 'getAllUsers']);
    Route::delete('/admin/usuarios/{id}', [App\Http\Controllers\AdminController::class, 'destroyUser']);
    Route::post('/admin/usuarios/{id}', [App\Http\Controllers\AdminController::class, 'updateUser']);

    // Admin Reservations Management
    Route::get('/admin/reservas', [App\Http\Controllers\AdminController::class, 'getAllReservations']);
    Route::delete('/admin/reservas/{id}', [App\Http\Controllers\AdminController::class, 'destroyReservation']);
    Route::post('/admin/reservas/{id}', [App\Http\Controllers\AdminController::class, 'updateReservation']);

    // Admin Pagos Management
    Route::get('/admin/pagos', [App\Http\Controllers\AdminController::class, 'getAllPagos']);
    Route::delete('/admin/pagos/{id}', [App\Http\Controllers\AdminController::class, 'destroyPago']);

    // Admin Reportes Management
    Route::get('/admin/reportes', [ReporteController::class, 'index']);
    Route::post('/admin/reportes/{id}', [ReporteController::class, 'updateEstado']);
    Route::delete('/admin/reportes/{id}', [ReporteController::class, 'destroy']);

    Route::post('/update-profile', [AuthController::class, 'updateProfile']);
    Route::post('/update-2fa-settings', [AuthController::class, 'update2FASettings']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Gestión de Anfitrión
    Route::get('/anfitrion/espacios', [EspacioController::class, 'indexAnfitrion']);
    Route::post('/espacios', [EspacioController::class, 'store']);
    Route::post('/espacios/{id}', [EspacioController::class, 'update']); // Usando POST para subida de archivos vía FormData por simplicidad
    Route::delete('/espacios/{id}', [EspacioController::class, 'destroy']);

    // Valoraciones (solo clientes autenticados pueden crear)
    Route::post('/espacios/{id}/valoraciones', [ValoracionController::class, 'store']);

    // Reportes (solo clientes autenticados pueden crear)
    Route::post('/espacios/{id}/reportes', [ReporteController::class, 'store']);

    // Acciones de Reserva
    Route::post('/create-payment-intent', [App\Http\Controllers\ReservaController::class, 'createPaymentIntent']);
    Route::post('/reservas', [App\Http\Controllers\ReservaController::class, 'store']);
    Route::get('/anfitrion/reservas-recibidas', [App\Http\Controllers\ReservaController::class, 'indexAnfitrion']);
    Route::post('/anfitrion/reservas/{id}/estado', [App\Http\Controllers\ReservaController::class, 'updateEstadoAnfitrion']);
    
    // Reservas del Cliente
    Route::get('/cliente/mis-reservas', [App\Http\Controllers\ReservaController::class, 'indexCliente']);
    Route::post('/reservas/{id}/cancelar', [App\Http\Controllers\ReservaController::class, 'cancelar']);
});
