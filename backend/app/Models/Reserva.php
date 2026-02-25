<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reserva extends Model
{
    use HasFactory;

    // 1. Configuración de la Tabla
    protected $table = 'reservas';
    protected $primaryKey = 'id_reserva';

    // Configuración de Fechas
    public $timestamps = true; // La tabla tiene columnas created_at y updated_at

    // 2. Asignación Masiva
    protected $fillable = [
        'id_cliente',
        'id_espacio',
        'fecha_inicio',
        'fecha_fin',
        'monto_total',
        'estado' // 'Pendiente', 'Confirmada', 'En_Curso', 'Finalizada', 'Cancelada'
    ];

    // 3. Casteo de Tipos (¡Importante!)
    // Esto convierte automáticamente las fechas de string a objetos Carbon
    protected $casts = [
        'fecha_inicio' => 'datetime',
        'fecha_fin' => 'datetime',
        'monto_total' => 'decimal:2',
    ];

    // 4. Relaciones

    /**
     * Una reserva pertenece a un Cliente (Usuario).
     */
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_usuario');
    }

    /**
     * Una reserva pertenece a un Espacio.
     */
    public function espacio()
    {
        return $this->belongsTo(Espacio::class, 'id_espacio', 'id_espacio');
    }

    /**
     * Una reserva tiene un pago asociado (Relación 1:1).
     */
    public function pago()
    {
        return $this->hasOne(Pago::class, 'id_reserva', 'id_reserva');
    }

    /**
     * Una reserva puede tener ajustes (cargos extra o descuentos).
     */
    public function ajustes()
    {
        return $this->hasMany(AjusteReserva::class, 'id_reserva', 'id_reserva');
    }

    /**
     * Una reserva tiene una valoración final (Review).
     */
    public function valoracion()
    {
        return $this->hasOne(Valoracion::class, 'id_reserva', 'id_reserva');
    }

    /**
     * Relación directa con el Usuario (Cliente) para evitar pasar por el modelo Cliente si no es necesario.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_cliente', 'id_usuario');
    }

    /**
     * Eliminar en cascada a través de Eloquent
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($reserva) {
            // Eliminar dependencias antes de borrar la reserva para evitar error 1451 FK constraint
            if ($reserva->pago) {
                $reserva->pago->delete();
            }
            if ($reserva->valoracion) {
                $reserva->valoracion->delete();
            }
            $reserva->ajustes()->delete(); // hasMany
        });
    }
}