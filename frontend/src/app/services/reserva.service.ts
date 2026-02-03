import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ReservaService {
    private apiUrl = 'http://127.0.0.1:8000/api';

    constructor(private http: HttpClient) { }

    initiatePayment(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/create-payment-intent`, data);
    }

    crearReserva(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/reservas`, data);
    }
}
