import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/enviroments';

interface Reserva {
    id_reserva: number;
    id_cliente: number;
    id_espacio: number;
    fecha_inicio: string;
    fecha_fin: string;
    monto_total: number;
    estado: string;
    espacio: {
        id_espacio: number;
        titulo: string;
        ciudad: string;
        direccion: string;
        precio_hora: number;
        fotos?: { url_foto: string }[];
    };
}

@Component({
    selector: 'app-panel-cliente',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './panel-cliente.component.html',
})
export class PanelClienteComponent implements OnInit {
    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);

    activeTab: 'active' | 'past' = 'active';
    reservations: Reserva[] = [];
    filteredReservations: Reserva[] = [];
    isLoading = true;
    errorMessage = '';

    ngOnInit() {
        this.loadReservations();
    }

    loadReservations() {
        this.isLoading = true;
        this.errorMessage = '';

        const token = localStorage.getItem('auth_token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.get<Reserva[]>(`${environment.apiUrl}/cliente/mis-reservas`, { headers })
            .subscribe({
                next: (data) => {
                    this.reservations = data;
                    this.filterReservations();
                    this.isLoading = false;
                    this.cdr.detectChanges(); // Force update
                },
                error: (err) => {
                    console.error('Error loading reservations:', err);
                    this.errorMessage = 'Error al cargar las reservas';
                    this.isLoading = false;
                    this.cdr.detectChanges(); // Force update
                }
            });
    }

    setTab(tab: 'active' | 'past') {
        this.activeTab = tab;
        this.filterReservations();
    }

    filterReservations() {
        const now = new Date();

        if (this.activeTab === 'active') {
            // Active: future reservations that are not cancelled
            this.filteredReservations = this.reservations.filter(r =>
                new Date(r.fecha_fin) >= now && r.estado !== 'Cancelada'
            );
        } else {
            // Past: past reservations or cancelled ones
            this.filteredReservations = this.reservations.filter(r =>
                new Date(r.fecha_fin) < now || r.estado === 'Cancelada'
            );
        }
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    calculateDays(start: string, end: string): number {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1; // Minimum 1 day
    }

    cancelReservation(reserva: Reserva) {
        if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
            return;
        }

        const token = localStorage.getItem('auth_token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.post(`${environment.apiUrl}/reservas/${reserva.id_reserva}/cancelar`, {}, { headers })
            .subscribe({
                next: () => {
                    // Update local state
                    reserva.estado = 'Cancelada';
                    this.filterReservations();
                },
                error: (err) => {
                    console.error('Error cancelling reservation:', err);
                    alert('Error al cancelar la reserva');
                }
            });
    }

    getSpaceImage(reserva: Reserva): string {
        if (reserva.espacio?.fotos && reserva.espacio.fotos.length > 0) {
            // Find principal photo or fallback to first one
            // Note: es_principal might be 1/0 or true/false depending on backend serialization
            const principalPhoto = reserva.espacio.fotos.find((f: any) => f.es_principal) || reserva.espacio.fotos[0];
            const url = principalPhoto.url_foto;

            const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
            const cleanUrl = url.startsWith('/') ? url : `/${url}`;
            return `${baseUrl}${cleanUrl}`;
        }
        return 'assets/placeholder.jpg';
    }

    handleImageError(event: any) {
        event.target.src = 'assets/placeholder.jpg';
    }
}
