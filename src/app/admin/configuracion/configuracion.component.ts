import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { I18nService, Idioma } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';
import { TraducirPipe } from '../../pipes/traducir.pipe';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TraducirPipe],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent {
  private router = inject(Router);
  private i18n = inject(I18nService);
  private themeService = inject(ThemeService);

  configuraciones = {
    notificaciones: true,
    reportesAutomaticos: false,
    modoOscuro: this.themeService.esOscuro(),
    idioma: this.i18n.idioma() as string
  };

  volverAlPanel() {
    this.router.navigate(['/panel-admin']);
  }

  // El cambio de idioma se aplica de inmediato a todo el panel
  cambiarIdioma() {
    this.i18n.set(this.configuraciones.idioma as Idioma);
  }

  // El interruptor de modo oscuro de la configuración también aplica el tema real
  cambiarModoOscuro() {
    this.themeService.set(this.configuraciones.modoOscuro ? 'dark' : 'light');
  }

  guardarConfiguracion() {
    this.i18n.set(this.configuraciones.idioma as Idioma);
    this.themeService.set(this.configuraciones.modoOscuro ? 'dark' : 'light');
    alert('✅ ' + this.i18n.traducir('Configuración guardada exitosamente'));
    // Aquí puedes implementar la lógica para guardar en el backend
  }
}
