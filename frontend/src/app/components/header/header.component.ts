import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common'; // Necesario para async pipe y ngIf
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './header.component.html',
})
export class HeaderComponent {
    authService = inject(AuthService);
    currentUser$ = this.authService.currentUser$;

    dropdownOpen = false;

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }

    closeDropdown() {
        this.dropdownOpen = false;
    }

    logout() {
        this.authService.logout();
        this.closeDropdown();
    }
}
