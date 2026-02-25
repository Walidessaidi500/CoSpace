<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Conversacion;
use App\Models\Mensaje;

class ChatController extends Controller
{
    /**
     * GET /api/conversaciones
     * Obtener todas las conversaciones del usuario autenticado.
     */
    public function index()
    {
        $userId = Auth::id();

        $conversaciones = Conversacion::where('id_usuario_1', $userId)
            ->orWhere('id_usuario_2', $userId)
            ->with(['usuario1', 'usuario2', 'ultimoMensaje'])
            ->get()
            ->map(function ($conv) use ($userId) {
                $otroUsuario = $conv->getOtroUsuario($userId);
                return [
                    'id_conv' => $conv->id_conv,
                    'otro_usuario' => [
                        'id_usuario' => $otroUsuario->id_usuario ?? null,
                        'nombre_completo' => $otroUsuario->nombre_completo ?? 'Usuario',
                        'foto_perfil' => $otroUsuario->foto_perfil ?? null,
                    ],
                    'ultimo_mensaje' => $conv->ultimoMensaje ? [
                        'contenido' => $conv->ultimoMensaje->contenido,
                        'created_at' => $conv->ultimoMensaje->created_at,
                        'es_mio' => $conv->ultimoMensaje->id_emisor == $userId,
                    ] : null,
                    'no_leidos' => $conv->mensajesNoLeidos($userId),
                    'created_at' => $conv->created_at,
                    'updated_at' => $conv->updated_at,
                ];
            })
            ->sortByDesc(function ($conv) {
                return $conv['ultimo_mensaje']['created_at'] ?? $conv['created_at'];
            })
            ->values();

        return response()->json($conversaciones);
    }

    /**
     * POST /api/conversaciones
     * Iniciar una nueva conversación (o devolver la existente).
     * Body: { id_usuario_destino: int }
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_usuario_destino' => 'required|integer|exists:usuarios,id_usuario',
        ]);

        $userId = Auth::id();
        $destinoId = $request->id_usuario_destino;

        // No permitir conversación consigo mismo
        if ($userId == $destinoId) {
            return response()->json(['message' => 'No puedes iniciar una conversación contigo mismo'], 422);
        }

        // Buscar si ya existe una conversación entre ambos usuarios
        $conversacion = Conversacion::where(function ($q) use ($userId, $destinoId) {
            $q->where('id_usuario_1', $userId)->where('id_usuario_2', $destinoId);
        })->orWhere(function ($q) use ($userId, $destinoId) {
            $q->where('id_usuario_1', $destinoId)->where('id_usuario_2', $userId);
        })->first();

        if ($conversacion) {
            // Retornar la existente con datos del otro usuario
            $conversacion->load(['usuario1', 'usuario2']);
            $otroUsuario = $conversacion->getOtroUsuario($userId);

            return response()->json([
                'id_conv' => $conversacion->id_conv,
                'otro_usuario' => [
                    'id_usuario' => $otroUsuario->id_usuario ?? null,
                    'nombre_completo' => $otroUsuario->nombre_completo ?? 'Usuario',
                    'foto_perfil' => $otroUsuario->foto_perfil ?? null,
                ],
                'nueva' => false,
            ]);
        }

        // Crear nueva conversación
        $conversacion = Conversacion::create([
            'id_usuario_1' => $userId,
            'id_usuario_2' => $destinoId,
        ]);

        $conversacion->load(['usuario1', 'usuario2']);
        $otroUsuario = $conversacion->getOtroUsuario($userId);

        return response()->json([
            'id_conv' => $conversacion->id_conv,
            'otro_usuario' => [
                'id_usuario' => $otroUsuario->id_usuario ?? null,
                'nombre_completo' => $otroUsuario->nombre_completo ?? 'Usuario',
                'foto_perfil' => $otroUsuario->foto_perfil ?? null,
            ],
            'nueva' => true,
        ], 201);
    }

    /**
     * GET /api/conversaciones/{id}/mensajes
     * Obtener todos los mensajes de una conversación.
     */
    public function mensajes($id)
    {
        $userId = Auth::id();

        // Verificar que el usuario pertenece a la conversación
        $conversacion = Conversacion::where('id_conv', $id)
            ->where(function ($q) use ($userId) {
                $q->where('id_usuario_1', $userId)->orWhere('id_usuario_2', $userId);
            })
            ->first();

        if (!$conversacion) {
            return response()->json(['message' => 'Conversación no encontrada'], 404);
        }

        // Marcar como leídos todos los mensajes que NO son del usuario actual
        Mensaje::where('id_conv', $id)
            ->where('id_emisor', '!=', $userId)
            ->where('leido', false)
            ->update(['leido' => true]);

        // Obtener mensajes con datos del emisor
        $mensajes = Mensaje::where('id_conv', $id)
            ->with('emisor')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($msg) use ($userId) {
                return [
                    'id_mensaje' => $msg->id_mensaje,
                    'contenido' => $msg->contenido,
                    'es_mio' => $msg->id_emisor == $userId,
                    'emisor' => [
                        'id_usuario' => $msg->emisor->id_usuario ?? null,
                        'nombre_completo' => $msg->emisor->nombre_completo ?? 'Usuario',
                    ],
                    'leido' => $msg->leido,
                    'created_at' => $msg->created_at,
                ];
            });

        return response()->json($mensajes);
    }

    /**
     * POST /api/conversaciones/{id}/mensajes
     * Enviar un mensaje en una conversación.
     * Body: { contenido: string }
     */
    public function enviarMensaje(Request $request, $id)
    {
        $request->validate([
            'contenido' => 'required|string|max:2000',
        ]);

        $userId = Auth::id();

        // Verificar pertenencia a la conversación
        $conversacion = Conversacion::where('id_conv', $id)
            ->where(function ($q) use ($userId) {
                $q->where('id_usuario_1', $userId)->orWhere('id_usuario_2', $userId);
            })
            ->first();

        if (!$conversacion) {
            return response()->json(['message' => 'Conversación no encontrada'], 404);
        }

        // Crear mensaje
        $mensaje = Mensaje::create([
            'id_conv' => $id,
            'id_emisor' => $userId,
            'contenido' => $request->contenido,
            'leido' => false,
        ]);

        // Actualizar timestamp de la conversación para ordenar por actividad reciente
        $conversacion->touch();

        return response()->json([
            'id_mensaje' => $mensaje->id_mensaje,
            'contenido' => $mensaje->contenido,
            'es_mio' => true,
            'emisor' => [
                'id_usuario' => $userId,
                'nombre_completo' => Auth::user()->nombre_completo ?? 'Usuario',
            ],
            'leido' => false,
            'created_at' => $mensaje->created_at,
        ], 201);
    }

    /**
     * GET /api/conversaciones/no-leidos
     * Obtener el total de mensajes no leídos para el usuario.
     */
    public function totalNoLeidos()
    {
        $userId = Auth::id();

        $total = Mensaje::whereHas('conversacion', function ($q) use ($userId) {
            $q->where('id_usuario_1', $userId)->orWhere('id_usuario_2', $userId);
        })
            ->where('id_emisor', '!=', $userId)
            ->where('leido', false)
            ->count();

        return response()->json(['total' => $total]);
    }
}
