<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Anfitrion;
use App\Models\Espacio;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\TwoFactorCode;
use App\Mail\ResetPasswordBrevo;
use Carbon\Carbon;
use Brevo\Brevo;
use Brevo\TransactionalEmails\Requests\SendTransacEmailRequest;
use Brevo\TransactionalEmails\Types\SendTransacEmailRequestSender;
use Brevo\TransactionalEmails\Types\SendTransacEmailRequestToItem;
use Illuminate\Support\Facades\View;

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

            // Asegurar que se cree el registro de Cliente para restricciones de clave foránea
            \App\Models\Cliente::firstOrCreate(['id_usuario' => $usuario->id_usuario]);

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
            'ciudad' => 'required|string|max:100',
            'direccion' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'capacidad' => 'required|integer|min:1',
            'precio_hora' => 'required|numeric|min:0',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
        ]);

        try {
            DB::beginTransaction();

            // 1. Crear Usuario
            $usuario = Usuario::create([
                'nombre_completo' => $validatedData['nombre_completo'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'tipo_usuario' => 'Anfitrion',
                'estado_cuenta' => 'Pendiente',
            ]);

            // 2. Crear entrada de Anfitrión
            Anfitrion::create([
                'id_usuario' => $usuario->id_usuario,
                'biografia' => '',
                'es_verificado' => false,
                'cantidad_espacios' => 1,
            ]);

            // 3. Crear Espacio
            Espacio::create([
                'id_anfitrion' => $usuario->id_usuario,
                'titulo' => $validatedData['titulo'],
                'ciudad' => $validatedData['ciudad'],
                'direccion' => $validatedData['direccion'],
                'descripcion' => $validatedData['descripcion'],
                'capacidad' => $validatedData['capacidad'],
                'precio_hora' => $validatedData['precio_hora'],
                'latitud' => $validatedData['latitud'] ?? null,
                'longitud' => $validatedData['longitud'] ?? null,
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

        // 2FA Logic
        if ($usuario->two_factor_enabled) {
            $this->generate2FACode($usuario);
            return response()->json([
                'status' => '2fa_required',
                'message' => 'Código de verificación enviado a su correo.',
                'email' => $usuario->email
            ]);
        }

        // Opcional: Verificar si la cuenta está activa
        // Asumiendo que estado_cuenta existe en Usuario
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
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        // Validar
        $validatedData = $request->validate([
            'nombre_completo' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:usuarios,email,' . $user->id_usuario . ',id_usuario',
            'foto_perfil' => 'nullable|image|max:5120', // Máx 5MB
            'telefono' => 'nullable|string|max:20' // Si añades teléfono a usuarios o tabla relacionada
        ]);

        try {
            DB::beginTransaction();

            $user->nombre_completo = $validatedData['nombre_completo'];
            $user->email = $validatedData['email'];

            // Manejar subida de foto
            if ($request->hasFile('foto_perfil')) {
                $path = $request->file('foto_perfil')->store('perfiles', 'public');
                $user->foto_perfil = $path;
            }

            // Manejar Teléfono (Si está en una tabla relacionada como Clientes/Anfitriones o Users si lo añadiste)
            // Por ahora asumiendo que podría estar en 'usuarios' o manejado por separado.
            // Si 'telefono' NO está en la tabla 'usuarios' sino en 'clientes'/'anfitriones', necesitas lógica aquí.
            // Basado en contexto previo, 'telefono' estaba en 'clientes'. Verificamos tipo de usuario.
            if ($request->has('telefono')) {
                if ($user->tipo_usuario === 'Cliente') {
                    \App\Models\Cliente::updateOrCreate(
                        ['id_usuario' => $user->id_usuario],
                        ['telefono' => $request->telefono]
                    );
                }
                // Añadir lógica para Anfitrión si es necesario, o si Usuario tiene columna telefono
            }

            $user->save();
            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Perfil actualizado correctamente',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Error al actualizar perfil'], 500);
        }
    }

    // --- 2FA & Password Reset Logic ---

    public function generate2FACode(Usuario $usuario)
    {
        $code = rand(100000, 999999);
        $usuario->two_factor_code = $code;
        $usuario->two_factor_expires_at = Carbon::now()->addMinutes(10);
        $usuario->save();

        try {
            Mail::to($usuario->email)->send(new TwoFactorCode($code));
        } catch (\Exception $e) {
            Log::error('Error sending 2FA email: ' . $e->getMessage());
        }
    }

    public function verify2FA(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        if ($usuario->two_factor_code === $request->code && Carbon::now()->lt($usuario->two_factor_expires_at)) {
            // Reset code
            $usuario->two_factor_code = null;
            $usuario->two_factor_expires_at = null;
            $usuario->save();

            $token = $usuario->createToken('auth_token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Login exitoso',
                'data' => [
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'user' => $usuario,
                    'role' => $usuario->tipo_usuario
                ]
            ]);
        }

        return response()->json(['message' => 'Código inválido o expirado'], 401);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario) {
            return response()->json(['message' => 'Si el correo existe, se ha enviado un código.'], 200);
        }

        $code = rand(100000, 999999);
        $usuario->two_factor_code = $code;
        $usuario->two_factor_expires_at = Carbon::now()->addMinutes(15);
        $usuario->save();

        try {
            // Configurar integración de la API de Brevo (v4.x)
            $brevo = new Brevo(env('BREVO_API_KEY', ''));

            // Renderizar la vista de correo existente en HTML
            $htmlContent = View::make('emails.reset_password', ['code' => $code])->render();

            $requestSmtpEmail = new SendTransacEmailRequest([
                'subject' => 'Restablecer Contraseña - CoSpace',
                'htmlContent' => $htmlContent,
                'sender' => new SendTransacEmailRequestSender([
                    'name' => env('APP_NAME', 'CoSpace'),
                    'email' => env('MAIL_FROM_ADDRESS', 'no-reply@cospace.com')
                ]),
                'to' => [
                    new SendTransacEmailRequestToItem([
                        'email' => $usuario->email,
                        'name' => $usuario->nombre_completo
                    ])
                ]
            ]);

            // Enviar a través de Brevo API
            $brevo->transactionalEmails->sendTransacEmail($requestSmtpEmail);
        } catch (\Brevo\Exceptions\BrevoApiException $e) {
            Log::error('Forgot Password Email Error (Brevo API): ' . $e->getMessage() . ' | Body: ' . json_encode($e->getBody()));
        } catch (\Throwable $e) {
            Log::error('Forgot Password Email Error: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Si el correo existe, se ha enviado un código.'], 200);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
            'password' => 'required|string|min:8|confirmed'
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario) {
            return response()->json(['message' => 'Error al restablecer contraseña'], 400);
        }

        if ($usuario->two_factor_code === $request->code && Carbon::now()->lt($usuario->two_factor_expires_at)) {
            $usuario->password = Hash::make($request->password);
            $usuario->two_factor_code = null;
            $usuario->two_factor_expires_at = null;
            $usuario->save();

            return response()->json(['message' => 'Contraseña restablecida correctamente'], 200);
        }

        return response()->json(['message' => 'Código inválido o expirado'], 400);
    }

    public function update2FASettings(Request $request)
    {
        $user = $request->user();
        $request->validate(['enabled' => 'required|boolean']);

        $user->two_factor_enabled = $request->enabled;
        $user->save();

        return response()->json(['message' => 'Configuración de 2FA actualizada', 'enabled' => $user->two_factor_enabled]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed'
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'La contraseña actual no es correcta.'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

}
