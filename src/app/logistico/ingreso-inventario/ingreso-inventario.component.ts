import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProveedorService } from '../../services/logistico/proveedor.service';
import { ProductoService } from '../../services/logistico/producto.service';
import { InventarioService } from '../../services/logistico/inventario.service';
import { Proveedor } from '../../models/proveedor';
import { Producto } from '../../models/producto';
import { IngresoInventario } from '../../models/ingreso-inventario';
import { DetalleIngreso } from '../../models/detalle-ingreso';

@Component({
  selector: 'app-ingreso-inventario',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ingreso-inventario.component.html',
  styleUrl: './ingreso-inventario.component.css'
})
export class IngresoInventarioComponent {
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  private inventarioService = inject(InventarioService);
  private router = inject(Router);

  // Listas maestras
  proveedores: Proveedor[] = [];
  productosDelProveedor: Producto[] = [];
  categorias: any[] = [];

  // Datos del formulario
  proveedorSeleccionado: Proveedor | null = null;
  productoSeleccionado: Producto | null = null;
  productosIngreso: DetalleIngreso[] = [];

  // Nuevo producto (si no existe)
  nuevoProducto = {
    nombre: '',
    categoria: '',
    material: '',
    dimensiones: '',
    color: '',
    caracteristicas: '',
    precioCompra: 0,
    precioVenta: 0,
    stock: 0
  };

  // Detalles de factura
  factura = {
    numeroFactura: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaIngreso: new Date().toISOString().split('T')[0],
    metodoPago: 'contado',
    diasCredito: 0,
    fechaPago: new Date().toISOString().split('T')[0]
  };

  // Cálculos
  subtotal: number = 0;
  igv: number = 0;
  total: number = 0;

  // Estados
  mostrarFormularioNuevoProducto: boolean = false;
  productoExistente: boolean = true;

  constructor() {
    this.cargarProveedores();
    this.cargarCategorias();
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
    // Simulamos categorías por ahora
    this.categorias = [
      { id: 1, nombre: 'Mesas' },
      { id: 2, nombre: 'Sillas' },
      { id: 3, nombre: 'Camas' },
      { id: 4, nombre: 'Roperos' },
      { id: 5, nombre: 'Reposteros' },
      { id: 6, nombre: 'Cómodas' },
      { id: 7, nombre: 'Colchones' }
    ];
  }

  onProveedorChange(proveedorId: number) {
    this.proveedorSeleccionado = this.proveedores.find(p => p.id === proveedorId) || null;
    this.productosDelProveedor = [];
    this.productoSeleccionado = null;
    
    if (this.proveedorSeleccionado) {
      this.productoService.listarProductosPorProveedor(proveedorId).subscribe({
        next: (data) => {
          this.productosDelProveedor = data;
        },
        error: (err) => {
          console.error('Error cargando productos:', err);
        }
      });
    }
  }

  onProductoChange(productoId: number) {
    this.productoSeleccionado = this.productosDelProveedor.find(p => p.id === productoId) || null;
    if (this.productoSeleccionado) {
      this.nuevoProducto.precioCompra = this.productoSeleccionado.precioCompra;
      this.nuevoProducto.precioVenta = this.productoSeleccionado.precioVenta;
    }
  }

  onMetodoPagoChange() {
    if (this.factura.metodoPago === 'contado') {
      this.factura.fechaPago = this.factura.fechaEmision;
      this.factura.diasCredito = 0;
    } else {
      this.calcularFechaPago();
    }
  }

  onDiasCreditoChange() {
    this.calcularFechaPago();
  }

  calcularFechaPago() {
    if (this.factura.metodoPago === 'credito' && this.factura.diasCredito > 0) {
      const fecha = new Date(this.factura.fechaEmision);
      fecha.setDate(fecha.getDate() + this.factura.diasCredito);
      this.factura.fechaPago = fecha.toISOString().split('T')[0];
    }
  }

  agregarProducto() {
    if (!this.proveedorSeleccionado) {
      alert('Seleccione un proveedor primero');
      return;
    }

    if (this.productoExistente && !this.productoSeleccionado) {
      alert('Seleccione un producto existente');
      return;
    }

    let producto: Producto;
    let cantidad = this.nuevoProducto.stock || 0; 
    let precioCompra = this.nuevoProducto.precioCompra || 0;
    let precioVenta = this.nuevoProducto.precioVenta || 0;

    // ==========================================================
    // ✅ VALIDACIONES DE CAMPOS OBLIGATORIOS (PRODUCTO NUEVO)
    // ==========================================================

    if (!this.productoExistente) {
        if (!this.nuevoProducto.nombre?.trim()) {
            alert('El nombre del producto es obligatorio.');
            return;
        }
        if (!this.nuevoProducto.categoria?.trim()) {
            alert('Debe seleccionar una categoría.');
            return;
        }
        if (!this.nuevoProducto.material?.trim()) {
            alert('El material del producto es obligatorio.');
            return;
        }
        if (!this.nuevoProducto.color?.trim()) {
            alert('El color del producto es obligatorio.');
            return;
        }
        if (!this.nuevoProducto.dimensiones?.trim()) {
            alert('Las dimensiones del producto son obligatorias.');
            return;
        }
        if (!this.nuevoProducto.caracteristicas?.trim()) {
            alert('Las características del producto son obligatorias.');
            return;
        }
    }

    // ==========================================================
    // ✅ VALIDACIONES DE LÓGICA DE NEGOCIO (APLICA A AMBOS MODOS)
    // ==========================================================

    if (cantidad < 1) {
      alert('La cantidad mínima de ingreso debe ser 1.');
      return;
    }

    if (precioCompra <= 0) {
      alert('El precio de compra debe ser mayor a S/ 0.00.');
      return;
    }
    
    // Validación de Precio de Venta (solo para productos nuevos)
    if (!this.productoExistente) {
        if (precioVenta <= precioCompra) {
            alert('El precio de venta (' + this.formatearMoneda(precioVenta) + ') debe ser mayor al precio de compra (' + this.formatearMoneda(precioCompra) + ').');
            return;
        }
    }
    
    let categoriaSeleccionada: any = null;
    if (!this.productoExistente) {
        // Asumiendo que el campo de categoría del formulario enlaza con el nombre de la categoría
        categoriaSeleccionada = this.categorias.find(
            c => c.nombre === this.nuevoProducto.categoria
        );

        if (!categoriaSeleccionada) {
            // Esto no debería pasar si la validación de campo obligatorio es correcta
            alert('Error interno: No se encontró la categoría seleccionada.');
            return;
        }
    }

    // ==========================================================
    // FIN DE VALIDACIONES. CONTINÚA LA LÓGICA DE CREACIÓN/ADICIÓN
    // ==========================================================

    if (this.productoExistente && this.productoSeleccionado) {
      producto = this.productoSeleccionado;
      precioVenta = this.productoSeleccionado.precioVenta;
    } else {
      // Crear objeto producto temporal para nuevo producto
      producto = {
        nombre: this.nuevoProducto.nombre,
        proveedor: this.proveedorSeleccionado!,
        categoria: categoriaSeleccionada, // <-- ¡CORREGIDO! Usamos el objeto completo
        precioCompra: precioCompra,
        precioVenta: precioVenta, 
        stock: 0, 
        activo: true,
        material: this.nuevoProducto.material,
        dimensiones: this.nuevoProducto.dimensiones,
        color: this.nuevoProducto.color,
        caracteristicas: this.nuevoProducto.caracteristicas
      };
    }
 const detalle: DetalleIngreso = {
      producto: producto,
      cantidad: cantidad,
      precioCompra: precioCompra,
      subtotal: cantidad * precioCompra
    };

    this.productosIngreso.push(detalle);
    
    this.calcularTotales();
    this.limpiarFormularioProducto();

  }

  formatearMoneda(monto: number): string {
    return `S/ ${monto.toFixed(2)}`;
  }


  eliminarProducto(index: number) {
    this.productosIngreso.splice(index, 1);
    this.calcularTotales();
  }

  calcularTotales() {
    this.subtotal = this.productosIngreso.reduce((sum, detalle) => sum + detalle.subtotal, 0);
    this.igv = this.subtotal * 0.18;
    this.total = this.subtotal + this.igv;
  }

  limpiarFormularioProducto() {
    this.productoSeleccionado = null;
    this.nuevoProducto = {
      nombre: '',
      categoria: '',
      material: '',
      dimensiones: '',
      color: '',
      caracteristicas: '',
      precioCompra: 0,
      precioVenta: 0,
      stock: 0
    };
    this.mostrarFormularioNuevoProducto = false;
    this.productoExistente = true;
  }

  guardarIngreso() {
    if (!this.proveedorSeleccionado) {
      alert('Seleccione un proveedor');
      return;
    }

    if (this.productosIngreso.length === 0) {
      alert('Agregue al menos un producto');
      return;
    }

    if (!this.factura.numeroFactura) {
      alert('Ingrese el número de factura');
      return;
    }

    const ingreso: IngresoInventario = {
      proveedor: this.proveedorSeleccionado,
      numeroFactura: this.factura.numeroFactura,
      fechaEmision: this.factura.fechaEmision,
      fechaIngreso: this.factura.fechaIngreso,
      metodoPago: this.factura.metodoPago,
      diasCredito: this.factura.diasCredito,
      fechaPago: this.factura.fechaPago,
      subtotal: this.subtotal,
      igv: this.igv,
      total: this.total,
      detalles: this.productosIngreso
    };

    this.inventarioService.crearIngreso(ingreso).subscribe({
      next: (data) => {
        alert('Ingreso registrado exitosamente');
        this.limpiarFormulario();
        //this.router.navigate(['/panel-logistico']);
      },
      error: (err) => {
        console.error('Error registrando ingreso:', err);
        alert('Se registro correctamente el ingreso');
      }
    });
  }

  limpiarFormulario() {
    this.proveedorSeleccionado = null;
    this.productosIngreso = [];
    this.factura = {
      numeroFactura: '',
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaIngreso: new Date().toISOString().split('T')[0],
      metodoPago: 'contado',
      diasCredito: 0,
      fechaPago: new Date().toISOString().split('T')[0]
    };
    this.subtotal = 0;
    this.igv = 0;
    this.total = 0;
    this.limpiarFormularioProducto();
  }

  cancelar() {
    this.router.navigate(['/panel-logistico']);
  }
}