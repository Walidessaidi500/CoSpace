import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/enviroments';

@Component({
  selector: 'app-espacio-card',
  standalone: true,
  imports: [RouterModule, TranslateModule],
  templateUrl: './espacio-card.component.html',
  styleUrl: './espacio-card.component.css',
})
export class EspacioCardComponent {
  @Input() espacio: any;

  getImagenPrincipal(): string {
    if (this.espacio?.fotos && this.espacio.fotos.length > 0) {
      // Find the principal photo, or fallback to the first one
      const principal = this.espacio.fotos.find((f: any) => f.es_principal == 1 || f.es_principal === true);
      const foto = principal || this.espacio.fotos[0];
      const url = foto.url_foto;

      if (url.startsWith('http')) return url;
      const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
      const cleanUrl = url.startsWith('/') ? url : `/${url}`;
      return `${baseUrl}${cleanUrl}`;
    }
    return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';
  }
}
