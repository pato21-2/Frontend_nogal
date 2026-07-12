import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TarjetaService } from '../../services/tarjeta.service';
import { Tarjeta } from '../../models/tarjeta';

@Component({
  selector: 'app-mis-tarjetas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mis-tarjetas.component.html',
  styleUrls: ['./mis-tarjetas.component.css']
})
export class MisTarjetasComponent implements OnInit {
  private tarjetaService = inject(TarjetaService);
  private router = inject(Router);
  private modalService = inject(NgbModal);

  // Propiedades públicas
  tarjetas: Tarjeta[] = [];
  cargando: boolean = true;
  guardando: boolean = false;
  tarjetaEdicionId: number | null = null;
  tipoTarjeta: string = '';
  mostrarAvisoVerificacion: boolean = false;

  // Datos para nueva tarjeta
  nuevaTarjeta = {
    numeroCompleto: '',
    nombreTitular: '',
    mesExpiracion: '',
    anioExpiracion: '',
    cvv: ''
  };

  // Opciones para selects
  meses: number[] = Array.from({length: 12}, (_, i) => i + 1);
  anios: number[] = Array.from({length: 10}, (_, i) => new Date().getFullYear() + i);

  ngOnInit() {
    this.cargarTarjetas();
  }

  cargarTarjetas() {
    this.cargando = true;
    const usuario = this.obtenerUsuarioActual();
    
    if (!usuario) {
      console.error('❌ No se pudo obtener usuario actual');
      this.cargando = false;
      return;
    }
    
    console.log('🔄 Cargando tarjetas para usuario:', usuario.id);
    
    this.tarjetaService.listarTarjetas(usuario.id).subscribe({
      next: (data) => {
        console.log('✅ Tarjetas cargadas:', data);
        this.tarjetas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando tarjetas:', err);
        this.tarjetas = [];
        this.cargando = false;
        
        if (err.status !== 404) {
          alert('❌ Error al cargar tarjetas: ' + err);
        }
      }
    });
  }

  obtenerUsuarioActual(): any {
    const usuarioData = localStorage.getItem('usuario');
    return usuarioData ? JSON.parse(usuarioData) : null;
  }

  abrirModalAgregar(modal: any) {
    this.limpiarFormulario();
    this.modalService.open(modal, { size: 'lg' });
  }

  abrirModalEditar(modal: any, tarjeta: Tarjeta) {
    this.limpiarFormulario();
    
    this.nuevaTarjeta.nombreTitular = tarjeta.nombreTitular;
    this.nuevaTarjeta.mesExpiracion = tarjeta.mesExpiracion.toString();
    this.nuevaTarjeta.anioExpiracion = tarjeta.anioExpiracion.toString();
    
    this.tarjetaEdicionId = tarjeta.id!;
    this.tipoTarjeta = tarjeta.tipo;
    
    this.modalService.open(modal, { size: 'lg' });
  }

  // Seleccionar tarjeta (para editar)
  seleccionarTarjeta(tarjeta: Tarjeta) {
    // Podrías abrir modal de edición o mostrar detalles
    console.log('Tarjeta seleccionada:', tarjeta);
  }

  // Detectar tipo de tarjeta
  detectarTipoTarjeta(numero: string): string {
    const cleanNumero = numero.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumero)) return 'VISA';
    if (/^5[1-5]/.test(cleanNumero)) return 'MASTERCARD';
    if (/^3[47]/.test(cleanNumero)) return 'AMEX';
    if (/^6(?:011|5)/.test(cleanNumero)) return 'DISCOVER';
    
    return 'DEFAULT';
  }

  // Formatear número de tarjeta
  formatearNumeroTarjeta() {
    let numero = this.nuevaTarjeta.numeroCompleto.replace(/\s/g, '');
    
    if (numero.length > 0) {
      this.tipoTarjeta = this.detectarTipoTarjeta(numero);
      numero = numero.replace(/(.{4})/g, '$1 ').trim();
      this.nuevaTarjeta.numeroCompleto = numero;
    }
  }

  // Obtener clase CSS según tipo de tarjeta
  getCardClass(tipo: string): string {
    const tipos: {[key: string]: string} = {
      'VISA': 'visa',
      'MASTERCARD': 'mastercard',
      'AMEX': 'amex',
      'DISCOVER': 'discover'
    };
    return tipos[tipo] || 'default';
  }

  // Obtener logo de tarjeta (color)
getLogo(tipo: string): string {
  const logos: {[key: string]: string} = {
    'VISA': 'img/visa-logo.png',
    'MASTERCARD': 'img/mastercard-logo.png',
    'AMEX': 'img/amex-logo.png',
    'DISCOVER': 'img/discover-logo.png'
  };
  return logos[tipo] || 'img/credit-card-logo.png';
}
  

  // Obtener logo blanco para la tarjeta
  getLogoBlanco(tipo: string): string {
    return this.getLogo(tipo);
  }

  // Obtener texto para marca de agua
  getLogoText(tipo: string): string {
    const textos: {[key: string]: string} = {
      'VISA': 'VISA',
      'MASTERCARD': 'MC',
      'AMEX': 'AMEX',
      'DISCOVER': 'DISC'
    };
    return textos[tipo] || 'CARD';
  }

  // Validar formulario
  validarFormulario(): boolean {
    if (!this.tarjetaEdicionId) {
      if (!this.nuevaTarjeta.numeroCompleto || this.nuevaTarjeta.numeroCompleto.replace(/\s/g, '').length < 16) {
        alert('Número de tarjeta inválido');
        return false;
      }

      if (!this.nuevaTarjeta.cvv || this.nuevaTarjeta.cvv.length < 3) {
        alert('CVV es requerido');
        return false;
      }
    }

    if (!this.nuevaTarjeta.nombreTitular) {
      alert('Nombre del titular es requerido');
      return false;
    }

    if (!this.nuevaTarjeta.mesExpiracion || !this.nuevaTarjeta.anioExpiracion) {
      alert('Fecha de expiración es requerida');
      return false;
    }

    return true;
  }

  // Guardar tarjeta
  guardarTarjeta() {
    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;
    const usuario = this.obtenerUsuarioActual();

    if (!usuario) {
      alert('Usuario no autenticado');
      this.guardando = false;
      return;
    }

    if (this.tarjetaEdicionId) {
      // Modo edición
      const tarjetaData: Partial<Tarjeta> = {
        nombreTitular: this.nuevaTarjeta.nombreTitular,
        mesExpiracion: parseInt(this.nuevaTarjeta.mesExpiracion),
        anioExpiracion: parseInt(this.nuevaTarjeta.anioExpiracion)
      };

      this.tarjetaService.actualizarTarjeta(this.tarjetaEdicionId, tarjetaData as Tarjeta).subscribe({
        next: (data) => {
          this.guardando = false;
          this.modalService.dismissAll();
          alert('✅ Tarjeta actualizada exitosamente');
          this.cargarTarjetas();
        },
        error: (err) => {
          this.guardando = false;
          console.error('Error actualizando tarjeta:', err);
          alert('❌ Error al actualizar tarjeta: ' + err);
        }
      });
    } else {
      // Modo creación
      const tarjetaData = {
        usuario: { id: usuario.id },
        numeroEnmascarado: '****' + this.nuevaTarjeta.numeroCompleto.replace(/\s/g, '').slice(-4),
        tipo: this.tipoTarjeta,
        nombreTitular: this.nuevaTarjeta.nombreTitular.toUpperCase(),
        mesExpiracion: parseInt(this.nuevaTarjeta.mesExpiracion),
        anioExpiracion: parseInt(this.nuevaTarjeta.anioExpiracion),
        predeterminada: this.tarjetas.length === 0
      };
      
      console.log('📝 Datos que se enviarán:', tarjetaData);

      this.tarjetaService.crearTarjeta(tarjetaData).subscribe({
        next: (data) => {
          console.log('✅ Respuesta del backend:', data);
          this.guardando = false;
          this.modalService.dismissAll();
          alert('✅ Tarjeta agregada exitosamente');
          this.cargarTarjetas();
          this.mostrarAvisoVerificacion = true;
        },
        error: (err) => {
          this.guardando = false;
          console.error('❌ Error agregando tarjeta:', err);
          alert('❌ Error al agregar tarjeta: ' + err);
        }
      });
    }
  }

  // Eliminar tarjeta
  eliminarTarjeta(tarjetaId: number) {
    if (this.tarjetas.length === 1) {
      alert('⚠️ No puedes eliminar tu única tarjeta');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar esta tarjeta?')) {
      this.tarjetaService.eliminarTarjeta(tarjetaId).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor:', response);
          this.tarjetas = this.tarjetas.filter(tarjeta => tarjeta.id !== tarjetaId);
          alert('✅ Tarjeta eliminada exitosamente');
          
          setTimeout(() => {
            this.cargarTarjetas();
          }, 500);
        },
        error: (err) => {
          console.error('Error eliminando tarjeta:', err);
          let mensajeError = 'Error al eliminar tarjeta';
          
          if (err.status === 404) {
            mensajeError = 'La tarjeta no fue encontrada';
          } else if (err.status === 500) {
            mensajeError = 'Error del servidor al eliminar tarjeta';
          }
          
          alert(`❌ ${mensajeError}: ${err.message || err}`);
        }
      });
    }
  }

  // Establecer como predeterminada
  establecerPredeterminada(tarjetaId: number) {
    this.tarjetaService.establecerPredeterminada(tarjetaId).subscribe({
      next: (tarjetaActualizada) => {
        console.log('✅ Tarjeta actualizada:', tarjetaActualizada);
        
        this.tarjetas = this.tarjetas.map(tarjeta => ({
          ...tarjeta,
          predeterminada: tarjeta.id === tarjetaId
        }));
        
        alert('✅ Tarjeta establecida como predeterminada');
        
        setTimeout(() => {
          this.cargarTarjetas();
        }, 500);
      },
      error: (err) => {
        console.error('❌ Error estableciendo tarjeta predeterminada:', err);
        alert('❌ Error al establecer tarjeta predeterminada: ' + err);
      }
    });
  }

  // Limpiar formulario
  private limpiarFormulario() {
    this.nuevaTarjeta = {
      numeroCompleto: '',
      nombreTitular: '',
      mesExpiracion: '',
      anioExpiracion: '',
      cvv: ''
    };
    this.tipoTarjeta = '';
    this.tarjetaEdicionId = null;
  }
}