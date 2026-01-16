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
                'estado_cuenta' => 'Activo',
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
            'ciudad' => 'required|string|max:100', // Added ciudad
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
                'ciudad' => $validatedData['ciudad'], // Now required
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

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Credenciales incorrectas.',
            ], 401);
        }

        // Optional: Check if account is active
        // Assuming estado_cuenta exists on Usuario
        if ($usuario->estado_cuenta === 'Suspendido') {
            return response()->json([
                'status' => 'error',
                'message' => 'Su cuenta ha sido suspendida.',
            ], 403);
        }

        $token = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Inicio de sesión exitoso',
            'data' => [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $usuario,
                'role' => $usuario->tipo_usuario // 'Cliente', 'Anfitrion', 'Admin'
            ]
        ]);
    }
}
