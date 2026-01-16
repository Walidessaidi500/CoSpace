import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EspaciosService } from '../../services/espacios';

@Component({
    selector: 'app-lista-mis-areas',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lista-mis-areas.html'
})
export class ListaMisAreasComponent implements OnInit {
    espacios: any[] = [];
    backendUrl = 'http://localhost:8000'; // Base url for images

    constructor(private espaciosService: EspaciosService) { }

    ngOnInit() {
        this.espaciosService.getEspacios().subscribe({
            next: (data) => {
                this.espacios = data;
                console.log('Espacios cargados:', this.espacios);
            },
            error: (err) => {
                console.error('Error cargando espacios:', err);
            }
        });
    }

    // Helper para obtener la imagen principal o una por defecto
    getImagenPrincipal(espacio: any): string {
        if (espacio.fotos && espacio.fotos.length > 0) {
            // Buscamos la principal
            const principal = espacio.fotos.find((f: any) => f.es_principal);
            if (principal) return this.backendUrl + principal.url_foto;
            // Si no, la primera
            return this.backendUrl + espacio.fotos[0].url_foto;
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
}
