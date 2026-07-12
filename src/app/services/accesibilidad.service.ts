import { Injectable, signal } from '@angular/core';

export interface OpcionesAccesibilidad {
  fuenteDislexia: boolean;
  lecturaEspaciada: boolean;
  lineaGuia: boolean;
  filtroColor: 'ninguno' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'grises';
  escalaTexto: number; // 100 | 112 | 125 | 150
}

const STORAGE_KEY = 'nogal-accesibilidad';

const OPCIONES_INICIALES: OpcionesAccesibilidad = {
  fuenteDislexia: false,
  lecturaEspaciada: false,
  lineaGuia: false,
  filtroColor: 'ninguno',
  escalaTexto: 100
};

/**
 * Gestiona todas las preferencias de accesibilidad de la aplicación:
 * tipografía para dislexia, espaciado de lectura, línea guía, filtros
 * para daltonismo, escala de texto y lectura por voz (SpeechSynthesis).
 * Las preferencias se aplican como clases/atributos sobre <html> y se
 * persisten en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class AccesibilidadService {
  readonly opciones = signal<OpcionesAccesibilidad>(this.leerGuardadas());

  /** Estado de la lectura por voz para la interfaz. */
  readonly estadoVoz = signal<'inactivo' | 'leyendo' | 'pausado'>('inactivo');

  private fuenteCargada = false;

  constructor() {
    this.aplicarTodo(this.opciones());
    // Si la página se recarga a mitad de una lectura, el navegador puede
    // conservar la cola de síntesis: la limpiamos.
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // ============ Alternadores ============

  alternarFuenteDislexia(): void {
    this.actualizar({ fuenteDislexia: !this.opciones().fuenteDislexia });
  }

  alternarLecturaEspaciada(): void {
    this.actualizar({ lecturaEspaciada: !this.opciones().lecturaEspaciada });
  }

  alternarLineaGuia(): void {
    this.actualizar({ lineaGuia: !this.opciones().lineaGuia });
  }

  fijarFiltroColor(filtro: OpcionesAccesibilidad['filtroColor']): void {
    this.actualizar({ filtroColor: filtro });
  }

  fijarEscalaTexto(escala: number): void {
    this.actualizar({ escalaTexto: escala });
  }

  restablecer(): void {
    this.detenerLectura();
    this.actualizar({ ...OPCIONES_INICIALES });
  }

  // ============ Texto a voz (SpeechSynthesis) ============

  get sintesisDisponible(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Lee en voz alta el texto seleccionado; si no hay selección,
   * lee el contenido principal visible de la página.
   */
  leer(): void {
    if (!this.sintesisDisponible) { return; }
    const synth = window.speechSynthesis;
    synth.cancel();

    const seleccion = window.getSelection()?.toString().trim();
    let texto = seleccion && seleccion.length > 0 ? seleccion : this.textoPrincipal();
    if (!texto) { return; }
    // Límite prudente para no saturar la cola de síntesis.
    texto = texto.slice(0, 6000);

    const locucion = new SpeechSynthesisUtterance(texto);
    locucion.lang = 'es-ES';
    locucion.rate = 0.95;
    locucion.onend = () => this.estadoVoz.set('inactivo');
    locucion.onerror = () => this.estadoVoz.set('inactivo');

    synth.speak(locucion);
    this.estadoVoz.set('leyendo');
  }

  pausarLectura(): void {
    if (this.sintesisDisponible && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.estadoVoz.set('pausado');
    }
  }

  reanudarLectura(): void {
    if (this.sintesisDisponible && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.estadoVoz.set('leyendo');
    }
  }

  detenerLectura(): void {
    if (this.sintesisDisponible) {
      window.speechSynthesis.cancel();
      this.estadoVoz.set('inactivo');
    }
  }

  // ============ Internos ============

  private actualizar(cambios: Partial<OpcionesAccesibilidad>): void {
    const nuevas = { ...this.opciones(), ...cambios };
    this.opciones.set(nuevas);
    this.aplicarTodo(nuevas);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevas));
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private aplicarTodo(o: OpcionesAccesibilidad): void {
    if (typeof document === 'undefined') { return; }
    const html = document.documentElement;

    html.classList.toggle('acc-fuente-dislexia', o.fuenteDislexia);
    html.classList.toggle('acc-lectura-espaciada', o.lecturaEspaciada);

    if (o.fuenteDislexia) { this.cargarFuenteDislexia(); }

    html.setAttribute('data-filtro-color', o.filtroColor);
    html.style.setProperty('--acc-escala-texto', `${o.escalaTexto}%`);
  }

  /** Carga OpenDyslexic desde CDN una sola vez, bajo demanda. */
  private cargarFuenteDislexia(): void {
    if (this.fuenteCargada || typeof document === 'undefined') { return; }
    const enlace = document.createElement('link');
    enlace.rel = 'stylesheet';
    enlace.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
    document.head.appendChild(enlace);
    this.fuenteCargada = true;
  }

  private textoPrincipal(): string {
    const principal =
      document.querySelector('router-outlet + *') || document.body;
    return (principal.textContent || '').replace(/\s+/g, ' ').trim();
  }

  private leerGuardadas(): OpcionesAccesibilidad {
    try {
      const crudo = localStorage.getItem(STORAGE_KEY);
      if (crudo) {
        return { ...OPCIONES_INICIALES, ...JSON.parse(crudo) };
      }
    } catch {
      /* SSR o almacenamiento bloqueado */
    }
    return { ...OPCIONES_INICIALES };
  }
}
