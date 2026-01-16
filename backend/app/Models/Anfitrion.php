<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Anfitrion extends Model
{
    use HasFactory;

    // Nombre de la tabla
    protected $table = 'anfitriones';

    // Clave primaria personalizada (es la misma que id_usuario en la tabla Users)
    protected $primaryKey = 'id_usuario';

    // IMPORTANTE: Como el ID no es autoincremental (viene heredado de User),
    // debemos establecer esto en false o Laravel intentará castearlo incorrectamente.
    public $incrementing = false;

    // Tipo de la clave primaria
    protected $keyType = 'int';

    // Desactivamos timestamps si tu tabla anfitriones no tiene created_at/updated_at
    // (Generalmente estas fechas se controlan en la tabla padre 'usuarios')
    public $timestamps = false;

    protected $fillable = [
        'id_usuario',
        'biografia',
        'es_verificado',
        'cantidad_espacios'
    ];

    /**
     * Relación Inversa: Un Anfitrión "es" un Usuario.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Un Anfitrión tiene muchos Espacios publicados.
     */
    public function espacios()
    {
        return $this->hasMany(Espacio::class, 'id_anfitrion', 'id_usuario');
    }
}
