import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-usuarios-admin',
    standalone: true,
    imports: [CommonModule, RouterLink, SidebarAdminComponent, ConfirmModalComponent],
    templateUrl: './usuarios-admin.component.html',
    styleUrls: ['./usuarios-admin.component.css'],
})
export class UsuariosAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    usuarios: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    deletingId: number | null = null;

    // Modal State
    showDeleteModal = false;
    itemToDeleteId: number | null = null;
    modalTitle = 'Eliminar Usuario';
    dialogMessage = '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.';

    ngOnInit() {
        this.loadUsuarios();
    }

    loadUsuarios() {
        this.isLoading = true;
        this.adminService.getAllUsers().subscribe({
            next: (data) => {
                console.log('UsuariosAdmin: Data received', data);
                this.usuarios = data;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('UsuariosAdmin: Error loading users:', err);
                this.errorMessage = 'Error al cargar los usuarios. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    initiateDelete(id: number) {
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

        this.adminService.deleteUser(id).subscribe({
            next: () => {
                this.usuarios = this.usuarios.filter(u => u.id !== id);
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error deleting user:', err);
                alert('Error al eliminar el usuario: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
