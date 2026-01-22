import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const anfitrionGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getUser();
    const role = authService.getRole();

    // Verificamos si hay usuario y si el rol es Anfitrion
    if (user && role === 'Anfitrion') {
        return true;
    }

    // Si es Cliente, Admin o no hay sesión, redirigir al login
    return router.parseUrl('/iniciar-sesion');
};
