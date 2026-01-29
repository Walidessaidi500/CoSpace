<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Espacio;
use App\Models\Usuario; // Use Usuario
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class EspacioController extends Controller
{
    // Public endpoint for searching spaces (HEAD logic extended)
    public function index()
    {
        try {
            // Include relations for display
            $espacios = Espacio::with(['fotos', 'servicios'])->get();
            return response()->json($espacios);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Host endpoint for managing their spaces (Victor logic)
    public function indexAnfitrion()
    {
        $anfitrionId = Auth::id();

        try {
            $espacios = Espacio::where('id_anfitrion', $anfitrionId)
                ->with(['fotos', 'servicios'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($espacios);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:100',
            'ciudad' => 'required|string|max:100', // ciudad is required
            'direccion' => 'required|string|max:255',
            'descripcion' => 'required|string|min:20',
            'precio_hora' => 'required|numeric|min:0',
            'capacidad' => 'required|integer|min:1',
            'servicios' => 'array',
            'servicios.*' => 'integer|exists:servicios,id_servicio',
            'fotos' => 'array|min:3',
            'fotos.*' => 'image|mimes:jpeg,png,jpg|max:5120'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {

                // Remove hardcoded test logic for production, but keep fallback if Auth fails during strict mode dev
                $anfitrionId = Auth::id();

                if (!$anfitrionId) {
                    // Fallback/Test only - maybe remove if not needed? 
                    // Assuming Auth is handled correcty via Sanctum
                    return response()->json(['message' => 'Unauthenticated'], 401);
                }

                $espacio = Espacio::create([
                    'id_anfitrion' => $anfitrionId,
                    'titulo' => $request->titulo,
                    'ciudad' => $request->ciudad,
                    'direccion' => $request->direccion,
                    'descripcion' => $request->descripcion,
                    'precio_hora' => $request->precio_hora,
                    'capacidad' => $request->capacidad,
                    'estado' => 'Disponible',
                    'rating_promedio' => 0.00,
                    'total_resenas' => 0
                ]);

                if ($request->has('servicios') && !empty($request->servicios)) {
                    $espacio->servicios()->attach($request->servicios);
                }
                if ($request->hasFile('fotos')) {
                    foreach ($request->file('fotos') as $index => $foto) {
                        $path = $foto->store('espacios', 'public');

                        \App\Models\FotoEspacio::create([
                            'id_espacio' => $espacio->id_espacio,
                            'url_foto' => '/storage/' . $path,
                            'es_principal' => $index === 0
                        ]);
                    }
                }

                return response()->json([
                    'message' => 'Espacio creado exitosamente',
                    'data' => $espacio->load(['servicios', 'fotos'])
                ], 201);
            });

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al guardar en la base de datos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $espacio = Espacio::with(['fotos', 'servicios'])->find($id);
            if (!$espacio) {
                return response()->json(['message' => 'Espacio no encontrado'], 404);
            }
            return response()->json($espacio);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $anfitrionId = Auth::id();

        if (!$anfitrionId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $espacio = Espacio::where('id_espacio', $id)
            ->where('id_anfitrion', $anfitrionId)
            ->first();

        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado o no autorizado'], 404);
        }

        $espacio->delete();

        return response()->json(['message' => 'Espacio eliminado correctamente']);
    }

    public function update(Request $request, $id)
    {
        $anfitrionId = Auth::id();

        if (!$anfitrionId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $espacio = Espacio::where('id_espacio', $id)
            ->where('id_anfitrion', $anfitrionId)
            ->first();

        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado o no autorizado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:100',
            'ciudad' => 'sometimes|required|string|max:100',
            'direccion' => 'sometimes|required|string|max:255',
            'descripcion' => 'sometimes|required|string|min:20',
            'precio_hora' => 'sometimes|required|numeric|min:0',
            'capacidad' => 'sometimes|required|integer|min:1',
            'servicios' => 'array',
            'servicios.*' => 'integer|exists:servicios,id_servicio',
            // Photos handling in update can be complex (add/remove), 
            // for simplicity we might only allow adding new ones here or handle separately
            // depending on frontend implementation.
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::transaction(function () use ($request, $espacio) {
                $espacio->update($request->only([
                    'titulo', 'ciudad', 'direccion', 'descripcion', 
                    'precio_hora', 'capacidad'
                ]));

                if ($request->has('servicios')) {
                    $espacio->servicios()->sync($request->servicios);
                }
                
                // Photo upload logic for update (Appending new photos)
                if ($request->hasFile('fotos')) {
                     foreach ($request->file('fotos') as $foto) {
                        $path = $foto->store('espacios', 'public');
                        \App\Models\FotoEspacio::create([
                            'id_espacio' => $espacio->id_espacio,
                            'url_foto' => '/storage/' . $path,
                            'es_principal' => false 
                        ]);
                    }
                }
            });

            return response()->json([
                'message' => 'Espacio actualizado exitosamente',
                'data' => $espacio->load(['servicios', 'fotos'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el espacio',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
