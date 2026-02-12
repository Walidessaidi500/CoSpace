import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common'; // Necesario para async pipe y ngIf
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './header.component.html',
})
export class HeaderComponent {
    authService = inject(AuthService);
    themeService = inject(ThemeService);
    currentUser$ = this.authService.currentUser$;

    // Helper to debug template access
    get isDarkMode() {
        return this.themeService.darkMode();
    }

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
