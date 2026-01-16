<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AjusteReserva extends Model
{
    use HasFactory;

    // 1. Configuración de la Tabla
    // Asumo que tu tabla se llama 'ajustes_reserva' siguiendo la convención
    protected $table = 'ajustes_reserva';
    protected $primaryKey = 'id_ajuste';

    // Desactivamos timestamps estándar si la tabla solo registra cuando ocurre el ajuste
    public $timestamps = false;

    // 2. Asignación Masiva
    protected $fillable = [
        'id_reserva',
        'tipo_ajuste',  // Ej: 'Cargo Extra', 'Descuento', 'Multa'
        'monto',
        'motivo',       // Ej: 'Rotura de silla', 'Limpieza extra requerida'
        'fecha_ajuste'
    ];

    // 3. Casteo de Tipos
    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_ajuste' => 'datetime',
    ];

    // 4. Relaciones

    /**
     * Un ajuste pertenece a una Reserva.
     */
    public function reserva()
    {
        return $this->belongsTo(Reserva::class, 'id_reserva', 'id_reserva');
    }
}