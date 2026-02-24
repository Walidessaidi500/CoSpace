import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-pagos-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SidebarAdminComponent, ConfirmModalComponent],
    templateUrl: './pagos-admin.component.html',
    styleUrls: ['./pagos-admin.component.css'],
})
export class PagosAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    allPagos: any[] = [];
    pagos: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    deletingId: number | null = null;

    // Filtros
    searchTerm = '';
    filterEstado = '';
    filterMetodo = '';

    // Modal
    showDeleteModal = false;
    itemToDeleteId: number | null = null;
    modalTitle = 'Eliminar Registro de Pago';
    modalMessage = '¿Estás seguro de que deseas eliminar este registro de pago? Esta acción no se puede deshacer.';

    // Estadísticas calculadas
    get totalIngresos(): number {
        return this.allPagos
            .filter(p => p.estado_pago === 'Completado')
            .reduce((sum, p) => sum + Number(p.monto || 0), 0);
    }

    get totalCompletados(): number {
        return this.allPagos.filter(p => p.estado_pago === 'Completado').length;
    }

    get totalReembolsados(): number {
        return this.allPagos.filter(p => p.estado_pago === 'Reembolsado').length;
    }

    ngOnInit() { this.loadPagos(); }

    loadPagos() {
        this.isLoading = true;
        this.errorMessage = null;
        this.adminService.getAllPagos().subscribe({
            next: (data: any) => {
                this.allPagos = data;
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.errorMessage = 'Error al cargar los pagos. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    applyFilters() {
        const term = this.searchTerm.toLowerCase().trim();
        this.pagos = this.allPagos.filter(p => {
            const matchSearch = !term ||
                p.cliente?.toLowerCase().includes(term) ||
                p.email?.toLowerCase().includes(term) ||
                p.espacio?.toLowerCase().includes(term) ||
                p.id_transaccion?.toLowerCase().includes(term);
            const matchEstado = !this.filterEstado || p.estado_pago === this.filterEstado;
            const matchMetodo = !this.filterMetodo || p.metodo_pago === this.filterMetodo;
            return matchSearch && matchEstado && matchMetodo;
        });
    }

    onSearchChange() { this.applyFilters(); }
    onFilterChange() { this.applyFilters(); }

    clearFilters() {
        this.searchTerm = '';
        this.filterEstado = '';
        this.filterMetodo = '';
        this.applyFilters();
    }

    get totalFiltrados() { return this.pagos.length; }
    get totalPagos() { return this.allPagos.length; }

    getEstadoClasses(estado: string): string {
        const map: { [k: string]: string } = {
            'Completado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            'Pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            'Fallido': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            'Reembolsado': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        };
        return map[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }

    openDeleteModal(id: number) { this.itemToDeleteId = id; this.showDeleteModal = true; }
    closeDeleteModal() { this.showDeleteModal = false; this.itemToDeleteId = null; }

    confirmDelete() {
        if (this.itemToDeleteId === null) return;
        const id = this.itemToDeleteId;
        this.deletingId = id;
        this.adminService.deletePago(id).subscribe({
            next: () => {
                this.allPagos = this.allPagos.filter(p => p.id !== id);
                this.applyFilters();
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                alert('Error al eliminar el pago: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
