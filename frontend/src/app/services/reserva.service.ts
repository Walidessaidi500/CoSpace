import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroments';

@Injectable({
    providedIn: 'root'
})
export class ReservaService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('auth_token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    initiatePayment(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/create-payment-intent`, data, { headers: this.getHeaders() });
    }

    crearReserva(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/reservas`, data, { headers: this.getHeaders() });
    }

    getUserReservations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/reservas/usuario`, { headers: this.getHeaders() });
    }

    getHostReservations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/anfitrion/reservas-recibidas`, { headers: this.getHeaders() });
    }
}
