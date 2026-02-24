import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api';
import { ValoracionService } from '../../services/valoracion.service';
import { GoogleMapsModule } from '@angular/google-maps';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/enviroments';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-espacios-detalles',
  standalone: true,
  imports: [CommonModule, RouterModule, GoogleMapsModule, TranslateModule, FormsModule],
  templateUrl: './espacios-detalles.component.html',
  styleUrl: './espacios-detalles.component.css',
})
export class EspaciosDetallesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private valoracionService = inject(ValoracionService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);

  space: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  currentUserRole: string | null = null;

  // Google Maps Configuration
  mapOptions: google.maps.MapOptions = {
    center: { lat: 40, lng: -3 },
    zoom: 15,
    disableDefaultUI: false,
    zoomControl: true,
  };
  markerPosition: google.maps.LatLngLiteral = { lat: 40, lng: -3 };

  isReservedMode: boolean = false;

  // Valoraciones
  valoraciones: any[] = [];
  resumenValoraciones: any = { promedio: 0, total: 0, distribucion: {} };
  sortBy: string = 'reciente';
  filterPuntuacion: number | null = null;
  currentPage: number = 1;
  lastPage: number = 1;
  isLoadingValoraciones: boolean = false;

  // Formulario de valoración
  nuevaPuntuacion: number = 0;
  nuevoComentario: string = '';
  hoverPuntuacion: number = 0;
  isSubmitting: boolean = false;
  yaValorado: boolean = false;
  submitSuccess: string = '';
  submitError: string = '';

  // Reporte
  showReporteModal: boolean = false;
  reporteMotivo: string = '';
  reporteDescripcion: string = '';
  isSubmittingReporte: boolean = false;
  reporteSuccess: string = '';
  reporteError: string = '';
  motivosReporte = [
    { value: 'reserva_fraudulenta', label: 'Reserva fraudulenta' },
    { value: 'contenido_inapropiado', label: 'Contenido inapropiado' },
    { value: 'informacion_falsa', label: 'Información falsa o engañosa' },
    { value: 'espacio_inseguro', label: 'Espacio inseguro' },
    { value: 'incumplimiento_normas', label: 'Incumplimiento de normas' },
    { value: 'otro', label: 'Otro motivo' }
  ];

  ngOnInit() {
    this.currentUserRole = this.authService.getRole();

    this.route.queryParams.subscribe(params => {
      this.isReservedMode = params['mode'] === 'reserved';
    });

    const id = this.route.snapshot.paramMap.get('id');
    console.log('Componente Detalles inicializado con ID:', id);
    if (id) {
      this.fetchSpaceDetails(id);
      this.loadValoraciones(id);
    } else {
      this.errorMessage = 'No se proporcionó un ID de espacio válido.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  get isAnfitrion(): boolean {
    return this.currentUserRole === 'Anfitrion';
  }

  get isCliente(): boolean {
    return this.currentUserRole === 'Cliente';
  }

  get isAuthenticated(): boolean {
    return this.currentUserRole !== null && this.currentUserRole !== undefined;
  }

  fetchSpaceDetails(id: string) {
    this.isLoading = true;
    this.apiService.getEspacioById(id).subscribe({
      next: (data: any) => {
        console.log('Datos recibidos de API:', data);
        try {
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
              ? this.sortFotosPrincipalFirst(data.fotos).map((f: any) => this.getFullUrl(f.url_foto))
              : [],
            caracteristicas: data.servicios ? data.servicios.map((s: any) => ({
              nombre: s.nombre_servicio,
              icono: this.getIconForService(s.nombre_servicio)
            })) : []
          };

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

  // ========================
  // VALORACIONES
  // ========================

  loadValoraciones(espacioId?: string) {
    const id = espacioId || this.space?.id?.toString();
    if (!id) return;

    this.isLoadingValoraciones = true;
    this.valoracionService.getValoraciones(id, {
      sort: this.sortBy,
      puntuacion: this.filterPuntuacion || undefined,
      page: this.currentPage
    }).subscribe({
      next: (data: any) => {
        this.resumenValoraciones = data.resumen;
        this.valoraciones = data.valoraciones?.data || [];
        this.currentPage = data.valoraciones?.current_page || 1;
        this.lastPage = data.valoraciones?.last_page || 1;
        this.isLoadingValoraciones = false;

        // Verificar si el usuario actual ya ha valorado
        if (this.isCliente) {
          const currentUser = this.authService.getUser();
          if (currentUser) {
            // Verificar en la lista actual
            this.yaValorado = this.valoraciones.some(
              (v: any) => v.id_usuario === currentUser.id_usuario
            );
          }
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading valoraciones:', err);
        this.isLoadingValoraciones = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarOrden(sort: string) {
    this.sortBy = sort;
    this.currentPage = 1;
    this.loadValoraciones();
  }

  filtrarPorPuntuacion(puntuacion: number | null) {
    this.filterPuntuacion = this.filterPuntuacion === puntuacion ? null : puntuacion;
    this.currentPage = 1;
    this.loadValoraciones();
  }

  cambiarPagina(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.currentPage = page;
      this.loadValoraciones();
    }
  }

  setHoverPuntuacion(star: number) {
    this.hoverPuntuacion = star;
  }

  clearHoverPuntuacion() {
    this.hoverPuntuacion = 0;
  }

  setPuntuacion(star: number) {
    this.nuevaPuntuacion = star;
  }

  submitValoracion() {
    if (this.nuevaPuntuacion < 1 || this.nuevaPuntuacion > 5) {
      this.submitError = 'Selecciona una puntuación de 1 a 5 estrellas';
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    this.valoracionService.crearValoracion(this.space.id, {
      puntuacion: this.nuevaPuntuacion,
      comentario: this.nuevoComentario || undefined
    }).subscribe({
      next: (response: any) => {
        this.submitSuccess = '¡Reseña enviada correctamente!';
        this.yaValorado = true;
        this.nuevaPuntuacion = 0;
        this.nuevoComentario = '';
        this.isSubmitting = false;

        // Recargar valoraciones y actualizar el resumen
        this.loadValoraciones();

        // Actualizar el rating mostrado en el espacio
        if (this.resumenValoraciones) {
          this.space.puntuacion = this.resumenValoraciones.promedio;
          this.space.total_resenas = this.resumenValoraciones.total;
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error submitting valoracion:', err);
        this.submitError = err.error?.message || 'Error al enviar la reseña';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStarArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  formatFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInitial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

  getAutorFoto(valoracion: any): string | null {
    if (valoracion.autor?.foto_perfil) {
      const foto = valoracion.autor.foto_perfil;
      if (foto.startsWith('http')) return foto;
      return `http://127.0.0.1:8000${foto}`;
    }
    return null;
  }

  // ========================
  // EXISTING METHODS
  // ========================

  private getFullUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const cleanUrl = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanUrl}`;
  }

  private sortFotosPrincipalFirst(fotos: any[]): any[] {
    return [...fotos].sort((a, b) => {
      const aIsPrincipal = a.es_principal == 1 || a.es_principal === true;
      const bIsPrincipal = b.es_principal == 1 || b.es_principal === true;
      if (aIsPrincipal && !bIsPrincipal) return -1;
      if (!aIsPrincipal && bIsPrincipal) return 1;
      return 0;
    });
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

    let svgStr = '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>';

    for (const key in icons) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        svgStr = icons[key];
        break;
      }
    }
    return this.sanitizer.bypassSecurityTrustHtml(svgStr);
  }

  // Reporte Methods
  openReporteModal() {
    this.showReporteModal = true;
    this.reporteMotivo = '';
    this.reporteDescripcion = '';
    this.reporteSuccess = '';
    this.reporteError = '';
  }

  closeReporteModal() {
    this.showReporteModal = false;
  }

  submitReporte() {
    if (!this.reporteMotivo) {
      this.reporteError = 'Selecciona un motivo para el reporte';
      return;
    }

    this.isSubmittingReporte = true;
    this.reporteError = '';
    this.reporteSuccess = '';

    this.http.post(`${environment.apiUrl}/espacios/${this.space.id}/reportes`, {
      motivo: this.reporteMotivo,
      descripcion: this.reporteDescripcion || null
    }).subscribe({
      next: () => {
        this.reporteSuccess = '¡Reporte enviado correctamente! Lo revisaremos lo antes posible.';
        this.isSubmittingReporte = false;
        setTimeout(() => this.closeReporteModal(), 2500);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.reporteError = err.error?.message || 'Error al enviar el reporte';
        this.isSubmittingReporte = false;
        this.cdr.detectChanges();
      }
    });
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
