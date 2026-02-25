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
        $currentMonth = $now->month;
        $currentYear = $now->year;
        $prevMonth = $now->copy()->subMonth();

        // 1. Total Usuarios
        $totalUsuarios = Usuario::count();

        // 2. Espacios Activos (estado 'Disponible' en la BD)
        $espaciosActivos = Espacio::where('estado', 'Disponible')->count();

        // 3. Reservas del Mes actual
        $reservasMes = Reserva::whereMonth('fecha_inicio', $currentMonth)
            ->whereYear('fecha_inicio', $currentYear)
            ->count();

        // Reservas del mes anterior (para calcular % cambio)
        $reservasMesAnterior = Reserva::whereMonth('fecha_inicio', $prevMonth->month)
            ->whereYear('fecha_inicio', $prevMonth->year)
            ->count();

        // 4. Ingresos del Mes (Comisión 14.59% de gastos de gestión)
        $totalBrutoMes = Reserva::whereMonth('fecha_inicio', $currentMonth)
            ->whereYear('fecha_inicio', $currentYear)
            ->sum('monto_total');
        $ingresosMes = $totalBrutoMes * 0.1459;

        $totalBrutoMesAnterior = Reserva::whereMonth('fecha_inicio', $prevMonth->month)
            ->whereYear('fecha_inicio', $prevMonth->year)
            ->sum('monto_total');
        $ingresosMesAnterior = $totalBrutoMesAnterior * 0.1459;

        // 5. Últimas Reservas (las 4 más recientes)
        $ultimasReservas = Reserva::with(['usuario', 'espacio'])
            ->orderBy('id_reserva', 'desc')
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

        // 6. Espacios Populares (por número de reservas) con rating_promedio real
        $espaciosPopulares = Espacio::withCount('reservas')
            ->orderBy('reservas_count', 'desc')
            ->take(4)
            ->get()
            ->map(function ($espacio) {
                return [
                    'id' => $espacio->id_espacio,
                    'name' => $espacio->titulo,
                    'reservas' => $espacio->reservas_count,
                    'rating' => round($espacio->rating_promedio, 1)
                ];
            });

        // Calcular porcentajes de cambio
        $cambioReservas = $reservasMesAnterior > 0
            ? round((($reservasMes - $reservasMesAnterior) / $reservasMesAnterior) * 100)
            : ($reservasMes > 0 ? 100 : 0);

        $cambioIngresos = $ingresosMesAnterior > 0
            ? round((($ingresosMes - $ingresosMesAnterior) / $ingresosMesAnterior) * 100)
            : ($ingresosMes > 0 ? 100 : 0);

        return response()->json([
            'stats' => [
                'usuarios' => [
                    'value' => number_format($totalUsuarios),
                    'change' => $totalUsuarios > 0 ? '+' . $totalUsuarios : '0'
                ],
                'espacios' => [
                    'value' => number_format($espaciosActivos),
                    'change' => $espaciosActivos > 0 ? '' . $espaciosActivos . ' activos' : '0'
                ],
                'reservas' => [
                    'value' => number_format($reservasMes),
                    'change' => ($cambioReservas >= 0 ? '+' : '') . $cambioReservas . '%'
                ],
                'ingresos' => [
                    'value' => '€' . number_format($ingresosMes, 2),
                    'change' => ($cambioIngresos >= 0 ? '+' : '') . $cambioIngresos . '%'
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
            'titulo',
            'ciudad',
            'direccion',
            'descripcion',
            'precio_hora',
            'capacidad',
            'estado',
            'latitud',
            'longitud'
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
                    'id' => $pago->id_pago,
                    'id_reserva' => $pago->id_reserva,
                    'cliente' => optional(optional($pago->reserva)->usuario)->nombre_completo ?? 'N/A',
                    'email' => optional(optional($pago->reserva)->usuario)->email ?? 'N/A',
                    'espacio' => optional(optional($pago->reserva)->espacio)->titulo ?? 'N/A',
                    'monto' => $pago->monto_pagado,
                    'metodo_pago' => $pago->metodo_pago ?? 'Tarjeta',
                    'estado_pago' => $pago->estado_pago ?? 'Completado',
                    'fecha_pago' => $pago->created_at ? $pago->created_at->format('d/m/Y H:i') : 'N/A',
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
