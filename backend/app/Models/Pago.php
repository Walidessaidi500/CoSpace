<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    use HasFactory;

    // 1. Configuración de la Tabla
    protected $table = 'pagos';
    protected $primaryKey = 'id_pago';

    // Activamos timestamps ya que la migración incluye $table->timestamps()
    public $timestamps = true; 

    // 2. Asignación Masiva
    protected $fillable = [
        'id_reserva',
        'monto_pagado',     
        'metodo_pago',      // 'Tarjeta', 'PayPal', 'Transferencia'
        'estado_pago',      // 'Pendiente', 'Completado', 'Fallido', 'Reembolsado'
    ];

    // 3. Casteo de Tipos
    protected $casts = [
        'monto_pagado' => 'decimal:2',
    ];

    // 4. Relaciones

    /**
     * Un pago pertenece a una Reserva específica.
     */
    public function reserva()
    {
        return $this->belongsTo(Reserva::class, 'id_reserva', 'id_reserva');
    }
}