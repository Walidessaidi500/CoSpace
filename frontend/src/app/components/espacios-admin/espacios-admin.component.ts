import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-espacios-admin',
    standalone: true,
    imports: [CommonModule, RouterLink, SidebarAdminComponent, ConfirmModalComponent],
    templateUrl: './espacios-admin.component.html',
    styleUrls: ['./espacios-admin.component.css'],
})
export class EspaciosAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    espacios: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    deletingId: number | null = null;

    // Modal State
    showDeleteModal = false;
    itemToDeleteId: number | null = null;
    modalTitle = 'Eliminar Espacio';
    modalMessage = '¿Estás seguro de que deseas eliminar este espacio? Esta acción no se puede deshacer y eliminará todas las reservas asociadas.';

    ngOnInit() {
        this.loadEspacios();
    }

    loadEspacios() {
        this.isLoading = true;
        this.adminService.getAllSpaces().subscribe({
            next: (data) => {
                console.log('EspaciosAdmin: Data received', data);
                this.espacios = data;
                this.isLoading = false;
                this.cdr.detectChanges(); // Forzar actualización de la vista
                console.log('EspaciosAdmin: Loading set to false');
            },
            error: (err) => {
                console.error('EspaciosAdmin: Error loading spaces:', err);
                this.errorMessage = 'Error al cargar los espacios. ' + (err.message || '');
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

        this.adminService.deleteSpace(id).subscribe({
            next: () => {
                this.espacios = this.espacios.filter(e => e.id !== id);
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error deleting space:', err);
                alert('Error al eliminar el espacio: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
