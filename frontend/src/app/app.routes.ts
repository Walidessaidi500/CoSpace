import { Routes } from '@angular/router';
// Importa el componente directamente (sin .ts)
import { CrearEspacioPageComponent } from './pages/crear-espacio-page/crear-espacio-page';
import { MisAreasPageComponent } from './pages/mis-areas-page/mis-areas-page';
import { LoginPageComponent } from './pages/login-page/login-page';
import { anfitrionGuard } from './guards/anfitrion.guard';

export const routes: Routes = [
    // Redirección inicial para que no veas la pantalla en blanco al entrar a la raíz
    { path: '', redirectTo: 'iniciar-sesion', pathMatch: 'full' },

    // Ruta de la pantalla que hemos creado
    {
        path: 'anfitrion/crear-espacio',
        component: CrearEspacioPageComponent,
        title: 'CoSpace - Añadir Nueva Área',
        canActivate: [anfitrionGuard]
    },

    // Ruta de Mis Áreas
    {
        path: 'anfitrion/mis-areas',
        component: MisAreasPageComponent,
        title: 'CoSpace - Mis Áreas',
        canActivate: [anfitrionGuard]
    },
    // Ruta de Login
    {
        path: 'iniciar-sesion',
        component: LoginPageComponent,
        title: 'CoSpace - Iniciar Sesión'
    },
    { path: 'anfitrion/reservas', redirectTo: 'anfitrion/crear-espacio' }
];