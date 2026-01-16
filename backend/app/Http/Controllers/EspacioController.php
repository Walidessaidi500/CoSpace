<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Espacio;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class EspacioController extends Controller
{
    /**
     * Lista los espacios del anfitrión actual.
     */
    public function index()
    {
        // TRUCO PARA DESARROLLO:
        $anfitrionId = Auth::id() ?? 1;

        $espacios = Espacio::where('id_anfitrion', $anfitrionId)
            ->with(['fotos', 'servicios']) // Cargar relaciones
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($espacios);
    }

    /**
     * Guarda un nuevo espacio y sus servicios asociados.
     */
    public function store(Request $request)
    {
        // 1. VALIDACIÓN DE DATOS
        // Definimos las reglas que deben cumplir los datos que vienen de Angular
        $validator = Validator::make($request->all(), [
            'titulo'      => 'required|string|max:100',
            'ciudad'      => 'required|string|max:100',
            'direccion'   => 'required|string|max:255',
            'descripcion' => 'required|string|min:20',
            'precio_hora' => 'required|numeric|min:0',
            'capacidad'   => 'required|integer|min:1',
            // Validamos que 'servicios' sea un array y que cada ID exista en la tabla servicios
            'servicios'   => 'array',
            'servicios.*' => 'integer|exists:servicios,id_servicio',
            // Validación de fotos
            'fotos'       => 'array|min:3', // Mínimo 3 fotos como pide el frontend
            'fotos.*'     => 'image|mimes:jpeg,png,jpg|max:5120' // 5MB max
        ]);

        // Si la validación falla, devolvemos error 422 con los detalles
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // 2. INSERCIÓN EN LA BASE DE DATOS (Transacción)
        try {
            return DB::transaction(function () use ($request) {
                
                // TRUCO PARA DESARROLLO:
                // Si hay usuario logueado (Auth::id()), usa ese ID.
                // Si no (porque estás probando con Postman o sin login), usa el ID 1.
                $anfitrionId = Auth::id() ?? 1; 

                // A. Crear el registro en la tabla 'espacios'
                $espacio = Espacio::create([
                    'id_anfitrion'    => $anfitrionId,
                    'titulo'          => $request->titulo,
                    'ciudad'          => $request->ciudad,
                    'direccion'       => $request->direccion,
                    'descripcion'     => $request->descripcion,
                    'precio_hora'     => $request->precio_hora,
                    'capacidad'       => $request->capacidad,
                    'estado'          => 'Disponible', // Valor por defecto
                    'rating_promedio' => 0.00,
                    'total_resenas'   => 0
                ]);

                // B. Vincular los servicios (Tabla pivote 'espacio_servicios')
                // El método 'attach' inserta las filas en la tabla intermedia automáticamente
                if ($request->has('servicios') && !empty($request->servicios)) {
                    $espacio->servicios()->attach($request->servicios);
                }

                // C. Guardar Imágenes
                if ($request->hasFile('fotos')) {
                    foreach ($request->file('fotos') as $index => $foto) {
                        // Guardar en storage/app/public/espacios
                        $path = $foto->store('espacios', 'public');
                        
                        // Crear registro en base de datos
                        \App\Models\FotoEspacio::create([
                            'id_espacio'   => $espacio->id_espacio,
                            'url_foto'     => '/storage/' . $path, // Ruta accesible públicamente
                            'es_principal' => $index === 0 // La primera es la principal
                        ]);
                    }
                }

                // D. Respuesta Exitosa
                // Devolvemos el espacio creado junto con sus servicios para confirmar
                return response()->json([
                    'message' => 'Espacio creado exitosamente',
                    'data'    => $espacio->load(['servicios', 'fotos'])
                ], 201);
            });

        } catch (\Exception $e) {
            // Si algo falla en el try, la transacción se deshace (rollback)
            return response()->json([
                'message' => 'Error al guardar en la base de datos',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Elimina un espacio.
     */
    public function destroy($id)
    {
        $anfitrionId = Auth::id() ?? 1;

        $espacio = Espacio::where('id_espacio', $id)
            ->where('id_anfitrion', $anfitrionId)
            ->first();

        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado o no autorizado'], 404);
        }

        $espacio->delete();

        return response()->json(['message' => 'Espacio eliminado correctamente']);
    }
}
