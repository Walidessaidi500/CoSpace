import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-usuario-admin-edit',
    standalone: true,
    imports: [CommonModule, SidebarAdminComponent, ReactiveFormsModule, ConfirmModalComponent],
    templateUrl: './usuario-admin-edit.component.html',
    styleUrls: ['./usuario-admin-edit.component.css']
})
export class UsuarioAdminEditComponent implements OnInit {
    private adminService = inject(AdminService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);

    userForm: FormGroup;
    userId: number | null = null;
    isLoading = true;
    errorMessage: string | null = null;
    successMessage: string | null = null;
    deletingId: number | null = null;

    // Modal State
    showDeleteModal = false;
    modalTitle = 'Eliminar Usuario';
    dialogMessage = '¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.';

    constructor() {
        this.userForm = this.fb.group({
            nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            tipo_usuario: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.userId = +id;
            this.loadUserData(this.userId);
        } else {
            this.router.navigate(['/admin/usuarios']);
        }
    }

    loadUserData(id: number) {
        this.isLoading = true;
        this.adminService.getAllUsers().subscribe({
            next: (users: any[]) => {
                const user = users.find(u => u.id === id);
                if (user) {
                    this.userForm.patchValue({
                        nombre_completo: user.nombre,
                        email: user.email,
                        tipo_usuario: user.rol
                    });
                    this.isLoading = false;
                    this.cdr.detectChanges();
                } else {
                    this.errorMessage = 'Usuario no encontrado.';
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                console.error('Error loading users:', err);
                this.errorMessage = 'Error al cargar los datos del usuario.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onSubmit() {
        if (this.userForm.valid && this.userId) {
            this.isLoading = true;
            this.errorMessage = null;

            this.adminService.updateUser(this.userId, this.userForm.value).subscribe({
                next: () => {
                    this.successMessage = 'Usuario actualizado correctamente.';
                    setTimeout(() => {
                        this.router.navigate(['/admin/usuarios']);
                    }, 1500);
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error updating user:', err);
                    this.errorMessage = 'Error al actualizar el usuario: ' + (err.error?.message || err.message);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.userForm.markAllAsTouched();
        }
    }

    onCancel() {
        this.router.navigate(['/admin/usuarios']);
    }

    // Delete Logic
    initiateDelete() {
        this.showDeleteModal = true;
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
    }

    confirmDelete() {
        if (!this.userId) return;

        const id = this.userId;
        this.deletingId = id;

        this.adminService.deleteUser(id).subscribe({
            next: () => {
                this.deletingId = null;
                this.closeDeleteModal();
                this.router.navigate(['/admin/usuarios']);
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
