import { Component, inject, OnInit } from '@angular/core'; // 1. Importar OnInit
import { ApiService } from './services/api'; // Sugerencia: nombres más descriptivos

@Component({
  selector: 'app-root',
  standalone: true, // Asegúrate de esto si usas Angular moderno (v14+)
  template: `<h1>Cospace</h1>`
})
export class AppComponent implements OnInit { // 2. Implementar la interfaz

  private api = inject(ApiService);

  ngOnInit(): void {
    this.api.testConexion().subscribe({
      next: (res) => console.log('Backend conectado:', res),
      error: (err) => console.error('Error de conexión:', err)
    });
  }
}