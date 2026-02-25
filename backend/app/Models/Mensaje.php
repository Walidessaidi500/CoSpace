<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mensaje extends Model
{
    use HasFactory;

    protected $table = 'mensajes';
    protected $primaryKey = 'id_mensaje';

    protected $fillable = [
        'id_conv',
        'id_emisor',
        'contenido',
        'leido',
    ];

    protected $casts = [
        'leido' => 'boolean',
    ];

    /**
     * Conversación a la que pertenece el mensaje.
     */
    public function conversacion()
    {
        return $this->belongsTo(Conversacion::class, 'id_conv', 'id_conv');
    }

    /**
     * Usuario que envió el mensaje.
     */
    public function emisor()
    {
        return $this->belongsTo(Usuario::class, 'id_emisor', 'id_usuario');
    }
}
