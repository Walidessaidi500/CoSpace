import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de la Cabecera (Header)
 *
 * Muestra la barra de navegación principal de la aplicación CoSpace.
 * Incluye las siguientes funcionalidades:
 *
 * - **Navegación**: Enlaces a las diferentes secciones según el rol del usuario.
 * - **Panel de accesibilidad**: Permite ajustar el tamaño de fuente (normal, grande, muy grande),
 *   alternar el modo oscuro y cambiar el idioma de la aplicación.
 * - **Menú de usuario**: Dropdown con opciones de perfil y cerrar sesión.
 *
 * Las preferencias de tamaño de fuente se persisten en localStorage para que
 * se mantengan entre sesiones del navegador.
 */
@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule, TranslateModule],
    templateUrl: './header.component.html',
})
export class HeaderComponent {
    // Servicios inyectados (públicos para uso en template)
    authService = inject(AuthService);
    themeService = inject(ThemeService);
    languageService = inject(LanguageService);
    private platformId = inject(PLATFORM_ID);

    /** Observable del usuario actual para suscripción reactiva en el template */
    currentUser$ = this.authService.currentUser$;

    /** Getter que devuelve el estado actual del modo oscuro desde el servicio de tema */
    get isDarkMode() {
        return this.themeService.darkMode();
    }

    /** Controla la visibilidad del dropdown del menú de usuario */
    dropdownOpen = false;
    /** Controla la visibilidad del panel de accesibilidad */
    accessibilityOpen = false;

    /** Presets de tamaño de fuente para el panel de accesibilidad */
    fontSizes = [
        { label: 'Normal', value: '100%', key: 'normal' },
        { label: 'Grande', value: '112%', key: 'large' },
        { label: 'Muy grande', value: '125%', key: 'xlarge' },
    ];
    /** Clave del tamaño de fuente actualmente seleccionado */
    currentFontSize = 'normal';

    /**
     * Constructor que restaura el tamaño de fuente guardado en localStorage.
     * Solo se ejecuta en el navegador (no en SSR) gracias a isPlatformBrowser.
     */
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

    /** Alterna la visibilidad del dropdown de usuario; cierra el panel de accesibilidad. */
    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
        this.accessibilityOpen = false;
    }

    /** Cierra el dropdown de usuario. */
    closeDropdown() {
        this.dropdownOpen = false;
    }

    /** Alterna la visibilidad del panel de accesibilidad; cierra el dropdown de usuario. */
    toggleAccessibility() {
        this.accessibilityOpen = !this.accessibilityOpen;
        this.dropdownOpen = false;
    }

    /** Cierra el panel de accesibilidad. */
    closeAccessibility() {
        this.accessibilityOpen = false;
    }

    /**
     * Cambia el tamaño de fuente del documento y lo persiste en localStorage.
     * Modifica directamente el font-size del elemento raíz <html> para que afecte
     * a toda la aplicación de forma global.
     */
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

    /** Cambia el idioma de la aplicación a través del servicio de idiomas. */
    switchLanguage(lang: string) {
        this.languageService.setLanguage(lang);
    }

    /** Cierra la sesión del usuario y oculta el dropdown. */
    logout() {
        this.authService.logout();
        this.closeDropdown();
    }
}
