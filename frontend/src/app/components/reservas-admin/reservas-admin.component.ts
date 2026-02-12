import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-reservas-admin',
    standalone: true,
    imports: [CommonModule, RouterLink, SidebarAdminComponent, ConfirmModalComponent],
    templateUrl: './reservas-admin.component.html',
    styleUrls: ['./reservas-admin.component.css'],
})
export class ReservasAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    reservas: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    deletingId: number | null = null;

    // Modal State
    showDeleteModal = false;
    itemToDeleteId: number | null = null;
    modalTitle = 'Eliminar Reserva';
    modalMessage = '¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.';

    ngOnInit() {
        this.loadReservas();
    }

    loadReservas() {
        this.isLoading = true;
        this.adminService.getAllReservations().subscribe({
            next: (data) => {
                console.log('ReservasAdmin: Data received', data);
                this.reservas = data;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('ReservasAdmin: Error loading reservations:', err);
                this.errorMessage = 'Error al cargar las reservas. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openDeleteModal(id: number) {
        this.itemToDeleteId = id;
        this.showDeleteModal = true;
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
        this.itemToDeleteId = null;
    }

    confirmDelete() {
        if (this.itemToDeleteId === null) return;

        const id = this.itemToDeleteId;
        this.deletingId = id;

        this.adminService.deleteReservation(id).subscribe({
            next: () => {
                this.reservas = this.reservas.filter(r => r.id !== id);
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error deleting reservation:', err);
                alert('Error al eliminar la reserva: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
