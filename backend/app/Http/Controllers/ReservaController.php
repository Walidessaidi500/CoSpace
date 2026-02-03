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
     * Step 1: Initialize Payment Intent
     * Validates availability and creates a Stripe Intent. Does NOT save to DB yet.
     */
    public function createPaymentIntent(Request $request)
    {
        // 1. Validation
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

            // Calculate Price
            $start = Carbon::parse($request->fecha_inicio);
            $end = Carbon::parse($request->fecha_fin);

            // Logic: Days * Price
            $days = $start->diffInDays($end);
            if ($days < 1)
                $days = ceil($start->diffInHours($end) / 24);
            if ($days < 1)
                $days = 1;

            $montoTotal = $days * $espacio->precio_hora;
            $amountCents = (int) ($montoTotal * 100);

            // Stripe Init
            $stripeSecret = env('STRIPE_SECRET');
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
     * Step 2: Confirm & Store Reservation
     * Called after frontend confirms payment. Verifies Stripe status then saves to DB.
     */
    public function store(Request $request)
    {
        // Now 'store' acts as the finalization step
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
            // 1. Verify Payment with Stripe
            $stripeSecret = env('STRIPE_SECRET');
            \Stripe\Stripe::setApiKey($stripeSecret);

            $paymentIntent = \Stripe\PaymentIntent::retrieve($request->payment_intent_id);

            if ($paymentIntent->status !== 'succeeded') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El pago no ha sido completado/verificado (' . $paymentIntent->status . ')'
                ], 400);
            }

            // 2. Ensure Cliente Record Exists (Foreign Key Constraint Fix)
            // Sometimes users exist in 'usuarios' but not 'clientes' due to legacy data or auth bugs
            if (!\App\Models\Cliente::where('id_usuario', $user->id_usuario)->exists()) {
                \App\Models\Cliente::create(['id_usuario' => $user->id_usuario]);
            }

            // 3. Create Reservation in DB
            $espacio = Espacio::findOrFail($request->id_espacio);
            // Re-calculate to match record (or trust metadata, but better to recalc or use amount from intent)
            // Ideally we trust our own calculation or the intent amount

            $start = Carbon::parse($request->fecha_inicio);
            $end = Carbon::parse($request->fecha_fin);
            // ... (re-calc logic or just use passed values if trusted, usually recalc is safer)
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
                'estado' => 'Confirmada', // Directly confirmed as paid
                // 'payment_id' => $paymentIntent->id // If you had a column for this
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
     * Display the specified resource.
     */
    public function show($id)
    {
        // Implement if needed for details
    }
}
