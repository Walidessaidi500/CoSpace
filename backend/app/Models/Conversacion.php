<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversacion extends Model
{
    use HasFactory;

    protected $table = 'conversaciones';
    protected $primaryKey = 'id_conv';

    protected $fillable = [
        'id_usuario_1',
        'id_usuario_2',
    ];

    /**
     * Primer usuario de la conversación (normalmente el cliente).
     */
    public function usuario1()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario_1', 'id_usuario');
    }

    /**
     * Segundo usuario de la conversación (normalmente el anfitrión).
     */
    public function usuario2()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario_2', 'id_usuario');
    }

    /**
     * Mensajes de la conversación.
     */
    public function mensajes()
    {
        return $this->hasMany(Mensaje::class, 'id_conv', 'id_conv')->orderBy('created_at', 'asc');
    }

    /**
     * Último mensaje de la conversación.
     */
    public function ultimoMensaje()
    {
        return $this->hasOne(Mensaje::class, 'id_conv', 'id_conv')->latest();
    }

    /**
     * Obtener el "otro" usuario en la conversación.
     */
    public function getOtroUsuario($miId)
    {
        if ($this->id_usuario_1 == $miId) {
            return $this->usuario2;
        }
        return $this->usuario1;
    }

    /**
     * Contar mensajes no leídos para un usuario.
     */
    public function mensajesNoLeidos($userId)
    {
        return $this->mensajes()
            ->where('id_emisor', '!=', $userId)
            ->where('leido', false)
            ->count();
    }
}
