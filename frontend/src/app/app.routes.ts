import { Routes } from '@angular/router';
// Importa el componente directamente (sin .ts)
import { CrearEspacioPageComponent } from './pages/crear-espacio-page/crear-espacio-page';
import { MisAreasPageComponent } from './pages/mis-areas-page/mis-areas-page';

export const routes: Routes = [
    // Redirección inicial para que no veas la pantalla en blanco al entrar a la raíz
    { path: '', redirectTo: 'anfitrion/crear-espacio', pathMatch: 'full' },

    // Ruta de la pantalla que hemos creado
    {
        path: 'anfitrion/crear-espacio',
        component: CrearEspacioPageComponent,
        title: 'CoSpace - Añadir Nueva Área'
    },

    // Ruta de Mis Áreas
    {
        path: 'anfitrion/mis-areas',
        component: MisAreasPageComponent,
        title: 'CoSpace - Mis Áreas'
    },
    { path: 'anfitrion/reservas', redirectTo: 'anfitrion/crear-espacio' }
];