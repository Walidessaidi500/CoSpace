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

    // Desactivamos timestamps si tu tabla no tiene created_at/updated_at
    // Normalmente la fecha importante aquí es 'fecha_pago'
    public $timestamps = false; 

    // 2. Asignación Masiva
    protected $fillable = [
        'id_reserva',
        'monto',            // La cantidad cobrada (puede diferir del total de reserva si hay descuentos)
        'metodo_pago',      // 'Tarjeta', 'PayPal', 'Transferencia'
        'estado_pago',      // 'Pendiente', 'Completado', 'Fallido', 'Reembolsado'
        'fecha_pago',       // Fecha y hora real de la transacción
        'id_transaccion'    // ID externo de Stripe/PayPal (vital para reembolsos)
    ];

    // 3. Casteo de Tipos
    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'datetime',
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