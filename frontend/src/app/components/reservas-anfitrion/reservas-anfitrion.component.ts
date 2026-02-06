import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReservaService } from '../../services/reserva.service';
import { SidebarAnfitrionComponent } from '../sidebar-anfitrion/sidebar-anfitrion.component';
import { environment } from '../../../environments/enviroments';

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-reservas-anfitrion',
    standalone: true,
    imports: [CommonModule, SidebarAnfitrionComponent, DatePipe, CurrencyPipe, RouterLink],
    templateUrl: './reservas-anfitrion.component.html',
})
export class ReservasAnfitrionComponent implements OnInit {
    private reservaService = inject(ReservaService);
    private cdr = inject(ChangeDetectorRef);

    reservas: any[] = [];
    isLoading = true;
    errorMessage = '';

    ngOnInit() {
        this.loadReservas();
    }

    loadReservas() {
        this.isLoading = true;
        this.errorMessage = '';

        // Add timeout of 10 seconds
        const timeoutId = setTimeout(() => {
            if (this.isLoading) {
                this.isLoading = false;
                this.errorMessage = 'Tiempo de espera agotado. Por favor, recarga la página.';
                this.cdr.detectChanges();
            }
        }, 10000);

        this.reservaService.getHostReservations().subscribe({
            next: (data) => {
                clearTimeout(timeoutId);
                console.log('Reservas recibidas (Raw):', data);
                this.reservas = data;
                this.errorMessage = ''; // Clear any potential timeout error
                this.isLoading = false;
                this.cdr.detectChanges(); // Force update
            },
            error: (err) => {
                clearTimeout(timeoutId);
                console.error('Error cargando reservas:', err);
                this.errorMessage = err.error?.message || 'No se pudieron cargar las reservas.';
                this.isLoading = false;
                this.cdr.detectChanges(); // Force update
            }
        });
    }

    getEspacioImage(reserva: any): string {
        if (reserva.espacio?.fotos?.length > 0) {
            // Find principal photo or fallback to first one
            const principalPhoto = reserva.espacio.fotos.find((f: any) => f.es_principal) || reserva.espacio.fotos[0];
            const url = principalPhoto.url_foto;

            const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
            // Ensure url starts with /
            const cleanUrl = url.startsWith('/') ? url : `/${url}`;
            return `${baseUrl}${cleanUrl}`;
        }
        return 'assets/placeholder.jpg'; // O una imagen por defecto
    }

    calculateDays(start: string, end: string): number {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1; // Minimum 1 day
    }

    handleImageError(event: any) {
        event.target.src = 'assets/placeholder.jpg';
    }
}

