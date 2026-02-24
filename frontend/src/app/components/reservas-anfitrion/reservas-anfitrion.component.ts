import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../services/reserva.service';
import { SidebarAnfitrionComponent } from '../sidebar-anfitrion/sidebar-anfitrion.component';
import { environment } from '../../../environments/enviroments';

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-reservas-anfitrion',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarAnfitrionComponent, DatePipe, CurrencyPipe, RouterLink],
    templateUrl: './reservas-anfitrion.component.html',
})
export class ReservasAnfitrionComponent implements OnInit {
    private reservaService = inject(ReservaService);
    private cdr = inject(ChangeDetectorRef);

    reservas: any[] = [];
    isLoading = true;
    errorMessage = '';
    updatingId: number | null = null;

    estadosDisponibles = ['Confirmada', 'En_Curso', 'Finalizada', 'Cancelada'];

    ngOnInit() {
        this.loadReservas();
    }

    loadReservas() {
        this.isLoading = true;
        this.errorMessage = '';

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
                this.errorMessage = '';
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                clearTimeout(timeoutId);
                console.error('Error cargando reservas:', err);
                this.errorMessage = err.error?.message || 'No se pudieron cargar las reservas.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onEstadoChange(reserva: any, nuevoEstado: string) {
        if (nuevoEstado === reserva.estado) return;

        const estadoAnterior = reserva.estado;
        this.updatingId = reserva.id_reserva;

        this.reservaService.updateEstadoAnfitrion(reserva.id_reserva, nuevoEstado).subscribe({
            next: () => {
                reserva.estado = nuevoEstado;
                this.updatingId = null;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error actualizando estado:', err);
                reserva.estado = estadoAnterior;
                this.updatingId = null;
                alert('Error al actualizar el estado: ' + (err.error?.message || 'Error desconocido'));
                this.cdr.detectChanges();
            }
        });
    }

    getEstadoLabel(estado: string): string {
        return estado.replace('_', ' ');
    }

    getEspacioImage(reserva: any): string {
        if (reserva.espacio?.fotos?.length > 0) {
            const principalPhoto = reserva.espacio.fotos.find((f: any) => f.es_principal == 1 || f.es_principal === true) || reserva.espacio.fotos[0];
            const url = principalPhoto.url_foto;

            if (url.startsWith('http')) return url;
            const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
            const cleanUrl = url.startsWith('/') ? url : `/${url}`;
            return `${baseUrl}${cleanUrl}`;
        }
        return 'assets/placeholder.jpg';
    }

    calculateDays(start: string, end: string): number {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }

    handleImageError(event: any) {
        event.target.src = 'assets/placeholder.jpg';
    }
}
