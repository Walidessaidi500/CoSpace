import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RegistroAnfitrionComponent } from './components/registro-anfitrion/registro-anfitrion.component';
import { RegistroClienteComponent } from './components/registro-cliente/registro-cliente.component';
import { CrearEspacioComponent } from './components/crear-espacio/crear-espacio.component';
import { MisAreasComponent } from './components/mis-areas/mis-areas.component';
import { LoginComponent } from './components/login/login.component';
import { EspaciosDetallesComponent } from './components/espacios-detalles/espacios-detalles.component';
import { anfitrionGuard } from './guards/anfitrion.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'registro-anfitrion', component: RegistroAnfitrionComponent },
    { path: 'registro-cliente', component: RegistroClienteComponent },
    { path: 'explorar', loadComponent: () => import('./components/explorar/explorar.component').then(m => m.ExplorarComponent) },
    { path: 'espacios/:id', component: EspaciosDetallesComponent },

    // Rutas de Anfitrión (Victor)
    {
        path: 'anfitrion/crear-espacio',
        component: CrearEspacioComponent,
        title: 'CoSpace - Añadir Nueva Área',
        canActivate: [anfitrionGuard]
    },
    {
        path: 'anfitrion/editar-espacio/:id',
        component: CrearEspacioComponent,
        title: 'CoSpace - Editar Área',
        canActivate: [anfitrionGuard]
    },
    {
        path: 'anfitrion/mis-areas',
        component: MisAreasComponent,
        title: 'CoSpace - Mis Áreas',
        canActivate: [anfitrionGuard]
    },
    {
        path: 'iniciar-sesion',
        component: LoginComponent,
        title: 'CoSpace - Iniciar Sesión'
    },
    { path: 'anfitrion/reservas', redirectTo: 'anfitrion/crear-espacio' },

    { path: '**', redirectTo: '' }
];
