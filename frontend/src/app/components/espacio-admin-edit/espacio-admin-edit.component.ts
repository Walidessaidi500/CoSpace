import { Component, OnInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EspaciosService } from '../../services/espacios';
import { AdminService } from '../../services/admin.service';
import { FormularioEspacioComponent } from '../formulario-espacio/formulario-espacio.component';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-espacio-admin-edit',
    standalone: true,
    imports: [CommonModule, SidebarAdminComponent, FormularioEspacioComponent, ConfirmModalComponent],
    templateUrl: './espacio-admin-edit.component.html',
    styleUrls: ['./espacio-admin-edit.component.css']
})
export class EspacioAdminEditComponent implements OnInit {
    @ViewChild(FormularioEspacioComponent) formularioComponent!: FormularioEspacioComponent;

    private espaciosService = inject(EspaciosService);
    private adminService = inject(AdminService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    espacioId: string | null = null;
    isLoading = true;
    loadingText = 'Cargando información...';
    errorMessage: string | null = null;
    deletingId: number | null = null;

    // Modal State
    showDeleteModal = false;
    modalTitle = 'Eliminar Espacio';
    modalMessage = '¿Estás seguro de que deseas eliminar este espacio? Esta acción no se puede deshacer y eliminará todas las reservas asociadas.';

    ngOnInit() {
        this.espacioId = this.route.snapshot.paramMap.get('id');
        if (this.espacioId) {
            this.loadEspacioData();
        } else {
            this.router.navigate(['/admin/espacios']);
        }
    }

    loadEspacioData() {
        this.isLoading = true;
        this.loadingText = 'Cargando datos del espacio...';
        if (!this.espacioId) return;

        this.espaciosService.getEspacioById(this.espacioId).subscribe({
            next: (data) => {
                setTimeout(() => {
                    if (this.formularioComponent) {
                        this.formularioComponent.patchData(data);
                    }
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }, 300);
            },
            error: (err) => {
                console.error('Error loading space:', err);
                this.errorMessage = 'No se pudo cargar la información del espacio.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onGuardar() {
        if (this.formularioComponent && this.formularioComponent.espacioForm.valid) {
            const formData = this.formularioComponent.getFormData();

            if (this.espacioId) {
                this.isLoading = true;
                this.loadingText = 'Guardando cambios como Administrador...';

                this.adminService.updateSpace(+this.espacioId, formData).subscribe({
                    next: () => {
                        this.handleSuccess();
                    },
                    error: (err) => {
                        console.error('Error updating space:', err);
                        this.errorMessage = 'Error al actualizar el espacio.';
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    }
                });
            }
        } else {
            this.formularioComponent.espacioForm.markAllAsTouched();
        }
    }

    onCancelar() {
        this.router.navigate(['/admin/espacios']);
    }

    private handleSuccess() {
        alert('¡Espacio actualizado correctamente por el Administrador!');
        this.router.navigate(['/admin/espacios']);
    }

    // Delete Logic
    openDeleteModal() {
        this.showDeleteModal = true;
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
    }

    confirmDelete() {
        if (!this.espacioId) return;

        const id = +this.espacioId;
        this.deletingId = id; // Optional: show loading state

        this.adminService.deleteSpace(id).subscribe({
            next: () => {
                this.deletingId = null;
                this.closeDeleteModal();
                this.router.navigate(['/admin/espacios']);
            },
            error: (err) => {
                console.error('Error deleting space:', err);
                alert('Error al eliminar el espacio.');
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
