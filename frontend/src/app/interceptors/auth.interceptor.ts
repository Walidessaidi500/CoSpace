import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    // Check if we are in a browser environment before accessing localStorage
    const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    const token = isBrowser ? localStorage.getItem('token') : null;

    let request = req;

    if (token) {
        request = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Token inválido o expirado
                if (isBrowser) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('role');
                }
                router.navigate(['/iniciar-sesion']);
            }
            return throwError(() => error);
        })
    );
};

