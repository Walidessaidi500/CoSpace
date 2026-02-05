import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { EspaciosService } from '../../services/espacios';

@Component({
    selector: 'app-lista-mis-areas',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './lista-mis-areas.component.html'
})
export class ListaMisAreasComponent implements OnInit {
    espacios: any[] = [];
    errorMessage: string = '';
    isLoading: boolean = true;
    backendUrl = 'http://127.0.0.1:8000'; // Url base para imágenes

    constructor(
        private espaciosService: EspaciosService,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone // Importar NgZone de nuevo
    ) { }

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.cargarEspacios();
        }
    }

    cargarEspacios() {
        console.log('Solicitando espacios a través del servicio...');
        this.isLoading = true;
        this.espaciosService.getEspaciosAnfitrion().subscribe({
            next: (data) => {
                this.ngZone.run(() => {
                    this.espacios = data;
                    this.isLoading = false;
                    console.log('Espacios cargados (HTTP):', this.espacios);
                    this.cdr.detectChanges();
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
                    console.error('Error HTTP:', err);
                    this.errorMessage = 'Error de conexión: ' + (err.message || err);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                });
            }
        });
    }

    // Helper para obtener la imagen principal o una por defecto
    getImagenPrincipal(espacio: any): string {
        if (espacio.fotos && espacio.fotos.length > 0) {
            // Buscamos la principal
            const principal = espacio.fotos.find((f: any) => f.es_principal);
            const relativeUrl = principal ? principal.url_foto : espacio.fotos[0].url_foto;

            if (relativeUrl.startsWith('http')) {
                return relativeUrl;
            }
            return this.backendUrl + relativeUrl;
        }
        // Imagen por defecto si no hay fotos (placeholder)
        return 'https://via.placeholder.com/400x300?text=No+Image';
    }

    borrarEspacio(id: number) {
        if (confirm('¿Estás seguro de que quieres eliminar este espacio?')) {
            this.espaciosService.deleteEspacio(id).subscribe({
                next: () => {
                    // Actualizar la lista localmente
                    this.espacios = this.espacios.filter(e => e.id_espacio !== id);
                    alert('Espacio eliminado correctamente');
                },
                error: (err) => {
                    console.error('Error al borrar:', err);
                    alert('Ocurrió un error al intentar borrar el espacio.');
                }
            });
        }
    }

    onCardClick(id: number) {
        console.log('Card clicked, navigating to space:', id);
        if (id) {
            this.router.navigate(['/espacios', id]);
        }
    }
}
