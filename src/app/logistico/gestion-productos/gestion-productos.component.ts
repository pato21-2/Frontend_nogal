import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductoService } from '../../services/logistico/producto.service';
import { ProveedorService } from '../../services/logistico/proveedor.service';
import { Producto } from '../../models/producto';
import { Proveedor } from '../../models/proveedor';
import { Categoria } from '../../models/categoria';

@Component({
  selector: 'app-gestion-productos',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gestion-productos.component.html',
  styleUrl: './gestion-productos.component.css'
})
export class GestionProductosComponent implements OnInit {
  private productoService = inject(ProductoService);
  private proveedorService = inject(ProveedorService);
  private router = inject(Router);
  private modalService = inject(NgbModal);

  // Listas maestras
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  proveedores: Proveedor[] = [];
  categorias: Categoria[] = [];

  // Producto en edición/creación
  productoEdicion: Producto = this.limpiarProducto();
  esEdicion: boolean = false;

  // Filtros
  filtroNombre: string = '';
  filtroCategoria: string = '';
  filtroProveedor: string = '';
  filtroStock: string = 'todos';

  // Estados
  cargando: boolean = false;
  vista: 'lista' | 'grid' = 'lista';

  ngOnInit() {
    this.cargarProductos();
    this.cargarProveedores();
    this.cargarCategorias();
  }
  compareByFn(obj1: any, obj2: any): boolean {
        // Esta función compara dos objetos por su 'id'. 
        // Es esencial para que Angular sepa qué objeto de la lista enlazar
        // con la propiedad productoEdicion.categoria.
        if (obj1 && obj2) {
            return obj1.id === obj2.id;
        }
        return false;
    }

  cargarProductos() {
    this.cargando = true;
    this.productoService.listarProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.productosFiltrados = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        alert('Error al cargar productos: ' + err);
        this.cargando = false;
      }
    });
  }

  cargarProveedores() {
    this.proveedorService.listarProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
      },
      error: (err) => {
        console.error('Error cargando proveedores:', err);
      }
    });
  }

  cargarCategorias() {
    // Categorías predefinidas basadas en tus proveedores
    this.categorias = [
      { id: 1, nombre: 'Mesas', descripcion: 'Mesas de diferentes materiales' },
      { id: 2, nombre: 'Sillas', descripcion: 'Sillas para diferentes usos' },
      { id: 3, nombre: 'Camas', descripcion: 'Camas y box de diferentes plazas' },
      { id: 4, nombre: 'Roperos', descripcion: 'Roperos de melamina' },
      { id: 5, nombre: 'Reposteros', descripcion: 'Reposteros de diferentes tamaños' },
      { id: 6, nombre: 'Cómodas', descripcion: 'Cómodas con y sin espejo' },
      { id: 7, nombre: 'Colchones', descripcion: 'Colchones ortopédicos y de espuma' },
      { id: 8, nombre: 'Banquetas', descripcion: 'Banquetas y banquitos' },
      { id: 9, nombre: 'Tocadores', descripcion: 'Tocadores de melamina' },
      { id: 10, nombre: 'Zapateras', descripcion: 'Zapateras organizadoras' }
    ];
  }

  aplicarFiltros() {
    this.productosFiltrados = this.productos.filter(producto => {
      const coincideNombre = !this.filtroNombre || 
        producto.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());
      
      const coincideCategoria = !this.filtroCategoria || 
        producto.categoria.nombre.toLowerCase().includes(this.filtroCategoria.toLowerCase());
      
      const coincideProveedor = !this.filtroProveedor || 
        producto.proveedor.nombre.toLowerCase().includes(this.filtroProveedor.toLowerCase());
      
      let coincideStock = true;
      if (this.filtroStock === 'bajo') {
        coincideStock = producto.stock < 10;
      } else if (this.filtroStock === 'sin') {
        coincideStock = producto.stock === 0;
      } else if (this.filtroStock === 'suficiente') {
        coincideStock = producto.stock >= 10;
      }
      
      return coincideNombre && coincideCategoria && coincideProveedor && coincideStock;
    });
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroCategoria = '';
    this.filtroProveedor = '';
    this.filtroStock = 'todos';
    this.productosFiltrados = this.productos;
  }

  abrirModalCrear(modal: any) {
    this.productoEdicion = this.limpiarProducto();
    this.esEdicion = false;
    this.modalService.open(modal, { size: 'xl' });
  }

  abrirModalEditar(modal: any, producto: Producto) {
    this.productoEdicion = { ...producto };
    this.esEdicion = true;
    this.modalService.open(modal, { size: 'xl' });
  }

  abrirModalEliminar(modal: any, producto: Producto) {
    this.productoEdicion = { ...producto };
    this.modalService.open(modal);
  }

  abrirModalStock(modal: any, producto: Producto) {
    this.productoEdicion = { ...producto };
    this.modalService.open(modal);
  }

  guardarProducto() {
    if (!this.validarProducto()) {
      return;
    }

    this.cargando = true;

    // Calcular precio de venta si no se especificó (60% margen)
    if (!this.productoEdicion.precioVenta || this.productoEdicion.precioVenta === 0) {
      this.productoEdicion.precioVenta = this.productoEdicion.precioCompra * 1.6;
    }

    if (this.esEdicion) {
      this.productoService.actualizarProducto(this.productoEdicion.id!, this.productoEdicion).subscribe({
        next: (data) => {
          this.cargando = false;
          this.modalService.dismissAll();
          alert('✅ Producto actualizado exitosamente');
          this.cargarProductos();
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error actualizando producto:', err);
          alert('❌ Error al actualizar producto: ' + err);
        }
      });
    } else {
      this.productoService.crearProducto(this.productoEdicion).subscribe({
        next: (data) => {
          this.cargando = false;
          this.modalService.dismissAll();
          alert('✅ Producto creado exitosamente');
          this.cargarProductos();
        },
        error: (err) => {
          this.cargando = false;
          console.error('Error creando producto:', err);
          alert('❌ Error al crear producto: ' + err);
        }
      });
    }
  }

  actualizarStock() {
    if (!this.productoEdicion.id) return;

    this.cargando = true;
    this.productoService.actualizarStock(this.productoEdicion.id, this.productoEdicion.stock).subscribe({
      next: (data) => {
        this.cargando = false;
        this.modalService.dismissAll();
        alert('✅ Stock actualizado exitosamente');
        this.cargarProductos();
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error actualizando stock:', err);
        alert('❌ Error al actualizar stock: ' + err);
      }
    });
  }

  eliminarProducto() {
    if (!this.productoEdicion.id) return;

    this.cargando = true;
    this.productoService.eliminarProducto(this.productoEdicion.id).subscribe({
      next: (data) => {
        this.cargando = false;
        this.modalService.dismissAll();
        alert('✅ Producto eliminado exitosamente');
        this.cargarProductos();
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error eliminando producto:', err);
        alert('❌ Error al eliminar producto: ' + err);
      }
    });
  }

  validarProducto(): boolean {
    if (!this.productoEdicion.nombre?.trim()) {
      alert('El nombre del producto es obligatorio');
      return false;
    }

    if (!this.productoEdicion.proveedor?.id) {
      alert('Debe seleccionar un proveedor');
      return false;
    }

    if (!this.productoEdicion.categoria?.nombre) {
      alert('Debe seleccionar una categoría');
      return false;
    }

    if (!this.productoEdicion.precioCompra || this.productoEdicion.precioCompra <= 0) {
      alert('El precio de compra debe ser mayor a 0');
      return false;
    }

    if (!this.productoEdicion.precioVenta || this.productoEdicion.precioVenta <= 0) {
      alert('El precio de venta debe ser mayor a 0');
      return false;
    }

    if (this.productoEdicion.stock < 0) {
      alert('El stock no puede ser negativo');
      return false;
    }

    return true;
  }

  limpiarProducto(): Producto {
    return {
      nombre: '',
      proveedor: { id: 0, nombre: '', materialEspecialidad: '', activo: true },
      categoria: { id: 0, nombre: '', descripcion: '' },
      descripcion: '',
      material: '',
      dimensiones: '',
      color: '',
      caracteristicas: '',
      precioCompra: 0,
      precioVenta: 0,
      stock: 0,
      imagenUrl: '',
      activo: true
    };
  }

  cambiarVista(tipo: 'lista' | 'grid') {
    this.vista = tipo;
  }

  getClaseStock(stock: number): string {
    if (stock === 0) return 'bg-danger';
    if (stock < 10) return 'bg-warning';
    return 'bg-success';
  }

  getTextoStock(stock: number): string {
    if (stock === 0) return 'Sin Stock';
    if (stock < 10) return 'Stock Bajo';
    return 'En Stock';
  }

  cancelar() {
    this.router.navigate(['/panel-logistico']);
  }
}