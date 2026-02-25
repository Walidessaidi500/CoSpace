import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';

import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule, TranslateModule],
    templateUrl: './header.component.html',
})
export class HeaderComponent {
    authService = inject(AuthService);
    themeService = inject(ThemeService);
    languageService = inject(LanguageService);
    private platformId = inject(PLATFORM_ID);
    currentUser$ = this.authService.currentUser$;

    get isDarkMode() {
        return this.themeService.darkMode();
    }

    dropdownOpen = false;
    accessibilityOpen = false;

    // Font size presets
    fontSizes = [
        { label: 'Normal', value: '100%', key: 'normal' },
        { label: 'Grande', value: '112%', key: 'large' },
        { label: 'Muy grande', value: '125%', key: 'xlarge' },
    ];
    currentFontSize = 'normal';

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            const saved = localStorage.getItem('fontSize');
            if (saved) {
                this.currentFontSize = saved;
                const preset = this.fontSizes.find(f => f.key === saved);
                if (preset) {
                    document.documentElement.style.fontSize = preset.value;
                }
            }
        }
    }

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
        this.accessibilityOpen = false;
    }

    closeDropdown() {
        this.dropdownOpen = false;
    }

    toggleAccessibility() {
        this.accessibilityOpen = !this.accessibilityOpen;
        this.dropdownOpen = false;
    }

    closeAccessibility() {
        this.accessibilityOpen = false;
    }

    setFontSize(key: string) {
        this.currentFontSize = key;
        const preset = this.fontSizes.find(f => f.key === key);
        if (preset) {
            document.documentElement.style.fontSize = preset.value;
            if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem('fontSize', key);
            }
        }
    }

    switchLanguage(lang: string) {
        this.languageService.setLanguage(lang);
    }

    logout() {
        this.authService.logout();
        this.closeDropdown();
    }
}
