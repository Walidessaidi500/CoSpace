import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private http = inject(HttpClient);

  testConexion() {
    return this.http.get(`${environment.apiUrl}/test-conexion`);
  }

  register(data: any) {
    return this.http.post(`${environment.apiUrl}/register`, data);
  }

  login(data: any) {
    return this.http.post(`${environment.apiUrl}/login`, data);
  }
}
