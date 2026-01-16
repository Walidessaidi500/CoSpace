import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EspaciosService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  crearEspacio(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/espacios`, data);
  }

  getEspacios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/espacios`);
  }

  deleteEspacio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/espacios/${id}`);
  }
}