import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RegistroAnfitrionComponent } from './pages/registro-anfitrion/registro-anfitrion.component';
import { RegistroClienteComponent } from './pages/registro-cliente/registro-cliente.component';
import { CrearEspacioPageComponent } from './pages/crear-espacio-page/crear-espacio-page';
import { MisAreasPageComponent } from './pages/mis-areas-page/mis-areas-page';
import { LoginPageComponent } from './pages/login-page/login-page';
import { anfitrionGuard } from './guards/anfitrion.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'registro-anfitrion', component: RegistroAnfitrionComponent },
    { path: 'registro-cliente', component: RegistroClienteComponent },
    { path: 'explorar', loadComponent: () => import('./components/explorar/explorar').then(m => m.Explorar) },

    // Rutas de Anfitrión (Victor)
    {
        path: 'anfitrion/crear-espacio',
        component: CrearEspacioPageComponent,
        title: 'CoSpace - Añadir Nueva Área',
        canActivate: [anfitrionGuard]
    },
    {
        path: 'anfitrion/mis-areas',
        component: MisAreasPageComponent,
        title: 'CoSpace - Mis Áreas',
        canActivate: [anfitrionGuard]
    },
    {
        path: 'iniciar-sesion',
        component: LoginPageComponent,
        title: 'CoSpace - Iniciar Sesión'
    },
    { path: 'anfitrion/reservas', redirectTo: 'anfitrion/crear-espacio' },

    { path: '**', redirectTo: '' }
];
