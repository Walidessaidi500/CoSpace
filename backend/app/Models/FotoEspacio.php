<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FotoEspacio extends Model
{
    use HasFactory;

    // 1. Configuración de la Tabla
    protected $table = 'fotos_espacio';
    protected $primaryKey = 'id_foto';
    
    // Desactivamos timestamps porque la tabla en BD no tiene created_at/updated_at
    public $timestamps = false;

    // 2. Asignación Masiva
    protected $fillable = [
        'id_espacio',
        'url_foto',     // Aquí guardarás la ruta (ej: 'espacios/foto1.jpg')
        'es_principal'  // Booleano (1 o 0)
    ];

    // 3. Relaciones

    /**
     * Una foto pertenece a un único Espacio.
     */
    public function espacio()
    {
        return $this->belongsTo(Espacio::class, 'id_espacio', 'id_espacio');
    }
}