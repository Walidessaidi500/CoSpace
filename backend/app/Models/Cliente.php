<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;

    // 1. Configuración de la Tabla
    protected $table = 'clientes';
    
    // La clave primaria es 'id_usuario' (compartida con la tabla usuarios)
    protected $primaryKey = 'id_usuario';

    // IMPORTANTE: El ID no se genera solo en esta tabla, viene del usuario padre.
    // Si no pones esto en false, Laravel intentará convertirlo y fallará al guardar.
    public $incrementing = false;

    // Desactivamos timestamps (según tu esquema SQL, esta tabla no los tenía)
    public $timestamps = false;

    // 2. Asignación Masiva
    protected $fillable = [
        'id_usuario',       // Se debe pasar el ID del usuario recién creado
        'telefono',
        'metodo_pago_pref'
    ];

    // 3. Relaciones

    /**
     * Relación Inversa: Un Cliente "es" un Usuario.
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Un Cliente puede hacer muchas Reservas.
     */
    public function reservas()
    {
        return $this->hasMany(Reserva::class, 'id_cliente', 'id_usuario');
    }
}