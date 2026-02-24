<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Valoracion extends Model
{
    use HasFactory;

    // 1. Configuración de la Tabla
    protected $table = 'valoraciones';
    protected $primaryKey = 'id_valoracion';

    // Usar timestamps automáticos (created_at / updated_at)
    public $timestamps = true;

    // 2. Asignación Masiva
    protected $fillable = [
        'id_reserva',
        'id_espacio',
        'id_usuario',
        'puntuacion',
        'comentario',
    ];

    // 3. Casteo de Tipos
    protected $casts = [
        'puntuacion' => 'integer',
    ];

    // 4. Relaciones

    /**
     * La valoración pertenece a una Reserva específica.
     */
    public function reserva()
    {
        return $this->belongsTo(Reserva::class, 'id_reserva', 'id_reserva');
    }

    /**
     * La valoración pertenece a un Espacio (el objeto calificado).
     */
    public function espacio()
    {
        return $this->belongsTo(Espacio::class, 'id_espacio', 'id_espacio');
    }

    /**
     * La valoración fue escrita por un Usuario (Cliente).
     */
    public function autor()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}