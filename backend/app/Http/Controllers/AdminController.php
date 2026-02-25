<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Espacio;
use App\Models\Reserva;
use App\Models\Pago;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function getDashboardStats()
    {
        Carbon::setLocale('es');

        $now = Carbon::now();
        $lastMonth = Carbon::now()->subMonth();

        // 1. Total Usuarios
        $totalUsuarios = Usuario::count();
        $usuariosEsteMes = Usuario::whereMonth('created_at', $now->month)->whereYear('created_at', $now->year)->count();
        $usuariosMesPasado = Usuario::whereMonth('created_at', $lastMonth->month)->whereYear('created_at', $lastMonth->year)->count();
        $cambioUsuarios = $usuariosMesPasado > 0 ? (($usuariosEsteMes - $usuariosMesPasado) / $usuariosMesPasado) * 100 : ($usuariosEsteMes > 0 ? 100 : 0);
        $cambioUsuariosStr = ($cambioUsuarios > 0 ? '+' : '') . number_format($cambioUsuarios, 0) . '%';

        // 2. Espacios Activos
        $espaciosActivos = Espacio::where('estado', 'Disponible')->count();
        $espaciosEsteMes = Espacio::where('estado', 'Disponible')->whereMonth('created_at', $now->month)->whereYear('created_at', $now->year)->count();
        $espaciosMesPasado = Espacio::where('estado', 'Disponible')->whereMonth('created_at', $lastMonth->month)->whereYear('created_at', $lastMonth->year)->count();
        $cambioEspacios = $espaciosMesPasado > 0 ? (($espaciosEsteMes - $espaciosMesPasado) / $espaciosMesPasado) * 100 : ($espaciosEsteMes > 0 ? 100 : 0);
        $cambioEspaciosStr = ($cambioEspacios > 0 ? '+' : '') . number_format($cambioEspacios, 0) . '%';

        // 3. Reservas del Mes
        $reservasMes = Reserva::whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->count();
        $reservasMesPasado = Reserva::whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->count();
        $cambioReservas = $reservasMesPasado > 0 ? (($reservasMes - $reservasMesPasado) / $reservasMesPasado) * 100 : ($reservasMes > 0 ? 100 : 0);
        $cambioReservasStr = ($cambioReservas > 0 ? '+' : '') . number_format($cambioReservas, 0) . '%';

        // 4. Ingresos del Mes (Suma de monto_total de reservas del mes)
        $ingresosMes = Reserva::whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('monto_total');
        $ingresosMesPasado = Reserva::whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->sum('monto_total');
        $cambioIngresos = $ingresosMesPasado > 0 ? (($ingresosMes - $ingresosMesPasado) / $ingresosMesPasado) * 100 : ($ingresosMes > 0 ? 100 : 0);
        $cambioIngresosStr = ($cambioIngresos > 0 ? '+' : '') . number_format($cambioIngresos, 0) . '%';

        // 5. Últimas Reservas (take 5)
        $ultimasReservas = Reserva::with(['usuario', 'espacio'])
            ->orderBy('created_at', 'desc')
            ->take(4)
            ->get()
            ->map(function ($reserva) {
                return [
                    'user' => $reserva->usuario ? $reserva->usuario->nombre_completo : 'Usuario Eliminado',
                    'space' => $reserva->espacio ? $reserva->espacio->titulo : 'Espacio Eliminado',
                    'amount' => '€' . number_format($reserva->monto_total, 2),
                    'date' => Carbon::parse($reserva->created_at)->diffForHumans(),
                    'avatar' => $reserva->usuario && $reserva->usuario->foto_perfil 
                        ? asset('storage/' . $reserva->usuario->foto_perfil) 
                        : 'https://ui-avatars.com/api/?name=' . urlencode($reserva->usuario->nombre_completo ?? 'U') . '&background=random'
                ];
            });

        // 6. Espacios Populares (por número de reservas)
        $espaciosPopulares = Espacio::withCount('reservas')
            ->orderBy('reservas_count', 'desc')
            ->take(4)
            ->get()
            ->map(function ($espacio) {
                return [
                    'id' => $espacio->id_espacio,
                    'name' => $espacio->titulo,
                    'reservas' => $espacio->reservas_count,
                    'rating' => $espacio->rating_promedio ?? 0
                ];
            });

        return response()->json([
            'stats' => [
                'usuarios' => [
                    'value' => number_format($totalUsuarios),
                    'change' => $cambioUsuariosStr
                ],
                'espacios' => [
                    'value' => number_format($espaciosActivos),
                    'change' => $cambioEspaciosStr
                ],
                'reservas' => [
                    'value' => number_format($reservasMes),
                    'change' => $cambioReservasStr
                ],
                'ingresos' => [
                    'value' => '€' . number_format($ingresosMes, 2),
                    'change' => $cambioIngresosStr
                ]
            ],
            'recentReservations' => $ultimasReservas,
            'popularSpaces' => $espaciosPopulares
        ]);
    }

    public function getAllSpaces()
    {
        $espacios = Espacio::with(['anfitrion.usuario', 'reservas'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($espacio) {
                $nombreAnfitrion = 'Desconocido';
                if ($espacio->anfitrion && $espacio->anfitrion->usuario) {
                    $nombreAnfitrion = $espacio->anfitrion->usuario->nombre_completo;
                }

                return [
                    'id' => $espacio->id_espacio,
                    'titulo' => $espacio->titulo,
                    'ciudad' => $espacio->ciudad,
                    'direccion' => $espacio->direccion,
                    'precio_hora' => $espacio->precio_hora,
                    'estado' => $espacio->estado,
                    'anfitrion' => $nombreAnfitrion,
                    'reservas_count' => $espacio->reservas->count(),
                    'created_at' => $espacio->created_at ? $espacio->created_at->format('d/m/Y') : 'N/A',
                ];
            });

        return response()->json($espacios);
    }

    public function destroy($id)
    {
        $espacio = Espacio::find($id);

        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado'], 404);
        }

        $espacio->delete();

        return response()->json(['message' => 'Espacio eliminado correctamente par el administrador']);
    }

    public function update(Request $request, $id)
    {
        $espacio = Espacio::find($id);

        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado'], 404);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:100',
            'ciudad' => 'sometimes|required|string|max:100',
            'direccion' => 'sometimes|required|string|max:255',
            'descripcion' => 'sometimes|required|string|min:20',
            'precio_hora' => 'sometimes|required|numeric|min:0',
            'capacidad' => 'sometimes|required|integer|min:1',
            'estado' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
        }

        $espacio->update($request->only([
            'titulo', 'ciudad', 'direccion', 'descripcion', 
            'precio_hora', 'capacidad', 'estado', 'latitud', 'longitud'
        ]));

        if ($request->has('servicios')) {
            $espacio->servicios()->sync($request->servicios);
        }

        return response()->json([
            'message' => 'Espacio actualizado por admin exitosamente',
            'data' => $espacio
        ]);
    }
    // --- Gestión de Usuarios ---

    public function getAllUsers()
    {
        $users = Usuario::orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id_usuario,
                    'nombre' => $user->nombre_completo,
                    'email' => $user->email,
                    'rol' => $user->tipo_usuario,
                    'estado_cuenta' => $user->estado_cuenta,
                    'fecha_registro' => $user->created_at ? $user->created_at->format('d/m/Y') : 'N/A',
                ];
            });

        return response()->json($users);
    }

    public function destroyUser($id)
    {
        $user = Usuario::find($id);

        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        // Prevent deleting self or super admin if functionality existed
        if ($user->id_usuario == auth()->id()) {
             return response()->json(['message' => 'No puedes eliminar tu propia cuenta desde aquí'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente']);
    }

    public function updateUser(Request $request, $id)
    {
        $user = Usuario::find($id);

        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'nombre_completo' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:usuarios,email,' . $id . ',id_usuario',
            'tipo_usuario' => 'sometimes|required|string|in:Cliente,Anfitrion,Admin', // Fix the roles here
            'estado_cuenta' => 'sometimes|required|string|in:Activo,Suspendido,Pendiente',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
        }

        $user->update($request->only(['nombre_completo', 'email', 'tipo_usuario', 'estado_cuenta']));

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'data' => $user
        ]);
    }
    // --- Gestión de Reservas ---

    public function getAllReservations()
    {
        $now = Carbon::now();

        // Auto-sync statuses before returning
        Reserva::where('estado', 'Confirmada')
            ->where('fecha_inicio', '<=', $now)
            ->where('fecha_fin', '>=', $now)
            ->update(['estado' => 'En_Curso']);

        Reserva::whereIn('estado', ['Confirmada', 'En_Curso'])
            ->where('fecha_fin', '<', $now)
            ->update(['estado' => 'Finalizada']);

        $reservas = Reserva::with(['usuario', 'espacio'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($reserva) {
                return [
                    'id' => $reserva->id_reserva,
                    'cliente' => $reserva->usuario ? $reserva->usuario->nombre_completo : 'Usuario Eliminado',
                    'espacio' => $reserva->espacio ? $reserva->espacio->titulo : 'Espacio Eliminado',
                    'fecha_inicio' => $reserva->fecha_inicio ? $reserva->fecha_inicio->format('d/m/Y H:i') : 'N/A',
                    'fecha_fin' => $reserva->fecha_fin ? $reserva->fecha_fin->format('d/m/Y H:i') : 'N/A',
                    'monto_total' => $reserva->monto_total,
                    'estado' => $reserva->estado,
                ];
            });

        return response()->json($reservas);
    }

    public function destroyReservation($id)
    {
        $reserva = Reserva::find($id);

        if (!$reserva) {
            return response()->json(['message' => 'Reserva no encontrada'], 404);
        }

        $reserva->delete();

        return response()->json(['message' => 'Reserva eliminada correctamente']);
    }

    public function updateReservation(Request $request, $id)
    {
        $reserva = Reserva::find($id);

        if (!$reserva) {
            return response()->json(['message' => 'Reserva no encontrada'], 404);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'estado' => 'sometimes|required|string|in:Pendiente,Confirmada,En_Curso,Finalizada,Cancelada',
            'monto_total' => 'sometimes|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
        }

        $reserva->update($request->only(['estado', 'monto_total']));

        return response()->json([
            'message' => 'Reserva actualizada exitosamente',
            'data' => $reserva
        ]);
    }

    // --- Gestión de Pagos ---

    public function getAllPagos()
    {
        $pagos = \App\Models\Pago::with([
            'reserva',
            'reserva.usuario',
            'reserva.espacio'
        ])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($pago) {
            return [
                'id'             => $pago->id_pago,
                'id_reserva'     => $pago->id_reserva,
                'cliente'        => optional(optional($pago->reserva)->usuario)->nombre_completo ?? 'N/A',
                'email'          => optional(optional($pago->reserva)->usuario)->email ?? 'N/A',
                'espacio'        => optional(optional($pago->reserva)->espacio)->titulo ?? 'N/A',
                'monto'          => $pago->monto_pagado,
                'metodo_pago'    => $pago->metodo_pago ?? 'Tarjeta',
                'estado_pago'    => $pago->estado_pago ?? 'Completado',
                'fecha_pago'     => $pago->created_at ? $pago->created_at->format('d/m/Y H:i') : 'N/A',
                'id_transaccion' => '', // Ya no tenemos esta columna en la DB
            ];
        });

        return response()->json($pagos);
    }

    public function destroyPago($id)
    {
        $pago = \App\Models\Pago::find($id);

        if (!$pago) {
            return response()->json(['message' => 'Pago no encontrado'], 404);
        }

        $pago->delete();

        return response()->json(['message' => 'Pago eliminado correctamente']);
    }
}
