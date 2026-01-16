<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // 1. Crear Servicios (Amenidades)
        $servicios = [
            ['id_servicio' => 1, 'nombre_servicio' => 'WiFi de Alta Velocidad'],
            ['id_servicio' => 2, 'nombre_servicio' => 'Café y Té Gratis'],
            ['id_servicio' => 3, 'nombre_servicio' => 'Impresora'],
            ['id_servicio' => 4, 'nombre_servicio' => 'Salas de Reuniones'],
            ['id_servicio' => 5, 'nombre_servicio' => 'Estacionamiento'],
            ['id_servicio' => 6, 'nombre_servicio' => 'Aire Acondicionado'],
            ['id_servicio' => 7, 'nombre_servicio' => 'Pizarras'],
            ['id_servicio' => 8, 'nombre_servicio' => 'Cocina'],
        ];

        foreach ($servicios as $servicio) {
            \App\Models\Servicio::firstOrCreate(
                ['id_servicio' => $servicio['id_servicio']], 
                $servicio
            );
        }

        // 2. Crear Usuario Anfitrión de Prueba (si no existe)
        $user = User::firstOrCreate(
            ['email' => 'anfitrion@cospace.com'],
            [
                'nombre_completo' => 'María García',
                'password'        => \Illuminate\Support\Facades\Hash::make('password123'),
                'tipo_usuario'    => 'Anfitrion',
                'estado_cuenta'   => 'Activo'
            ]
        );

        // 3. Crear Registro en tabla anfitriones
        \App\Models\Anfitrion::firstOrCreate(
            ['id_usuario' => $user->id_usuario],
            [
                'biografia' => 'Amante del coworking y la tecnología',
                'es_verificado' => true
            ]
        );
    }
}
