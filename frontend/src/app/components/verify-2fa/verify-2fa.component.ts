import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-verify-2fa',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './verify-2fa.component.html'
})
export class Verify2faComponent {
    email: string = '';
    code: string = '';
    errorMessage: string = '';
    isLoading: boolean = false;

    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    ngOnInit() {
        this.email = this.route.snapshot.queryParams['email'] || '';
        if (!this.email) {
            this.errorMessage = 'No se proporcionó email. Vuelve a iniciar sesión.';
        }
    }

    verify() {
        if (!this.code || this.code.length < 6) {
            this.errorMessage = 'El código debe tener 6 dígitos';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.authService.verify2FA(this.email, this.code).subscribe({
            next: (res) => {
                this.isLoading = false;
                // Auth service logic inside verify2FA should handle token storage
                const role = this.authService.getRole();
                if (role === 'Anfitrion') {
                    setTimeout(() => this.router.navigate(['/anfitrion/mis-areas']), 500);
                } else if (role === 'Cliente') {
                    setTimeout(() => this.router.navigate(['/cliente/panel']), 500);
                } else {
                    setTimeout(() => this.router.navigate(['/explorar']), 500);
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Código inválido o expirado';
            }
        });
    }
}
