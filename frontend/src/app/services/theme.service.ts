import { Injectable, signal, effect } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    darkMode = signal<boolean>(false);

    constructor() {
        this.initializeTheme();
    }

    private initializeTheme() {
        // Comprobar localStorage o preferencia del sistema
        if (typeof localStorage !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                this.darkMode.set(savedTheme === 'dark');
            } else {
                // Opcional: Comprobar preferencia del sistema
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.darkMode.set(systemDark);
            }

            const savedTextSize = localStorage.getItem('textSize');
            if (savedTextSize) {
                this.textSize.set(savedTextSize);
            }
        }

        // Aplicar estado inicial
        this.applyTheme(this.darkMode());
        this.applyTextSize(this.textSize());
    }

    toggleDarkMode() {
        this.darkMode.update(val => !val);
        this.applyTheme(this.darkMode());
    }

    setDarkMode(isDark: boolean) {
        this.darkMode.set(isDark);
        this.applyTheme(isDark);
    }

    private applyTheme(isDark: boolean) {
        if (typeof document !== 'undefined') {
            if (isDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }

    textSize = signal<string>('text-scale-base');

    setTextSize(sizeClass: string) {
        this.textSize.set(sizeClass);
        this.applyTextSize(sizeClass);
    }

    private applyTextSize(sizeClass: string) {
        if (typeof document !== 'undefined') {
            // Eliminar todas las clases posibles de tamaño de texto primero
            document.documentElement.classList.remove('text-scale-sm', 'text-scale-base', 'text-scale-lg', 'text-scale-xl');
            document.documentElement.classList.add(sizeClass);
            localStorage.setItem('textSize', sizeClass);
        }
    }
}
