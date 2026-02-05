import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EspaciosService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) { }

  crearEspacio(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/espacios`, data);
  }

  getEspacios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/espacios`);
  }

  getEspaciosAnfitrion(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/anfitrion/espacios`);
  }

  deleteEspacio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/espacios/${id}`);
  }

  getEspacioById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/espacios/${id}`);
  }

  updateEspacio(id: string, data: any): Observable<any> {
    // Nota: Angular HttpClient usa JSON por defecto, pero si 'data' es FormData, maneja el Content-Type automáticamente.
    // Sin embargo, PUT vs POST en Laravel con Multipart es complicado. Creamos una ruta POST: /espacios/{id}
    return this.http.post(`${this.apiUrl}/espacios/${id}`, data);
  }
}