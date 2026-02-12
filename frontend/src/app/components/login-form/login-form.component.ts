import { Component, inject } from '@angular/core';
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

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
    });

    constructor() {
    }

    errorMessage: string = '';
    successMessage: string = '';

    isLoading: boolean = false;

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
                    return;
                }

                const role = res.data.role;
                this.successMessage = `Login exitoso como ${role}.`;

                if (role === 'Anfitrion') {
                    setTimeout(() => {
                        this.router.navigate(['/anfitrion/mis-areas']).catch(() => {
                        });
                        this.isLoading = false; // Stop loading after nav starts or delay
                    }, 1500);
                } else if (role === 'Cliente') {
                    setTimeout(() => {
                        this.router.navigate(['/cliente/panel']);
                        this.isLoading = false;
                    }, 500);
                } else {
                    setTimeout(() => {
                        this.router.navigate(['/explorar']);
                        this.isLoading = false;
                    }, 500);
                }
            },
            error: (err) => {
                console.error(err);
                this.errorMessage = err.error?.message || 'Error al iniciar sesión. Verifique sus credenciales.';
                this.isLoading = false; // Stop loading on error
            }
        });
    }
}
