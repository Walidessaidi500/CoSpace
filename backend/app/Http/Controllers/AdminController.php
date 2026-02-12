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

        // 1. Total Usuarios (excluyendo admin si se quiere, o todos)
        $totalUsuarios = Usuario::count();

        // 2. Espacios Activos
        $espaciosActivos = Espacio::where('estado', 'activo')->count();

        // 3. Reservas del Mes
        $reservasMes = Reserva::whereMonth('fecha_inicio', Carbon::now()->month)
            ->whereYear('fecha_inicio', Carbon::now()->year)
            ->count();

        // 4. Ingresos del Mes (Suma de monto_total de reservas del mes)
        $ingresosMes = Reserva::whereMonth('fecha_inicio', Carbon::now()->month)
            ->whereYear('fecha_inicio', Carbon::now()->year)
            ->sum('monto_total');

        // 5. Últimas Reservas (take 5)
        $ultimasReservas = Reserva::with(['usuario', 'espacio'])
            ->orderBy('fecha_inicio', 'desc')
            ->take(4)
            ->get()
            ->map(function ($reserva) {
                return [
                    'user' => $reserva->usuario ? $reserva->usuario->nombre_completo : 'Usuario Eliminado',
                    'space' => $reserva->espacio ? $reserva->espacio->titulo : 'Espacio Eliminado',
                    'amount' => '€' . number_format($reserva->monto_total, 2),
                    'date' => Carbon::parse($reserva->fecha_inicio)->diffForHumans(),
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
                    'rating' => $espacio->calificacion_promedio ?? 0 // Asumiendo campo calificacion
                ];
            });

        return response()->json([
            'stats' => [
                'usuarios' => [
                    'value' => number_format($totalUsuarios),
                    'change' => '+12%' // Hardcoded for simplified delta logic
                ],
                'espacios' => [
                    'value' => number_format($espaciosActivos),
                    'change' => '+8%'
                ],
                'reservas' => [
                    'value' => number_format($reservasMes),
                    'change' => '+24%'
                ],
                'ingresos' => [
                    'value' => '€' . number_format($ingresosMes, 2),
                    'change' => '+18%'
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
            'tipo_usuario' => 'sometimes|required|string|in:cliente,anfitrion,admin', // Adjust roles as needed
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
        }

        $user->update($request->only(['nombre_completo', 'email', 'tipo_usuario']));

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'data' => $user
        ]);
    }
    // --- Gestión de Reservas ---

    public function getAllReservations()
    {
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
}
