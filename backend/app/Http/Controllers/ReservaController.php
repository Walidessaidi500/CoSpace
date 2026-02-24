<?php

namespace App\Http\Controllers;

use App\Models\Reserva;
use App\Models\Espacio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ReservaController extends Controller
{
    /**
     * Auto-sync reservation statuses based on current date.
     * - Confirmada + fecha_inicio <= now => En_Curso
     * - En_Curso/Confirmada + fecha_fin < now => Finalizada
     */
    private function autoSyncEstados()
    {
        $now = Carbon::now();

        // Reservas confirmadas cuyo plazo ya ha empezado => En_Curso
        Reserva::where('estado', 'Confirmada')
            ->where('fecha_inicio', '<=', $now)
            ->where('fecha_fin', '>=', $now)
            ->update(['estado' => 'En_Curso']);

        // Reservas en curso o confirmadas cuyo plazo ya ha terminado => Finalizada
        Reserva::whereIn('estado', ['Confirmada', 'En_Curso'])
            ->where('fecha_fin', '<', $now)
            ->update(['estado' => 'Finalizada']);
    }
    /**
     * Paso 1: Inicializar Intención de Pago
     * Valida disponibilidad y crea una Intención de Stripe. NO guarda en BD todavía.
     */
    public function createPaymentIntent(Request $request)
    {
        // 1. Validación
        $validator = Validator::make($request->all(), [
            'id_espacio' => 'required|exists:espacios,id_espacio',
            'fecha_inicio' => 'required|date|after:now',
            'fecha_fin' => 'required|date|after:fecha_inicio',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        if (!$user)
            return response()->json(['message' => 'Unauthorized'], 401);

        try {
            $espacio = Espacio::findOrFail($request->id_espacio);

            // Calcular Precio
            $start = Carbon::parse($request->fecha_inicio);
            $end = Carbon::parse($request->fecha_fin);

            // Lógica: Días * Precio
            $days = $start->diffInDays($end);
            if ($days < 1)
                $days = ceil($start->diffInHours($end) / 24);
            if ($days < 1)
                $days = 1;

            $montoTotal = $days * $espacio->precio_hora;
            $amountCents = (int) ($montoTotal * 100);

            // Inicializar Stripe
            $stripeSecret = trim(config('services.stripe.secret'));
            if (!$stripeSecret) {
                throw new \Exception("Stripe Secret not configured.");
            }
            \Stripe\Stripe::setApiKey($stripeSecret);

            $paymentIntent = \Stripe\PaymentIntent::create([
                'amount' => $amountCents,
                'currency' => 'eur',
                'automatic_payment_methods' => ['enabled' => true],
                'metadata' => [
                    'user_id' => $user->id_usuario,
                    'espacio_id' => $espacio->id_espacio,
                    'fecha_inicio' => $request->fecha_inicio,
                    'fecha_fin' => $request->fecha_fin
                ],
                'description' => 'Reserva de espacio: ' . $espacio->titulo,
            ]);

            return response()->json([
                'status' => 'success',
                'clientSecret' => $paymentIntent->client_secret,
                'paymentIntentId' => $paymentIntent->id,
                'details' => [
                    'monto_total' => $montoTotal,
                    'days' => $days
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al iniciar pago',
                'debug' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Paso 2: Confirmar y Guardar Reserva
     * Se llama después de que el frontend confirma el pago. Verifica el estado en Stripe y luego guarda en BD.
     */
    public function store(Request $request)
    {
        // Ahora 'store' actúa como el paso de finalización
        $validator = Validator::make($request->all(), [
            'payment_intent_id' => 'required|string',
            'id_espacio' => 'required|exists:espacios,id_espacio',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        try {
            // 1. Verificar Pago con Stripe
            $stripeSecret = env('STRIPE_SECRET');
            \Stripe\Stripe::setApiKey($stripeSecret);

            $paymentIntent = \Stripe\PaymentIntent::retrieve($request->payment_intent_id);

            if ($paymentIntent->status !== 'succeeded') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El pago no ha sido completado/verificado (' . $paymentIntent->status . ')'
                ], 400);
            }

            // 2. Asegurar que existe registro de Cliente (Corrección de Clave Foránea)
            // A veces los usuarios existen en 'usuarios' pero no en 'clientes' debido a datos antiguos o bugs de auth
            if (!\App\Models\Cliente::where('id_usuario', $user->id_usuario)->exists()) {
                \App\Models\Cliente::create(['id_usuario' => $user->id_usuario]);
            }

            // 3. Crear Reserva en BD
            $espacio = Espacio::findOrFail($request->id_espacio);
            // Recalcular para coincidir con el registro (o confiar en metadata, pero mejor recalcular o usar monto del intent)
            // Idealmente confiamos en nuestro propio cálculo o en el monto del intento

            $start = Carbon::parse($request->fecha_inicio);
            $end = Carbon::parse($request->fecha_fin);
            // ... (lógica de recálculo o usar valores pasados si son de confianza, normalmente recalcular es más seguro)
            $days = $start->diffInDays($end);
            if ($days < 1)
                $days = ceil($start->diffInHours($end) / 24);
            if ($days < 1)
                $days = 1;

            $montoTotal = $days * $espacio->precio_hora;

            $reserva = Reserva::create([
                'id_cliente' => $user->id_usuario,
                'id_espacio' => $espacio->id_espacio,
                'fecha_inicio' => $start,
                'fecha_fin' => $end,
                'monto_total' => $montoTotal,
                'estado' => 'Confirmada', // Confirmada directamente como pagada
            ]);

            // Registrar el pago en la base de datos
            \App\Models\Pago::create([
                'id_reserva' => $reserva->id_reserva,
                'monto_pagado' => $montoTotal,
                'metodo_pago' => 'Tarjeta',
                'estado_pago' => 'Completado'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Reserva guardada y confirmada exitosamente',
                'reserva' => $reserva
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al guardar la reserva',
                'debug' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Muestra el recurso especificado.
     */
    public function show($id)
    {
        // Implementar si se necesita para detalles
    }
    /**
     * Listar reservas para los espacios propiedad del anfitrión autenticado.
     */
    public function indexAnfitrion(Request $request)
    {
        $user = $request->user();

        // Auto-sync statuses before returning
        $this->autoSyncEstados();

        \Illuminate\Support\Facades\Log::info("Fetching reservations for host: " . $user->id_usuario);

        $reservas = Reserva::whereHas('espacio', function ($query) use ($user) {
            $query->where('id_anfitrion', $user->id_usuario);
        })->with([
            'espacio' => function ($query) {
                $query->select('id_espacio', 'titulo', 'ciudad', 'direccion');
            },
            'espacio.fotos',
            'usuario:id_usuario,nombre_completo,email,foto_perfil'
        ])
        ->orderBy('fecha_inicio', 'desc')
        ->get();

        return response()->json($reservas);
    }

    /**
     * Listar reservas del cliente autenticado.
     */
    public function indexCliente(Request $request)
    {
        $user = $request->user();

        // Auto-sync statuses before returning
        $this->autoSyncEstados();

        $reservas = Reserva::where('id_cliente', $user->id_usuario)
            ->with([
                'espacio' => function ($query) {
                    $query->select('id_espacio', 'titulo', 'ciudad', 'direccion', 'precio_hora');
                },
                'espacio.fotos'
            ])
            ->orderBy('fecha_inicio', 'desc')
            ->get();

        return response()->json($reservas);
    }

    /**
     * Cancelar una reserva del cliente.
     */
    public function cancelar(Request $request, $id)
    {
        $user = $request->user();
        
        $reserva = Reserva::where('id_reserva', $id)
            ->where('id_cliente', $user->id_usuario)
            ->first();

        if (!$reserva) {
            return response()->json(['message' => 'Reserva no encontrada'], 404);
        }

        if ($reserva->estado === 'Cancelada') {
            return response()->json(['message' => 'La reserva ya está cancelada'], 400);
        }

        $reserva->estado = 'Cancelada';
        $reserva->save();

        return response()->json(['message' => 'Reserva cancelada correctamente', 'reserva' => $reserva]);
    }

    /**
     * Anfitrión cambia el estado de una reserva de sus espacios.
     */
    public function updateEstadoAnfitrion(Request $request, $id)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'estado' => 'required|string|in:Confirmada,En_Curso,Finalizada,Cancelada',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Estado no válido', 'errors' => $validator->errors()], 422);
        }

        // Find the reservation and verify it belongs to one of the host's spaces
        $reserva = Reserva::whereHas('espacio', function ($query) use ($user) {
            $query->where('id_anfitrion', $user->id_usuario);
        })->where('id_reserva', $id)->first();

        if (!$reserva) {
            return response()->json(['message' => 'Reserva no encontrada o no tienes permisos'], 404);
        }

        $reserva->estado = $request->estado;
        $reserva->save();

        return response()->json([
            'message' => 'Estado actualizado correctamente',
            'reserva' => $reserva
        ]);
    }
}
