import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from './services/api';
import { ThemeService } from './services/theme.service';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ToastContainerComponent } from './components/shared/toast-container/toast-container.component';
import { LanguageService } from './services/language.service';
import { ToastService } from './services/toast.service';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastContainerComponent, ChatWidgetComponent],
  templateUrl: './app.html',
  styleUrls: []
})
export class AppComponent implements OnInit {

  private api = inject(ApiService);
  private themeService = inject(ThemeService);
  private languageService = inject(LanguageService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    // Sobrescribir el método alert() nativo para que todos los alerts antiguos usen el nuevo Toast popup.
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      const lowerMsg = (message || '').toLowerCase();
      if (lowerMsg.includes('error') || lowerMsg.includes('falló') || lowerMsg.includes('incorrecto') || lowerMsg.includes('invalid')) {
        this.toastService.error(message);
      } else if (lowerMsg.includes('éxito') || lowerMsg.includes('exitoso') || lowerMsg.includes('correctamente') || lowerMsg.includes('confirmada')) {
        this.toastService.success(message);
      } else {
        this.toastService.info(message);
      }
    };

    this.api.testConexion().subscribe({
      next: (res) => console.log('Backend conectado:', res),
      error: (err) => console.error('Error de conexión:', err)
    });
  }
}