import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DireccionService } from '../../services/direccion.service';
import { Direccion } from '../../models/direccion';

declare var bootstrap: any;

@Component({
  selector: 'app-direcciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './direcciones.component.html',
  styleUrls: ['./direcciones.component.css']
})
export class DireccionesComponent implements OnInit {
  private direccionService = inject(DireccionService);
  private router = inject(Router);

  // Lista de direcciones
  direcciones: Direccion[] = [];
  
  // Dirección en edición/creación
  direccionEdicion: Direccion = this.limpiarDireccion();
  esEdicion: boolean = false;

  // Estados
  cargando: boolean = false;
  guardando: boolean = false;

  // Modal
  private modalDireccion: any;

  ngOnInit() {
    this.cargarDirecciones();
  }

  ngAfterViewInit() {
    // Inicializar modal de Bootstrap
    const modalElement = document.getElementById('modalDireccion');
    if (modalElement) {
      this.modalDireccion = new bootstrap.Modal(modalElement);
    }
  }

  // Cargar direcciones del usuario
  cargarDirecciones() {
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
      console.error('❌ No hay usuario autenticado');
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(usuarioData);
    this.cargando = true;

    this.direccionService.obtenerDireccionesPorUsuario(usuario.id).subscribe({
      next: (direcciones) => {
        console.log('✅ Direcciones cargadas:', direcciones);
        this.direcciones = direcciones;
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando direcciones:', err);
        this.cargando = false;
        // Si no hay direcciones, mostrar array vacío
        this.direcciones = [];
      }
    });
  }

  // Abrir modal para agregar
  abrirModalAgregar() {
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
      alert('❌ Debes iniciar sesión para agregar direcciones');
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(usuarioData);
    this.direccionEdicion = this.limpiarDireccion();
    this.direccionEdicion.usuario = { id: usuario.id };
    
    // Autocompletar nombre y apellidos del usuario
    this.direccionEdicion.nombreReceptor = usuario.nombres || '';
    this.direccionEdicion.apellidosReceptor = usuario.apellidos || '';
    this.direccionEdicion.telefono = usuario.telefono || '';
    
    this.esEdicion = false;
    
    if (this.modalDireccion) {
      this.modalDireccion.show();
    }
  }

  // Abrir modal para editar
  abrirModalEditar(direccion: Direccion) {
    this.direccionEdicion = { ...direccion };
    this.esEdicion = true;
    
    if (this.modalDireccion) {
      this.modalDireccion.show();
    }
  }

  // Guardar dirección (crear o actualizar)
  guardarDireccion() {
    if (!this.validarDireccion()) {
      return;
    }

    this.guardando = true;

    if (this.esEdicion && this.direccionEdicion.id) {
      // Actualizar dirección existente
      this.direccionService.actualizarDireccion(this.direccionEdicion.id, this.direccionEdicion).subscribe({
        next: (direccion) => {
          console.log('✅ Dirección actualizada:', direccion);
          this.guardando = false;
          this.cerrarModal();
          this.cargarDirecciones();
          alert('✅ Dirección actualizada correctamente');
        },
        error: (err) => {
          console.error('❌ Error actualizando dirección:', err);
          this.guardando = false;
          alert('❌ Error al actualizar dirección: ' + err);
        }
      });
    } else {
      // Crear nueva dirección
      this.direccionService.crearDireccion(this.direccionEdicion).subscribe({
        next: (direccion) => {
          console.log('✅ Dirección creada:', direccion);
          this.guardando = false;
          this.cerrarModal();
          this.cargarDirecciones();
          alert('✅ Dirección agregada correctamente');
        },
        error: (err) => {
          console.error('❌ Error creando dirección:', err);
          this.guardando = false;
          alert('❌ Error al crear dirección: ' + err);
        }
      });
    }
  }

  // Confirmar eliminación
  confirmarEliminar(direccion: Direccion) {
    if (direccion.esPrincipal && this.direcciones.length === 1) {
      alert('⚠️ No puedes eliminar tu única dirección principal');
      return;
    }

    const mensaje = `¿Estás seguro de que deseas eliminar la dirección "${direccion.nombreDireccion}"?`;
    if (confirm(mensaje)) {
      this.eliminarDireccion(direccion.id!);
    }
  }

  // Eliminar dirección
  eliminarDireccion(id: number) {
    this.direccionService.eliminarDireccion(id).subscribe({
      next: (response) => {
        console.log('✅ Dirección eliminada:', response);
        this.cargarDirecciones();
        alert('✅ Dirección eliminada correctamente');
      },
      error: (err) => {
        console.error('❌ Error eliminando dirección:', err);
        alert('❌ Error al eliminar dirección: ' + err);
      }
    });
  }

  // Marcar dirección como principal
  marcarComoPrincipal(id: number) {
    this.direccionService.marcarComoPrincipal(id).subscribe({
      next: (direccion) => {
        console.log('⭐ Dirección marcada como principal:', direccion);
        this.cargarDirecciones();
        alert('⭐ Dirección marcada como principal');
      },
      error: (err) => {
        console.error('❌ Error marcando como principal:', err);
        alert('❌ Error al marcar como principal: ' + err);
      }
    });
  }

  // Validar dirección
  validarDireccion(): boolean {
    if (!this.direccionEdicion.nombreDireccion?.trim()) {
      alert('⚠️ El nombre de la dirección es obligatorio');
      return false;
    }

    if (!this.direccionEdicion.nombreReceptor?.trim()) {
      alert('⚠️ El nombre del receptor es obligatorio');
      return false;
    }

    if (!this.direccionEdicion.apellidosReceptor?.trim()) {
      alert('⚠️ Los apellidos del receptor son obligatorios');
      return false;
    }

    if (!this.direccionEdicion.direccion?.trim()) {
      alert('⚠️ La dirección es obligatoria');
      return false;
    }

    if (!this.direccionEdicion.numero?.trim()) {
      alert('⚠️ El número es obligatorio');
      return false;
    }

    if (!this.direccionEdicion.telefono?.trim()) {
      alert('⚠️ El teléfono es obligatorio');
      return false;
    }

    // Validar formato de teléfono
    const telefonoPattern = /^9[0-9]{8}$/;
    if (!telefonoPattern.test(this.direccionEdicion.telefono)) {
      alert('⚠️ El teléfono debe tener 9 dígitos y empezar con 9');
      return false;
    }

    return true;
  }

  // Cerrar modal
  cerrarModal() {
    if (this.modalDireccion) {
      this.modalDireccion.hide();
    }
  }

  // Limpiar formulario
  limpiarDireccion(): Direccion {
    return {
      nombreDireccion: '',
      nombreReceptor: '',
      apellidosReceptor: '',
      direccion: '',
      numero: '',
      departamento: '',
      provincia: '',
      distrito: '',
      dptoOficinaCasa: '',
      telefono: '',
      esPrincipal: false,
      activa: true
    };
  }
}