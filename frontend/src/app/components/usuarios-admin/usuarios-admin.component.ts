import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-usuarios-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SidebarAdminComponent, ConfirmModalComponent],
    templateUrl: './usuarios-admin.component.html',
    styleUrls: ['./usuarios-admin.component.css'],
})
export class UsuariosAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    allUsuarios: any[] = [];
    usuarios: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    deletingId: number | null = null;

    // Filtros
    searchTerm = '';
    filterRol = '';

    // Modal State
    showDeleteModal = false;
    itemToDeleteId: number | null = null;
    modalTitle = 'Eliminar Usuario';
    dialogMessage = '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.';

    ngOnInit() { this.loadUsuarios(); }

    loadUsuarios() {
        this.isLoading = true;
        this.adminService.getAllUsers().subscribe({
            next: (data) => {
                this.allUsuarios = data;
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.errorMessage = 'Error al cargar los usuarios. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    applyFilters() {
        const term = this.searchTerm.toLowerCase().trim();
        this.usuarios = this.allUsuarios.filter(u => {
            const matchSearch = !term ||
                u.nombre?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term);
            const matchRol = !this.filterRol || u.rol === this.filterRol;
            return matchSearch && matchRol;
        });
    }

    onSearchChange() { this.applyFilters(); }
    onFilterChange() { this.applyFilters(); }

    clearFilters() {
        this.searchTerm = '';
        this.filterRol = '';
        this.applyFilters();
    }

    get totalFiltrados() { return this.usuarios.length; }
    get totalUsuarios() { return this.allUsuarios.length; }

    initiateDelete(id: number) { this.itemToDeleteId = id; this.showDeleteModal = true; }
    closeDeleteModal() { this.showDeleteModal = false; this.itemToDeleteId = null; }

    confirmDelete() {
        if (this.itemToDeleteId === null) return;
        const id = this.itemToDeleteId;
        this.deletingId = id;
        this.adminService.deleteUser(id).subscribe({
            next: () => {
                this.allUsuarios = this.allUsuarios.filter(u => u.id !== id);
                this.applyFilters();
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err) => {
                alert('Error al eliminar el usuario: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }

    toggleEstado(user: any) {
        const newEstado = user.estado_cuenta === 'Suspendido' ? 'Activo' : 'Suspendido';
        const updatedData = {
            estado_cuenta: newEstado,
            tipo_usuario: user.rol // Mandatory field in validation
        };

        // Optional UI loading state (e.g. user.isUpdatingEstado) could be added here

        this.adminService.updateUser(user.id, updatedData).subscribe({
            next: (res) => {
                user.estado_cuenta = newEstado;
                this.cdr.detectChanges();
            },
            error: (err) => {
                alert('Error al cambiar el estado del usuario: ' + (err.error?.message || 'Error desconocido'));
            }
        });
    }
}
