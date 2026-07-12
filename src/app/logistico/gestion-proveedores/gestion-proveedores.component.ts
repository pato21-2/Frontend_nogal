import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProveedorService } from '../../services/logistico/proveedor.service';
import { Proveedor } from '../../models/proveedor';

@Component({
  selector: 'app-gestion-proveedores',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gestion-proveedores.component.html',
  styleUrl: './gestion-proveedores.component.css'
})
export class GestionProveedoresComponent {
  private proveedorService = inject(ProveedorService);
  private router = inject(Router);
  private modalService = inject(NgbModal);

  // Lista de proveedores
  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];

  // Proveedor en edición/creación
  proveedorEdicion: Proveedor = this.limpiarProveedor();
  esEdicion: boolean = false;

  // Filtros
  filtroNombre: string = '';
  filtroMaterial: string = '';

  // Estados
  cargando: boolean = false;

  constructor() {
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.cargando = true;
    this.proveedorService.listarProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
        this.proveedoresFiltrados = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando proveedores:', err);
        alert('Error al cargar proveedores: ' + err);
        this.cargando = false;
      }
    });
  }

  aplicarFiltros() {
    this.proveedoresFiltrados = this.proveedores.filter(proveedor => {
      const coincideNombre = !this.filtroNombre || 
        proveedor.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());
      const coincideMaterial = !this.filtroMaterial || 
        proveedor.materialEspecialidad.toLowerCase().includes(this.filtroMaterial.toLowerCase());
      
      return coincideNombre && coincideMaterial;
    });
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroMaterial = '';
    this.proveedoresFiltrados = this.proveedores;
  }

  abrirModalCrear(modal: any) {
    this.proveedorEdicion = this.limpiarProveedor();
    this.esEdicion = false;
    this.modalService.open(modal, { size: 'lg' });
  }

  abrirModalEditar(modal: any, proveedor: Proveedor) {
    this.proveedorEdicion = { ...proveedor };
    this.esEdicion = true;
    this.modalService.open(modal, { size: 'lg' });
  }

  abrirModalEliminar(modal: any, proveedor: Proveedor) {
    this.proveedorEdicion = { ...proveedor };
    this.modalService.open(modal);
  }

  guardarProveedor() {
    if (!this.validarProveedor()) {
      return;
    }

    this.cargando = true;

    if (this.esEdicion) {
      // Editar proveedor existente
      this.proveedorService.actualizarProveedor(this.proveedorEdicion.id!, this.proveedorEdicion).subscribe({
        next: (data) => {
          this.cargando = false;
          this.modalService.dismissAll();
          alert('✅ Proveedor actualizado exitosamente');
          this.cargarProveedores();
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error actualizando proveedor:', err);
          alert('❌ Error al actualizar proveedor: ' + err);
        }
      });
    } else {
      // Crear nuevo proveedor
      this.proveedorService.crearProveedor(this.proveedorEdicion).subscribe({
        next: (data) => {
          this.cargando = false;
          this.modalService.dismissAll();
          alert('✅ Proveedor creado exitosamente');
          this.cargarProveedores();
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error creando proveedor:', err);
          alert('❌ Error al crear proveedor: ' + err);
        }
      });
    }
  }

  eliminarProveedor() {
    if (!this.proveedorEdicion.id) return;

    this.cargando = true;
    this.proveedorService.eliminarProveedor(this.proveedorEdicion.id).subscribe({
      next: (data) => {
        this.cargando = false;
        this.modalService.dismissAll();
        alert('✅ Proveedor eliminado exitosamente');
        this.cargarProveedores();
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error eliminando proveedor:', err);
        alert('❌ Error al eliminar proveedor: ' + err);
      }
    });
  }

  validarProveedor(): boolean {
    if (!this.proveedorEdicion.nombre?.trim()) {
      alert('El nombre del proveedor es obligatorio');
      return false;
    }

    if (!this.proveedorEdicion.materialEspecialidad?.trim()) {
      alert('La especialidad de material es obligatoria');
      return false;
    }

    // Validar RUC si está presente
    if (this.proveedorEdicion.ruc && !this.validarRUC(this.proveedorEdicion.ruc)) {
      alert('El RUC debe tener 11 dígitos');
      return false;
    }

    // Validar teléfono si está presente
    if (this.proveedorEdicion.telefono && !this.validarTelefono(this.proveedorEdicion.telefono)) {
      alert('El teléfono debe tener 9 dígitos y empezar con 9');
      return false;
    }

    // Validar email si está presente
    if (this.proveedorEdicion.email && !this.validarEmail(this.proveedorEdicion.email)) {
      alert('El email no tiene un formato válido');
      return false;
    }

    return true;
  }

  validarRUC(ruc: string): boolean {
    return /^\d{11}$/.test(ruc);
  }

  validarTelefono(telefono: string): boolean {
    return /^9\d{8}$/.test(telefono);
  }

  validarEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  limpiarProveedor(): Proveedor {
    return {
      nombre: '',
      ruc: '',
      telefono: '',
      email: '',
      direccion: '',
      contacto: '',
      materialEspecialidad: '',
      activo: true
    };
  }

  cancelar() {
    this.router.navigate(['/panel-logistico']);
  }
}