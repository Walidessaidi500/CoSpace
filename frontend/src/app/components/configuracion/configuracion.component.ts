import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-configuracion',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule],
    templateUrl: './configuracion.component.html',
})
export class ConfiguracionComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    public themeService = inject(ThemeService);
    public languageService = inject(LanguageService);
    private translate = inject(TranslateService);

    user = this.authService.getUser();

    // Profile Form
    profileForm = this.fb.group({
        nombre_completo: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        telefono: ['']
    });

    // Settings mock state
    highContrast = false;
    notifications = true;

    profilePictureUrl: string | ArrayBuffer | null = null;
    selectedFile: File | null = null;

    ngOnInit() {
        if (this.user) {
            this.profileForm.patchValue({
                nombre_completo: this.user.nombre_completo,
                email: this.user.email,
                telefono: this.user.telefono || ''
            });

            if (this.user.foto_perfil) {
                // Assuming standard storage path, adjust if needed
                this.profilePictureUrl = `http://127.0.0.1:8000/storage/${this.user.foto_perfil}`;
            }
        }
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.profilePictureUrl = e.target?.result || null;
            };
            reader.readAsDataURL(file);
        }
    }

    isLoading = false;
    showSuccessToast = false;

    saveProfile() {
        if (this.profileForm.valid) {
            this.isLoading = true;
            this.showSuccessToast = false;

            const formData = new FormData();
            formData.append('nombre_completo', this.profileForm.get('nombre_completo')?.value || '');
            formData.append('email', this.profileForm.get('email')?.value || '');
            formData.append('telefono', this.profileForm.get('telefono')?.value || '');

            if (this.selectedFile) {
                formData.append('foto_perfil', this.selectedFile);
            }

            this.authService.updateProfile(formData).subscribe({
                next: (res) => {
                    this.isLoading = false;
                    this.showSuccessToast = true;
                    setTimeout(() => {
                        this.showSuccessToast = false;
                    }, 4000); // Hide after 4s

                    this.selectedFile = null;
                    this.user = this.authService.getUser();
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error('Error updating profile:', err);
                    alert(this.translate.instant('SETTINGS.ERRORS.UPDATE_PROFILE') + ': ' + (err.error?.message || err.message));
                }
            });
        }
    }

    closeToast() {
        this.showSuccessToast = false;
    }

    toggleDarkMode() {
        this.themeService.toggleDarkMode();
    }

    toggleLanguage(lang: string) {
        this.languageService.setLanguage(lang);
    }

    toggle2FA() {
        if (!this.user) return;
        const newState = !this.user.two_factor_enabled;

        // Optimistic update
        this.user.two_factor_enabled = newState;

        this.authService.update2FASettings(newState).subscribe({
            next: (res) => {
                // Success handled by service updating subject
                // Optional: Show toast
                this.showSuccessToast = true;
                setTimeout(() => this.showSuccessToast = false, 3000);
            },
            error: (err) => {
                // Revert on error
                if (this.user) this.user.two_factor_enabled = !newState;
                console.error(err);
                alert(this.translate.instant('SETTINGS.ERRORS.UPDATE_2FA'));
            }
        });
    }

    // Change Password Modal & Logic
    showChangePasswordModal = false;
    changePasswordForm = this.fb.group({
        current_password: ['', Validators.required],
        new_password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required]
    });
    passwordError = '';
    passwordSuccess = '';

    openPasswordModal() {
        this.showChangePasswordModal = true;
        this.changePasswordForm.reset();
        this.passwordError = '';
        this.passwordSuccess = '';
    }

    closePasswordModal() {
        this.showChangePasswordModal = false;
    }

    submitChangePassword() {
        if (this.changePasswordForm.invalid) return;

        const { current_password, new_password, confirm_password } = this.changePasswordForm.value;

        if (new_password !== confirm_password) {
            this.passwordError = this.translate.instant('SETTINGS.MODALS.CHANGE_PASSWORD.ERROR_MATCH');
            return;
        }

        this.isLoading = true;
        this.passwordError = '';

        this.authService.changePassword({
            current_password: current_password,
            new_password: new_password,
            new_password_confirmation: confirm_password // Laravel validation rule 'confirmed' looks for [name]_confirmation
        }).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.passwordSuccess = this.translate.instant('SETTINGS.MODALS.CHANGE_PASSWORD.SUCCESS');
                setTimeout(() => {
                    this.closePasswordModal();
                }, 2000);
            },
            error: (err) => {
                this.isLoading = false;
                this.passwordError = err.error?.message || this.translate.instant('SETTINGS.MODALS.CHANGE_PASSWORD.ERROR_GENERIC');
            }
        });
    }
}
