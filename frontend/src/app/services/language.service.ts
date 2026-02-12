import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private translate = inject(TranslateService);

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

        const savedLang = localStorage.getItem('language');
        const browserLang = this.translate.getBrowserLang();
        // Usa el idioma guardado, o el del navegador si está soportado, o español por defecto
        const defaultLang = savedLang || (browserLang && this.availableLanguages.some(l => l.code === browserLang) ? browserLang : 'es');

        this.setLanguage(defaultLang);
    }

    setLanguage(lang: string) {
        this.translate.use(lang);
        localStorage.setItem('language', lang);
    }

    getCurrentLanguage() {
        return this.translate.currentLang;
    }
}
