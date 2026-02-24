import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class ValoracionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getValoraciones(espacioId: string | number, params?: { sort?: string; puntuacion?: number; page?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params?.puntuacion) {
      httpParams = httpParams.set('puntuacion', params.puntuacion.toString());
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/espacios/${espacioId}/valoraciones`, { params: httpParams });
  }

  crearValoracion(espacioId: string | number, data: { puntuacion: number; comentario?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/espacios/${espacioId}/valoraciones`, data);
  }
}
