import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';
import { GoogleMapsModule } from '@angular/google-maps';
import { AuthService } from '../../services/auth.service';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-espacios-detalles',
  standalone: true,
  imports: [CommonModule, RouterModule, GoogleMapsModule, TranslateModule],
  templateUrl: './espacios-detalles.component.html',
  styleUrl: './espacios-detalles.component.css',
})
export class EspaciosDetallesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  space: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  currentUserRole: string | null = null;

  // Google Maps Configuration
  mapOptions: google.maps.MapOptions = {
    center: { lat: 40, lng: -3 }, // Default center (e.g. Spain usually)
    zoom: 15,
    disableDefaultUI: false,
    zoomControl: true,
  };
  markerPosition: google.maps.LatLngLiteral = { lat: 40, lng: -3 };

  isReservedMode: boolean = false;

  ngOnInit() {
    this.currentUserRole = this.authService.getRole();

    // Check for query params
    this.route.queryParams.subscribe(params => {
      this.isReservedMode = params['mode'] === 'reserved';
    });

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

  get isAnfitrion(): boolean {
    return this.currentUserRole === 'Anfitrion';
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
            latitud: data.latitud,
            longitud: data.longitud,
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

          // Configure Map if coordinates exist
          if (data.latitud && data.longitud) {
            const lat = parseFloat(data.latitud);
            const lng = parseFloat(data.longitud);
            this.mapOptions = {
              ...this.mapOptions,
              center: { lat, lng }
            };
            this.markerPosition = { lat, lng };
          }

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

  private getIconForService(name: string): SafeHtml {
    const icons: { [key: string]: string } = {
      'WiFi': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>',
      'Café': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>',
      'Impresora': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',
      'Salas de Reuniones': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      'Estacionamiento': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
      'Aire Acondicionado': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>',
      'Pizarras': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
      'Cocina': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3"></path></svg>'
    };

    let svgStr = '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>'; // default star

    for (const key in icons) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        svgStr = icons[key];
        break;
      }
    }
    return this.sanitizer.bypassSecurityTrustHtml(svgStr);
  }

  // Modal Logic
  isModalOpen: boolean = false;
  selectedImage: string = '';

  openModal(imageUrl: string) {
    if (imageUrl) {
      this.selectedImage = imageUrl;
      this.isModalOpen = true;
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedImage = '';
  }
}
