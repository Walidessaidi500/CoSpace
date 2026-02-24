import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-espacios-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SidebarAdminComponent, ConfirmModalComponent],
    templateUrl: './espacios-admin.component.html',
    styleUrls: ['./espacios-admin.component.css'],
})
export class EspaciosAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    allEspacios: any[] = [];
    espacios: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    deletingId: number | null = null;

    // Filtros
    searchTerm = '';
    filterEstado = '';

    // Modal State
    showDeleteModal = false;
    itemToDeleteId: number | null = null;
    modalTitle = 'Eliminar Espacio';
    modalMessage = '¿Estás seguro de que deseas eliminar este espacio? Esta acción no se puede deshacer y eliminará todas las reservas asociadas.';

    ngOnInit() { this.loadEspacios(); }

    loadEspacios() {
        this.isLoading = true;
        this.adminService.getAllSpaces().subscribe({
            next: (data) => {
                this.allEspacios = data;
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.errorMessage = 'Error al cargar los espacios. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    applyFilters() {
        const term = this.searchTerm.toLowerCase().trim();
        this.espacios = this.allEspacios.filter(e => {
            const matchSearch = !term ||
                e.titulo?.toLowerCase().includes(term) ||
                e.ciudad?.toLowerCase().includes(term) ||
                e.anfitrion?.toLowerCase().includes(term);
            const matchEstado = !this.filterEstado || e.estado?.toLowerCase() === this.filterEstado.toLowerCase();
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

    get totalFiltrados() { return this.espacios.length; }
    get totalEspacios() { return this.allEspacios.length; }

    openDeleteModal(id: number) { this.itemToDeleteId = id; this.showDeleteModal = true; }
    closeDeleteModal() { this.showDeleteModal = false; this.itemToDeleteId = null; }

    confirmDelete() {
        if (this.itemToDeleteId === null) return;
        const id = this.itemToDeleteId;
        this.deletingId = id;
        this.adminService.deleteSpace(id).subscribe({
            next: () => {
                this.allEspacios = this.allEspacios.filter(e => e.id !== id);
                this.applyFilters();
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err) => {
                alert('Error al eliminar el espacio: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
