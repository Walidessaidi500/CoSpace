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

    // Desactivamos timestamps automáticos si usas una columna propia 'fecha_valoracion'
    public $timestamps = false;

    // 2. Asignación Masiva
    protected $fillable = [
        'id_reserva',
        'id_espacio',     // Guardamos el ID del espacio para consultas rápidas sin pasar por reserva
        'id_usuario',     // El autor de la reseña (Cliente)
        'calificacion',   // Entero (ej: 1 a 5)
        'comentario',     // Texto de la opinión
        'fecha_valoracion'
    ];

    // 3. Casteo de Tipos
    protected $casts = [
        'fecha_valoracion' => 'datetime',
        'calificacion'     => 'integer',
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
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }
}