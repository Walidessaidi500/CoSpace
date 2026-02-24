<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Reporte;
use App\Models\Espacio;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ReporteController extends Controller
{
    /**
     * POST /api/espacios/{id}/reportes
     * Crear un reporte (solo clientes autenticados).
     */
    public function store(Request $request, $id)
    {
        $usuario = Auth::user();

        if (!$usuario) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        if ($usuario->tipo_usuario !== 'Cliente') {
            return response()->json(['message' => 'Solo los clientes pueden reportar espacios'], 403);
        }

        $espacio = Espacio::find($id);
        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'motivo' => 'required|string|in:reserva_fraudulenta,contenido_inapropiado,informacion_falsa,espacio_inseguro,incumplimiento_normas,otro',
            'descripcion' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verificar duplicado
        $yaReportado = Reporte::where('id_espacio', $id)
            ->where('id_usuario', $usuario->id_usuario)
            ->where('motivo', $request->motivo)
            ->exists();

        if ($yaReportado) {
            return response()->json([
                'message' => 'Ya has reportado este espacio por este motivo'
            ], 409);
        }

        try {
            $reporte = Reporte::create([
                'id_espacio' => $id,
                'id_usuario' => $usuario->id_usuario,
                'motivo' => $request->motivo,
                'descripcion' => $request->descripcion,
                'estado' => 'Pendiente',
            ]);

            return response()->json([
                'message' => 'Reporte enviado correctamente',
                'data' => $reporte
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear el reporte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/admin/reportes
     * Listar todos los reportes (solo admin).
     */
    public function index()
    {
        $reportes = Reporte::with(['espacio:id_espacio,titulo,ciudad', 'usuario:id_usuario,nombre_completo,email'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($reporte) {
                return [
                    'id' => $reporte->id_reporte,
                    'espacio' => $reporte->espacio ? $reporte->espacio->titulo : 'Espacio eliminado',
                    'espacio_ciudad' => $reporte->espacio ? $reporte->espacio->ciudad : '',
                    'usuario' => $reporte->usuario ? $reporte->usuario->nombre_completo : 'Usuario eliminado',
                    'usuario_email' => $reporte->usuario ? $reporte->usuario->email : '',
                    'motivo' => $reporte->motivo,
                    'descripcion' => $reporte->descripcion,
                    'estado' => $reporte->estado,
                    'fecha' => $reporte->created_at ? $reporte->created_at->format('d/m/Y H:i') : 'N/A',
                ];
            });

        return response()->json($reportes);
    }

    /**
     * POST /api/admin/reportes/{id}
     * Actualizar estado de un reporte (solo admin).
     */
    public function updateEstado(Request $request, $id)
    {
        $reporte = Reporte::find($id);

        if (!$reporte) {
            return response()->json(['message' => 'Reporte no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'estado' => 'required|string|in:Pendiente,Revisado,Resuelto,Rechazado',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Estado inválido',
                'errors' => $validator->errors()
            ], 422);
        }

        $reporte->update(['estado' => $request->estado]);

        return response()->json([
            'message' => 'Estado del reporte actualizado',
            'data' => $reporte
        ]);
    }

    /**
     * DELETE /api/admin/reportes/{id}
     * Eliminar un reporte (solo admin).
     */
    public function destroy($id)
    {
        $reporte = Reporte::find($id);

        if (!$reporte) {
            return response()->json(['message' => 'Reporte no encontrado'], 404);
        }

        $reporte->delete();

        return response()->json(['message' => 'Reporte eliminado correctamente']);
    }
}
