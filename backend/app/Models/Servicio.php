<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Servicio extends Model
{
    use HasFactory;

    // 1. Configuración de la Tabla
    protected $table = 'servicios';
    protected $primaryKey = 'id_servicio';
    
    // Si en tu SQL no añadiste 'created_at' y 'updated_at' a esta tabla,
    // debes poner esto en false. Si sí los tienes, bórralo o ponlo en true.
    public $timestamps = false; 

    // 2. Asignación Masiva
    protected $fillable = [
        'nombre_servicio',
        'icono_url' // Por si guardas la clase del icono (ej: 'fa-wifi') o la URL de la imagen
    ];

    // 3. Relaciones

    /**
     * Relación inversa Muchos a Muchos:
     * Un Servicio (ej: Wifi) puede estar en muchos Espacios.
     */
    public function espacios()
    {
        return $this->belongsToMany(
            Espacio::class, 
            'espacio_servicios', // Tabla pivote
            'id_servicio',       // FK de este modelo en la pivote
            'id_espacio'         // FK del otro modelo en la pivote
        );
    }
}