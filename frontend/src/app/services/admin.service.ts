import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroments';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/admin`;

    getDashboardStats(): Observable<any> {
        console.log('AdminService: Requesting stats from', `${this.apiUrl}/dashboard`);
        return this.http.get<any>(`${this.apiUrl}/dashboard`);
    }

    getAllSpaces(): Observable<any> {
        console.log('AdminService: Requesting all spaces from', `${this.apiUrl}/espacios`);
        return this.http.get<any>(`${this.apiUrl}/espacios`);
    }

    deleteSpace(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/espacios/${id}`);
    }

    // Gestión de Usuarios
    getAllUsers(): Observable<any> {
        console.log('AdminService: Requesting all users from', `${this.apiUrl}/usuarios`);
        return this.http.get<any>(`${this.apiUrl}/usuarios`);
    }

    updateUser(id: number, data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/usuarios/${id}`, data);
    }

    deleteUser(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/usuarios/${id}`);
    }

    updateSpace(id: number, data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/espacios/${id}`, data);
    }

    // Gestión de Reservas
    getAllReservations(): Observable<any> {
        console.log('AdminService: Requesting all reservations from', `${this.apiUrl}/reservas`);
        return this.http.get<any>(`${this.apiUrl}/reservas`);
    }

    updateReservation(id: number, data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/reservas/${id}`, data);
    }

    deleteReservation(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/reservas/${id}`);
    }

    // Gestión de Reportes
    getAllReportes(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/reportes`);
    }

    updateReporteEstado(id: number, estado: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/reportes/${id}`, { estado });
    }

    deleteReporte(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/reportes/${id}`);
    }

    // Gestión de Pagos
    getAllPagos(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/pagos`);
    }

    deletePago(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/pagos/${id}`);
    }
}
