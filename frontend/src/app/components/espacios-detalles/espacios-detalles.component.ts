import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-espacios-detalles',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './espacios-detalles.component.html',
  styleUrl: './espacios-detalles.component.css',
})
export class EspaciosDetallesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  space: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Componente Detalles inicializado con ID:', id);
    if (id) {
      this.fetchSpaceDetails(id);
    } else {
      this.errorMessage = 'No se proporcionó un ID de espacio válido.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  fetchSpaceDetails(id: string) {
    this.isLoading = true;
    this.apiService.getEspacioById(id).subscribe({
      next: (data: any) => {
        console.log('Datos recibidos de API:', data);
        try {
          // Transform backend data to match template expectations
          this.space = {
            id: data.id_espacio,
            titulo: data.titulo,
            direccion: `${data.direccion}, ${data.ciudad}`,
            descripcion: data.descripcion,
            precio: data.precio_hora,
            puntuacion: data.rating_promedio || 'N/A',
            total_resenas: data.total_resenas || 0,
            imagenes: (data.fotos && data.fotos.length > 0)
              ? data.fotos.map((f: any) => this.getFullUrl(f.url_foto))
              : [
                'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
                'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=1200',
                'https://images.unsplash.com/photo-1497366752299-307744019df5?auto=format&fit=crop&q=80&w=1200',
                'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200'
              ],
            caracteristicas: data.servicios ? data.servicios.map((s: any) => ({
              nombre: s.nombre_servicio,
              icono: this.getIconForService(s.nombre_servicio)
            })) : []
          };

          this.isLoading = false;
          this.cdr.detectChanges();
          console.log('Datos procesados correctamente y cargando desactivado.');
        } catch (e) {
          console.error('Error transformando datos:', e);
          this.errorMessage = 'Error al procesar los datos del espacio.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching space details:', err);
        this.errorMessage = 'No se pudo cargar la información del espacio.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getFullUrl(path: string | null): string {
    if (!path) return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200';
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000${path}`;
  }

  private getIconForService(name: string): string {
    const icons: { [key: string]: string } = {
      'WiFi': '📶',
      'Café': '☕',
      'Impresora': '🖨️',
      'Salas de Reuniones': '🤝',
      'Estacionamiento': '🚗',
      'Aire Acondicionado': '❄️',
      'Pizarras': '📝',
      'Cocina': '🍳'
    };

    for (const key in icons) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return icons[key];
      }
    }
    return '✨';
  }
}
