<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Anfitrion;
use App\Models\Espacio;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function registerClient(Request $request)
    {
        $validatedData = $request->validate([
            'nombre_completo' => 'required|string|max:100',
            'email' => 'required|string|email|max:150|unique:usuarios',
            'password' => 'required|string|min:8',
        ]);

        try {
            DB::beginTransaction();

            $usuario = Usuario::create([
                'nombre_completo' => $validatedData['nombre_completo'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'tipo_usuario' => 'Cliente',
                'estado_cuenta' => 'Activo', // Clients can be active by default
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Client registered successfully',
                'user' => $usuario
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e->getMessage());
            return response()->json(['error' => 'Registration failed: ' . $e->getMessage()], 500);
        }
    }

    public function register(Request $request)
    {
        $validatedData = $request->validate([
            'nombre_completo' => 'required|string|max:100',
            'email' => 'required|string|email|max:150|unique:usuarios',
            'password' => 'required|string|min:8',
            'titulo' => 'required|string|max:100',
            'direccion' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'capacidad' => 'required|integer|min:1',
            'precio_hora' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            // 1. Create Usuario
            $usuario = Usuario::create([
                'nombre_completo' => $validatedData['nombre_completo'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'tipo_usuario' => 'Anfitrion',
                'estado_cuenta' => 'Pendiente',
            ]);

            // 2. Create Anfitrion entry
            Anfitrion::create([
                'id_usuario' => $usuario->id_usuario,
                'biografia' => '',
                'es_verificado' => false,
                'cantidad_espacios' => 1,
            ]);

            // 3. Create Espacio
            Espacio::create([
                'id_anfitrion' => $usuario->id_usuario,
                'titulo' => $validatedData['titulo'],
                'direccion' => $validatedData['direccion'],
                'descripcion' => $validatedData['descripcion'],
                'capacidad' => $validatedData['capacidad'],
                'precio_hora' => $validatedData['precio_hora'],
                'estado' => 'Disponible',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'User and Space created successfully',
                'user' => $usuario
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e->getMessage());
            return response()->json(['error' => 'Registration failed: ' . $e->getMessage()], 500);
        }
    }
}
