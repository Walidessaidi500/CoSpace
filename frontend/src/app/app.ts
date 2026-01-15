import { Component, inject, OnInit } from '@angular/core'; // 1. Importar OnInit
import { ApiService } from './services/api'; // Sugerencia: nombres más descriptivos
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true, // Asegúrate de esto si usas Angular moderno (v14+)
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
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