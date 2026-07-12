import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'nogal-theme';

/**
 * Gestiona el tema claro/oscuro de la aplicación.
 * El valor se persiste en localStorage y se aplica sobre <html data-bs-theme>.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.leerTemaInicial());

  constructor() {
    this.aplicar(this.theme());
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.theme.set(theme);
    this.aplicar(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* almacenamiento no disponible: el tema se mantiene solo en la sesión */
    }
  }

  esOscuro(): boolean {
    return this.theme() === 'dark';
  }

  private aplicar(theme: Theme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-bs-theme', theme);
    }
  }

  private leerTemaInicial(): Theme {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado === 'dark' || guardado === 'light') {
        return guardado;
      }
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      /* SSR o almacenamiento bloqueado */
    }
    return 'light';
  }
}
