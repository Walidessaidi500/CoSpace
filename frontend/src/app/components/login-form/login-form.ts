import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [RouterLink, ReactiveFormsModule, CommonModule],
    templateUrl: './login-form.html',
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

        const credentials = {
            email: this.form.get('email')?.value ?? '',
            password: this.form.get('password')?.value ?? ''
        };

        this.authService.login(credentials).subscribe({
            next: (res) => {
                const role = res.data.role;
                this.successMessage = `Login exitoso como ${role}.`;

                if (role === 'Anfitrion') {
                    setTimeout(() => {
                        this.router.navigate(['/anfitrion/mis-areas']).catch(() => {
                        });
                    }, 1500);
                } else {
                    setTimeout(() => {
                        alert(`Bienvenido ${role}! El panel está en construcción.`);
                    }, 500);
                }
            },
            error: (err) => {
                console.error(err);
                this.errorMessage = err.error?.message || 'Error al iniciar sesión. Verifique sus credenciales.';
            }
        });
    }
}
