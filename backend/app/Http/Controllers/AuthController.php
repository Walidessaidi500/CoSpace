<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (! $usuario || ! Hash::check($request->password, $usuario->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Credenciales incorrectas.',
            ], 401);
        }

        // Optional: Check if account is active
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
