
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/enviroments';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private apiUrl = environment.apiUrl;

    private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
    currentUser$ = this.currentUserSubject.asObservable();

    constructor() { }

    private getUserFromStorage() {
        if (typeof localStorage !== 'undefined') {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        }
        return null;
    }

    login(credentials: { email: string, password: string }) {
        return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                if (response.status === 'success') {
                    localStorage.setItem('token', response.data.access_token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    localStorage.setItem('role', response.data.role);
                    this.currentUserSubject.next(response.data.user);
                }
            })
        );
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        this.currentUserSubject.next(null);
        this.router.navigate(['/iniciar-sesion']);
    }

    getRole() {
        return localStorage.getItem('role');
    }

    getUser() {
        return this.currentUserSubject.value;
    }
    updateProfile(formData: FormData) {
        return this.http.post<any>(`${this.apiUrl}/update-profile`, formData).pipe(
            tap(response => {
                if (response.status === 'success' && response.user) {
                    // Actualizar almacenamiento local y subject
                    const currentUser = this.getUser();
                    // Fucionar campos con cuidado o reemplazar. El backend devuelve 'user' (Modelo Usuario)
                    // Si tenemos campos extra locales como 'role' o token, preservarlos.
                    const updatedUser = { ...currentUser, ...response.user };

                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    this.currentUserSubject.next(updatedUser);
                }
            })
        );
    }

    verify2FA(email: string, code: string) {
        return this.http.post<any>(`${this.apiUrl}/verify-2fa`, { email, code }).pipe(
            tap(response => {
                if (response.status === 'success') {
                    this.setSession(response.data);
                }
            })
        );
    }

    forgotPassword(email: string) {
        return this.http.post(`${this.apiUrl}/forgot-password`, { email });
    }

    resetPassword(email: string, code: string, password: string, password_confirmation: string) {
        return this.http.post(`${this.apiUrl}/reset-password`, { email, code, password, password_confirmation });
    }

    update2FASettings(enabled: boolean) {
        return this.http.post<any>(`${this.apiUrl}/update-2fa-settings`, { enabled }).pipe(
            tap(response => {
                // Actualizar local user info si es necesario
                const currentUser = this.getUser();
                currentUser.two_factor_enabled = response.enabled ? 1 : 0; // Laravel devuelve boolean como 1/0 a veces o true/false
                localStorage.setItem('user', JSON.stringify(currentUser));
                this.currentUserSubject.next(currentUser);
            })
        );
    }

    changePassword(data: any) {
        return this.http.post<any>(`${this.apiUrl}/change-password`, data);
    }

    private setSession(data: any) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', data.role);
        this.currentUserSubject.next(data.user);
    }
}
