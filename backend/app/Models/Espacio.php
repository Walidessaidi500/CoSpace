<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Espacio extends Model
{
    use HasFactory;

    protected $table = 'espacios';
    protected $primaryKey = 'id_espacio';

    protected $fillable = [
        'id_anfitrion',
        'titulo',
        'direccion',
        'descripcion',
        'capacidad',
        'precio_hora',
        'rating_promedio',
        'total_resenas',
        'latitud',
        'longitud',
        'estado'
    ];
}
