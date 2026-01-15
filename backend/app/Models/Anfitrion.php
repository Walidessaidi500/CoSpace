<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Anfitrion extends Model
{
    use HasFactory;

    protected $table = 'anfitriones';
    protected $primaryKey = 'id_usuario';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id_usuario',
        'biografia',
        'es_verificado',
        'cantidad_espacios'
    ];
}
