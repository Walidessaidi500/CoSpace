import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Check if we are in a browser environment before accessing localStorage
    const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    const token = isBrowser ? localStorage.getItem('token') : null;

    if (token) {
        const clonedReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedReq);
    }

    return next(req);
};

