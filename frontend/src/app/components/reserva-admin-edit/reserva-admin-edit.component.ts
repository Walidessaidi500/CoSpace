import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-reserva-admin-edit',
    standalone: true,
    imports: [CommonModule, SidebarAdminComponent, ReactiveFormsModule, ConfirmModalComponent],
    templateUrl: './reserva-admin-edit.component.html',
    styleUrls: ['./reserva-admin-edit.component.css']
})
export class ReservaAdminEditComponent implements OnInit {
    private adminService = inject(AdminService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);

    reservaForm: FormGroup;
    reservaId: number | null = null;
    isLoading = true;
    errorMessage: string | null = null;
    successMessage: string | null = null;
    deletingId: number | null = null;

    // Modal State
    showDeleteModal = false;
    modalTitle = 'Eliminar Reserva';
    modalMessage = '¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.';

    constructor() {
        this.reservaForm = this.fb.group({
            monto_total: ['', [Validators.required, Validators.min(0)]],
            estado: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.reservaId = +id;
            this.loadReservaData(this.reservaId);
        } else {
            this.router.navigate(['/admin/reservas']);
        }
    }

    loadReservaData(id: number) {
        this.isLoading = true;
        this.adminService.getAllReservations().subscribe({
            next: (reservas: any[]) => {
                const reserva = reservas.find(r => r.id === id);
                if (reserva) {
                    this.reservaForm.patchValue({
                        monto_total: reserva.monto_total,
                        estado: reserva.estado
                    });
                    this.isLoading = false;
                    this.cdr.detectChanges();
                } else {
                    this.errorMessage = 'Reserva no encontrada.';
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                console.error('Error loading reservations:', err);
                this.errorMessage = 'Error al cargar los datos de la reserva.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onSubmit() {
        if (this.reservaForm.valid && this.reservaId) {
            this.isLoading = true;
            this.errorMessage = null;

            this.adminService.updateReservation(this.reservaId, this.reservaForm.value).subscribe({
                next: () => {
                    this.successMessage = 'Reserva actualizada correctamente.';
                    setTimeout(() => {
                        this.router.navigate(['/admin/reservas']);
                    }, 1500);
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error updating reservation:', err);
                    this.errorMessage = 'Error al actualizar la reserva: ' + (err.error?.message || err.message);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.reservaForm.markAllAsTouched();
        }
    }

    onCancel() {
        this.router.navigate(['/admin/reservas']);
    }

    // Delete Logic
    openDeleteModal() {
        this.showDeleteModal = true;
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
    }

    confirmDelete() {
        if (!this.reservaId) return;

        const id = this.reservaId;
        this.deletingId = id;

        this.adminService.deleteReservation(id).subscribe({
            next: () => {
                this.deletingId = null;
                this.closeDeleteModal();
                this.router.navigate(['/admin/reservas']);
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
