<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TestController extends Controller
{
    public function index() {
    return response()->json([
        'status' => 'Conectado',
        'base_de_datos' => config('database.connections.mysql.database'),
        'usuario' => 'admin'
    ]);
    }
}

