import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
    templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
    email: string = '';
    message: string = '';
    errorMessage: string = '';
    isLoading: boolean = false;

    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    submit() {
        if (!this.email) return;

        this.isLoading = true;
        this.message = '';
        this.errorMessage = '';
        this.cdr.detectChanges();

        this.authService.forgotPassword(this.email).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                // Always show success message for security, or rely on backend message
                this.message = res.message || 'Si el correo existe, recibirás un código.';
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = 'Ocurrió un error. Inténtalo de nuevo.';
                this.cdr.detectChanges();
            }
        });
    }
}
