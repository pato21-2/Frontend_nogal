import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { InventarioService } from '../../services/logistico/inventario.service';
import { ProductoService } from '../../services/logistico/producto.service';

@Component({
  selector: 'app-panel-logistico',
  imports: [CommonModule, RouterModule],
  templateUrl: './panel-logistico.component.html',
  styleUrl: './panel-logistico.component.css'
})
export class PanelLogisticoComponent {
  private inventarioService = inject(InventarioService);
  private productoService = inject(ProductoService);
  private router = inject(Router);

  // Estadísticas
  totalProductos: number = 0;
  productosStockBajo: number = 0;
  totalIngresosMes: number = 0;
  ingresosPendientes: number = 0;

  // Productos con stock bajo
  productosBajoStock: any[] = [];

  constructor() {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    // Cargar total de productos
    this.productoService.listarProductos().subscribe({
      next: (productos) => {
        this.totalProductos = productos.length;
      }
    });

    // Cargar productos con stock bajo
    this.productoService.listarProductosStockBajo().subscribe({
      next: (productos) => {
        this.productosStockBajo = productos.length;
        this.productosBajoStock = productos.slice(0, 5); // Mostrar solo 5
      }
    });

    // Cargar ingresos del mes (simulado por ahora)
    const hoy = new Date();
    this.inventarioService.obtenerEstadisticasMensuales(hoy.getFullYear(), hoy.getMonth() + 1)
      .subscribe({
        next: (total) => {
          this.totalIngresosMes = total || 0;
        }
      });

    // Cargar ingresos pendientes de pago
    this.inventarioService.listarIngresosPendientesPago().subscribe({
      next: (ingresos) => {
        this.ingresosPendientes = ingresos.length;
      }
    });
  }

  navegarA(ruta: string) {
    this.router.navigate([ruta]);
  }

  cerrarSesion() {
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}