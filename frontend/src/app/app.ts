import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from './services/api';
import { ThemeService } from './services/theme.service';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrls: []
})
export class AppComponent implements OnInit {

  private api = inject(ApiService);
  private themeService = inject(ThemeService);
  private languageService = inject(LanguageService);

  ngOnInit(): void {
    this.api.testConexion().subscribe({
      next: (res) => console.log('Backend conectado:', res),
      error: (err) => console.error('Error de conexión:', err)
    });
  }
}