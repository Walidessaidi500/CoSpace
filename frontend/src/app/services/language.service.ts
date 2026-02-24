import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private translate = inject(TranslateService);
    private platformId = inject(PLATFORM_ID);

    // Lista centralizada de idiomas disponibles
    availableLanguages = [
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        // Para añadir más idiomas, simplemente agrégalos aquí y crea el archivo JSON correspondiente en assets/i18n/
        // { code: 'fr', label: 'Français', flag: '🇫🇷' },
        // { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    ];

    constructor() {
        this.translate.addLangs(this.availableLanguages.map(l => l.code));
        this.translate.setDefaultLang('es');

        let savedLang = null;
        if (isPlatformBrowser(this.platformId)) {
            savedLang = localStorage.getItem('language');
        }

        const browserLang = isPlatformBrowser(this.platformId) ? this.translate.getBrowserLang() : 'es';
        // Usa el idioma guardado, o el del navegador si está soportado, o español por defecto
        const defaultLang = savedLang || (browserLang && this.availableLanguages.some(l => l.code === browserLang) ? browserLang : 'es');

        this.setLanguage(defaultLang);
    }

    setLanguage(lang: string) {
        this.translate.use(lang);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('language', lang);
        }
    }

    getCurrentLanguage() {
        return this.translate.currentLang;
    }
}
