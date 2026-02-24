<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Valoracion;
use App\Models\Espacio;
use App\Models\Reserva;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ValoracionController extends Controller
{
    /**
     * GET /api/espacios/{id}/valoraciones
     * Listado público de valoraciones con filtros y ordenación.
     */
    public function index(Request $request, $id)
    {
        try {
            $espacio = Espacio::find($id);
            if (!$espacio) {
                return response()->json(['message' => 'Espacio no encontrado'], 404);
            }

            $query = Valoracion::where('id_espacio', $id)
                ->with(['autor:id_usuario,nombre_completo,foto_perfil']);

            // Filtro por puntuación exacta
            if ($request->has('puntuacion') && $request->puntuacion) {
                $query->where('puntuacion', (int) $request->puntuacion);
            }

            // Ordenación
            $sort = $request->get('sort', 'reciente');
            switch ($sort) {
                case 'antigua':
                    $query->orderBy('created_at', 'asc');
                    break;
                case 'mayor_puntuacion':
                    $query->orderBy('puntuacion', 'desc')->orderBy('created_at', 'desc');
                    break;
                case 'menor_puntuacion':
                    $query->orderBy('puntuacion', 'asc')->orderBy('created_at', 'desc');
                    break;
                case 'reciente':
                default:
                    $query->orderBy('created_at', 'desc');
                    break;
            }

            $valoraciones = $query->paginate(10);

            // Calcular resumen (siempre sobre TODAS las valoraciones del espacio, sin filtros)
            $todasValoraciones = Valoracion::where('id_espacio', $id);
            $total = $todasValoraciones->count();
            $promedio = $total > 0 ? round($todasValoraciones->avg('puntuacion'), 1) : 0;

            // Distribución por puntuación
            $distribucion = [];
            for ($i = 5; $i >= 1; $i--) {
                $count = Valoracion::where('id_espacio', $id)->where('puntuacion', $i)->count();
                $distribucion[$i] = [
                    'puntuacion' => $i,
                    'count' => $count,
                    'porcentaje' => $total > 0 ? round(($count / $total) * 100) : 0
                ];
            }

            return response()->json([
                'resumen' => [
                    'promedio' => $promedio,
                    'total' => $total,
                    'distribucion' => $distribucion
                ],
                'valoraciones' => $valoraciones
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/espacios/{id}/valoraciones
     * Crear una valoración (solo clientes autenticados).
     */
    public function store(Request $request, $id)
    {
        $usuario = Auth::user();

        if (!$usuario) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        // Solo clientes pueden escribir reseñas
        if ($usuario->tipo_usuario !== 'Cliente') {
            return response()->json(['message' => 'Solo los clientes pueden escribir reseñas'], 403);
        }

        $espacio = Espacio::find($id);
        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado'], 404);
        }

        // Verificar que el cliente tenga al menos una reserva en este espacio
        $tieneReservaFinalizada = Reserva::where('id_cliente', $usuario->id_usuario)
            ->where('id_espacio', $id)
            ->exists();

        if (!$tieneReservaFinalizada) {
            return response()->json([
                'message' => 'Debes tener una reserva en este espacio para poder escribir una reseña'
            ], 403);
        }

        // Verificar que no haya escrito ya una reseña para este espacio
        $yaValorado = Valoracion::where('id_espacio', $id)
            ->where('id_usuario', $usuario->id_usuario)
            ->exists();

        if ($yaValorado) {
            return response()->json([
                'message' => 'Ya has escrito una reseña para este espacio'
            ], 409);
        }

        $validator = Validator::make($request->all(), [
            'puntuacion' => 'required|integer|min:1|max:5',
            'comentario' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request, $id, $usuario, $espacio) {
                // Buscar una reserva para vincular
                $reserva = Reserva::where('id_cliente', $usuario->id_usuario)
                    ->where('id_espacio', $id)
                    ->latest()
                    ->first();

                $valoracion = Valoracion::create([
                    'id_reserva' => $reserva->id_reserva,
                    'id_espacio' => $id,
                    'id_usuario' => $usuario->id_usuario,
                    'puntuacion' => $request->puntuacion,
                    'comentario' => $request->comentario,
                ]);

                // Recalcular rating_promedio y total_resenas
                $stats = Valoracion::where('id_espacio', $id)
                    ->selectRaw('COUNT(*) as total, ROUND(AVG(puntuacion), 2) as promedio')
                    ->first();

                $espacio->update([
                    'rating_promedio' => $stats->promedio ?? 0,
                    'total_resenas' => $stats->total ?? 0,
                ]);

                return response()->json([
                    'message' => 'Valoración creada exitosamente',
                    'data' => $valoracion->load('autor:id_usuario,nombre_completo,foto_perfil')
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear la valoración',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
