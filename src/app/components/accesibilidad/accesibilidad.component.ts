import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccesibilidadService } from '../../services/accesibilidad.service';

/**
 * Widget flotante de accesibilidad, disponible en toda la aplicación.
 * Ofrece: tipografía para dislexia, espaciado de lectura, línea guía,
 * lectura por voz, filtros para daltonismo y escala de texto.
 */
@Component({
  selector: 'app-accesibilidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accesibilidad.component.html',
  styleUrls: ['./accesibilidad.component.css']
})
export class AccesibilidadComponent {
  readonly acc = inject(AccesibilidadService);

  abierto = signal(false);
  posicionGuiaY = signal(0);

  readonly filtros: { valor: 'ninguno' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'grises'; etiqueta: string }[] = [
    { valor: 'ninguno', etiqueta: 'Sin filtro' },
    { valor: 'deuteranopia', etiqueta: 'Deuteranopía' },
    { valor: 'protanopia', etiqueta: 'Protanopía' },
    { valor: 'tritanopia', etiqueta: 'Tritanopía' },
    { valor: 'grises', etiqueta: 'Escala de grises' }
  ];

  readonly escalas = [100, 112, 125, 150];

  alternarPanel(): void {
    this.abierto.update(v => !v);
  }

  cerrarPanel(): void {
    this.abierto.set(false);
  }

  @HostListener('document:mousemove', ['$event'])
  moverGuia(evento: MouseEvent): void {
    if (this.acc.opciones().lineaGuia) {
      this.posicionGuiaY.set(evento.clientY);
    }
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    this.cerrarPanel();
  }
}
