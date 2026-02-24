import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RegistroAnfitrionComponent } from './components/registro-anfitrion/registro-anfitrion.component';
import { RegistroClienteComponent } from './components/registro-cliente/registro-cliente.component';
import { CrearEspacioComponent } from './components/crear-espacio/crear-espacio.component';
import { MisAreasComponent } from './components/mis-areas/mis-areas.component';
import { LoginComponent } from './components/login/login.component';
import { EspaciosDetallesComponent } from './components/espacios-detalles/espacios-detalles.component';
import { ReservaComponent } from './components/reserva/reserva';
import { anfitrionGuard } from './guards/anfitrion.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'registro-anfitrion', component: RegistroAnfitrionComponent },
    { path: 'registro-cliente', component: RegistroClienteComponent },
    { path: 'explorar', loadComponent: () => import('./components/explorar/explorar.component').then(m => m.ExplorarComponent) },
    { path: 'espacios/:id', component: EspaciosDetallesComponent },
    { path: 'reserva/:id', component: ReservaComponent },

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
    {
        path: 'cliente/panel',
        loadComponent: () => import('./components/panel-cliente/panel-cliente.component').then(m => m.PanelClienteComponent),
        title: 'CoSpace - Mi Panel'
    },
    {
        path: 'configuracion',
        loadComponent: () => import('./components/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
        title: 'CoSpace - Configuración'
    },
    {
        path: 'anfitrion/reservas',
        loadComponent: () => import('./components/reservas-anfitrion/reservas-anfitrion.component').then(m => m.ReservasAnfitrionComponent),
        title: 'CoSpace - Reservas Recibidas',
        canActivate: [anfitrionGuard]
    },

    // Rutas de Administrador
    {
        path: 'admin/panel',
        loadComponent: () => import('./components/panel-admin/panel-admin.component').then(m => m.PanelAdminComponent),
        title: 'CoSpace - Admin Dashboard'
    },
    {
        path: 'admin/espacios',
        loadComponent: () => import('./components/espacios-admin/espacios-admin.component').then(m => m.EspaciosAdminComponent),
        title: 'CoSpace - Gestión de Espacios'
    },
    {
        path: 'admin/editar-espacio/:id',
        loadComponent: () => import('./components/espacio-admin-edit/espacio-admin-edit.component').then(m => m.EspacioAdminEditComponent),
        title: 'CoSpace - Editar Espacio (Admin)'
    },
    {
        path: 'admin/usuarios',
        loadComponent: () => import('./components/usuarios-admin/usuarios-admin.component').then(m => m.UsuariosAdminComponent),
        title: 'CoSpace - Gestión de Usuarios'
    },
    {
        path: 'admin/editar-usuario/:id',
        loadComponent: () => import('./components/usuario-admin-edit/usuario-admin-edit.component').then(m => m.UsuarioAdminEditComponent),
        title: 'CoSpace - Editar Usuario (Admin)'
    },
    {
        path: 'admin/reservas',
        loadComponent: () => import('./components/reservas-admin/reservas-admin.component').then(m => m.ReservasAdminComponent),
        title: 'CoSpace - Gestión de Reservas'
    },
    {
        path: 'admin/editar-reserva/:id',
        loadComponent: () => import('./components/reserva-admin-edit/reserva-admin-edit.component').then(m => m.ReservaAdminEditComponent),
        title: 'CoSpace - Editar Reserva (Admin)'
    },
    {
        path: 'admin/reportes',
        loadComponent: () => import('./components/reportes-admin/reportes-admin.component').then(m => m.ReportesAdminComponent),
        title: 'CoSpace - Gestión de Reportes'
    },
    {
        path: 'admin/pagos',
        loadComponent: () => import('./components/pagos-admin/pagos-admin.component').then(m => m.PagosAdminComponent),
        title: 'CoSpace - Gestión de Pagos'
    },

    // Auth
    {
        path: 'verify-2fa',
        loadComponent: () => import('./components/verify-2fa/verify-2fa.component').then(m => m.Verify2faComponent),
        title: 'CoSpace - Verificación 2FA'
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'CoSpace - Recuperar Contraseña'
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: 'CoSpace - Resetear Contraseña'
    },
    { path: '**', redirectTo: '' }
];
