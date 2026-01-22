<?php

namespace App\Http\Controllers;

use App\Models\Espacio;
use Illuminate\Http\Request;

class EspacioController extends Controller
{
    public function index()
    {
        $espacios = Espacio::all();
        return response()->json($espacios);
    }
}
