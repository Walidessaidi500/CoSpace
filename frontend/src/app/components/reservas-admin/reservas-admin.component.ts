import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-reservas-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SidebarAdminComponent, ConfirmModalComponent],
    templateUrl: './reservas-admin.component.html',
    styleUrls: ['./reservas-admin.component.css'],
})
export class ReservasAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    allReservas: any[] = [];
    reservas: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    deletingId: number | null = null;
    updatingId: number | null = null;

    // Filtros
    searchTerm = '';
    filterEstado = '';

    estadosDisponibles = ['Pendiente', 'Confirmada', 'En_Curso', 'Finalizada', 'Cancelada'];

    // Modal State
    showDeleteModal = false;
    itemToDeleteId: number | null = null;
    modalTitle = 'Eliminar Reserva';
    modalMessage = '¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.';

    ngOnInit() { this.loadReservas(); }

    loadReservas() {
        this.isLoading = true;
        this.adminService.getAllReservations().subscribe({
            next: (data) => {
                this.allReservas = data;
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.errorMessage = 'Error al cargar las reservas. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    applyFilters() {
        const term = this.searchTerm.toLowerCase().trim();
        this.reservas = this.allReservas.filter(r => {
            const matchSearch = !term ||
                r.cliente?.toLowerCase().includes(term) ||
                r.espacio?.toLowerCase().includes(term);
            const matchEstado = !this.filterEstado || r.estado === this.filterEstado;
            return matchSearch && matchEstado;
        });
    }

    onSearchChange() { this.applyFilters(); }
    onFilterChange() { this.applyFilters(); }

    clearFilters() {
        this.searchTerm = '';
        this.filterEstado = '';
        this.applyFilters();
    }

    get totalFiltrados() { return this.reservas.length; }
    get totalReservas() { return this.allReservas.length; }

    onEstadoChange(reserva: any, nuevoEstado: string) {
        if (nuevoEstado === reserva.estado) return;
        const estadoAnterior = reserva.estado;
        this.updatingId = reserva.id;
        this.adminService.updateReservation(reserva.id, { estado: nuevoEstado }).subscribe({
            next: () => {
                reserva.estado = nuevoEstado;
                this.updatingId = null;
                this.cdr.detectChanges();
            },
            error: (err) => {
                reserva.estado = estadoAnterior;
                this.updatingId = null;
                alert('Error al actualizar el estado: ' + (err.error?.message || 'Error desconocido'));
                this.cdr.detectChanges();
            }
        });
    }

    getEstadoLabel(estado: string): string { return estado.replace('_', ' '); }

    openDeleteModal(id: number) { this.itemToDeleteId = id; this.showDeleteModal = true; }
    closeDeleteModal() { this.showDeleteModal = false; this.itemToDeleteId = null; }

    confirmDelete() {
        if (this.itemToDeleteId === null) return;
        const id = this.itemToDeleteId;
        this.deletingId = id;
        this.adminService.deleteReservation(id).subscribe({
            next: () => {
                this.allReservas = this.allReservas.filter(r => r.id !== id);
                this.applyFilters();
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err) => {
                alert('Error al eliminar la reserva: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
