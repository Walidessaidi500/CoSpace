import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
    templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent {
    email: string = '';
    code: string = '';
    password: string = '';
    password_confirmation: string = '';

    message: string = '';
    errorMessage: string = '';
    isLoading: boolean = false;

    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private cdr = inject(ChangeDetectorRef);

    ngOnInit() {
        // Pre-fill email if passed from forgot-password
        this.email = this.route.snapshot.queryParams['email'] || '';
    }

    submit() {
        if (this.password !== this.password_confirmation) {
            this.errorMessage = 'Las contraseñas no coinciden.';
            return;
        }

        this.isLoading = true;
        this.message = '';
        this.errorMessage = '';
        this.cdr.detectChanges();

        this.authService.resetPassword(this.email, this.code, this.password, this.password_confirmation).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                this.message = 'Contraseña restablecida correctamente. Redirigiendo...';
                this.cdr.detectChanges();
                setTimeout(() => {
                    this.router.navigate(['/iniciar-sesion']);
                }, 3000);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Error al restablecer contraseña.';
                this.cdr.detectChanges();
            }
        });
    }
}
