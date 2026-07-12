import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

/**
 * Pipe de traducción: {{ 'Texto en español' | t }}
 * Es impuro para reaccionar al cambio de idioma en tiempo real;
 * la búsqueda en diccionario es O(1), por lo que el costo es mínimo.
 */
@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TraducirPipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(texto: string): string {
    return this.i18n.traducir(texto);
  }
}
