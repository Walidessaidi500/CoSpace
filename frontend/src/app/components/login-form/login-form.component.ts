import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [RouterLink, ReactiveFormsModule, CommonModule, TranslateModule],
    templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
    });

    constructor() {
    }

    errorMessage: string = '';
    successMessage: string = '';

    isLoading: boolean = false;
    isSuspended: boolean = false;

    onSubmit() {
        console.log('Login Submit Triggered');
        this.errorMessage = '';
        this.successMessage = '';

        console.log('Form Status:', this.form.status);
        console.log('Form Value:', this.form.value);

        if (this.form.invalid) {
            console.log('Form is invalid, marking as touched');
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true; // Start loading

        const credentials = {
            email: this.form.get('email')?.value ?? '',
            password: this.form.get('password')?.value ?? ''
        };

        this.authService.login(credentials).subscribe({
            next: (res) => {
                // Check if 2FA is required
                if (res.status === '2fa_required') {
                    this.router.navigate(['/verify-2fa'], { queryParams: { email: res.email } });
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    return;
                }

                const role = res.data.role;
                this.successMessage = `Login exitoso como ${role}.`;
                this.cdr.detectChanges();

                if (role === 'Anfitrion') {
                    setTimeout(() => {
                        this.router.navigate(['/anfitrion/mis-areas']).catch(() => {
                        });
                        this.isLoading = false; // Stop loading after nav starts or delay
                        this.cdr.detectChanges();
                    }, 1500);
                } else if (role === 'Cliente') {
                    setTimeout(() => {
                        this.router.navigate(['/cliente/panel']);
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    }, 500);
                } else {
                    setTimeout(() => {
                        this.router.navigate(['/explorar']);
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    }, 500);
                }
            },
            error: (err) => {
                console.error('Error during login:', err);

                const errorMsg = err.error?.message || '';

                if (err.status === 403 && errorMsg.toLowerCase().includes('suspendida')) {
                    console.log('Account is suspended. Triggering isSuspended view.');
                    this.isSuspended = true;
                } else {
                    this.errorMessage = errorMsg || 'Error al iniciar sesión. Verifique sus credenciales.';
                }

                this.isLoading = false; // Stop loading on error
                this.cdr.detectChanges();
            }
        });
    }
}
