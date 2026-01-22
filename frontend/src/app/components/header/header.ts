import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common'; // Necesario para async pipe y ngIf
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './header.html',
})
export class HeaderComponent {
    authService = inject(AuthService);
    currentUser$ = this.authService.currentUser$;

    logout() {
        this.authService.logout();
    }
}
