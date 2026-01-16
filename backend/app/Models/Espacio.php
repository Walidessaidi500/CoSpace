<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Espacio extends Model
{
    use HasFactory;

    // 1. Configuración de la Tabla
    protected $table = 'espacios';
    protected $primaryKey = 'id_espacio';
    
    // 2. Asignación Masiva (Mass Assignment)
    // Estos son los campos que permitimos guardar con Espacio::create([])
    protected $fillable = [
        'id_anfitrion',
        'titulo',
        'ciudad',       // Asegúrate de tener esta columna en tu DB
        'direccion',
        'descripcion',
        'precio_hora',
        'capacidad',
        'rating_promedio', // Valores por defecto (se pueden manejar en BD también)
        'total_resenas',
        'estado',
        'latitud',      // Opcionales por si los usas a futuro
        'longitud'
    ];

    // 3. Relaciones (Eloquent Relationships)

    /**
     * Un espacio pertenece a un Anfitrión (Usuario).
     */
    public function anfitrion()
    {
        return $this->belongsTo(Anfitrion::class, 'id_anfitrion', 'id_usuario');
    }

    /**
     * Un espacio tiene muchos Servicios (Relación Muchos a Muchos).
     * Tabla pivote: espacio_servicios
     */
    public function servicios()
    {
        return $this->belongsToMany(
            Servicio::class, 
            'espacio_servicios', // Nombre tabla intermedia
            'id_espacio',        // FK de este modelo en la tabla intermedia
            'id_servicio'        // FK del otro modelo en la tabla intermedia
        );
    }

    /**
     * Un espacio tiene muchas Fotos.
     */
    public function fotos()
    {
        return $this->hasMany(FotoEspacio::class, 'id_espacio');
    }

    /**
     * Un espacio tiene muchas Reservas.
     */
    public function reservas()
    {
        return $this->hasMany(Reserva::class, 'id_espacio');
    }
}