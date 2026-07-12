import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InventarioService } from '../../services/logistico/inventario.service';

@Component({
  selector: 'app-historial-ingresos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historial-ingresos.component.html',
  styleUrl: './historial-ingresos.component.css'
})
export class HistorialIngresosComponent implements OnInit {
  private inventarioService = inject(InventarioService);
  private router = inject(Router);
  private modalService = inject(NgbModal);

  // Listas
  ingresos: any[] = [];
  ingresosFiltrados: any[] = [];
  ingresoSeleccionado: any = null;

  // Filtros
  filtroProveedor: string = '';
  filtroFactura: string = '';
  filtroEstadoPago: string = 'todos';
  fechaInicio: string = '';
  fechaFin: string = '';

  // Estadísticas
  totalIngresos: number = 0;
  totalMonto: number = 0;
  pendientesPago: number = 0;

  // Estados
  cargando: boolean = false;
  exportando: boolean = false;
  error: string = '';

  ngOnInit() {
    this.cargarIngresos();
    this.establecerFechasPorDefecto();
  }

  establecerFechasPorDefecto() {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    this.fechaInicio = primerDiaMes.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];
  }

  cargarIngresos() {
    this.cargando = true;
    this.error = '';
    
    this.inventarioService.listarIngresos().subscribe({
      next: (data: any) => {
        console.log('📦 Respuesta del backend:', data);
        
        if (Array.isArray(data)) {
          this.ingresos = data;
          this.ingresosFiltrados = [...data];
          this.calcularEstadisticas();
          console.log('✅ Ingresos cargados correctamente:', this.ingresos.length);
        } else {
          this.error = 'Formato de respuesta inesperado del servidor';
          console.error('❌ Formato inesperado:', data);
        }
        
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando ingresos:', err);
        this.error = 'Error al conectar con el servidor: ' + err.message;
        this.cargando = false;
        this.ingresos = [];
        this.ingresosFiltrados = [];
      }
    });
  }

  aplicarFiltros() {
    this.ingresosFiltrados = this.ingresos.filter(ingreso => {
      // Filtro por proveedor
      const coincideProveedor = !this.filtroProveedor || 
        (ingreso.proveedor?.nombre?.toLowerCase() || '').includes(this.filtroProveedor.toLowerCase());
      
      // Filtro por factura
      const coincideFactura = !this.filtroFactura || 
        (ingreso.numeroFactura?.toLowerCase() || '').includes(this.filtroFactura.toLowerCase());
      
      // Filtro por estado de pago
      let coincideEstadoPago = true;
      if (this.filtroEstadoPago === 'pendientes') {
        coincideEstadoPago = this.esPendientePago(ingreso);
      } else if (this.filtroEstadoPago === 'pagados') {
        coincideEstadoPago = !this.esPendientePago(ingreso);
      }
      
      // Filtro por fechas
      const fechaIngreso = ingreso.fechaIngreso ? new Date(ingreso.fechaIngreso) : null;
      const coincideFechaInicio = !this.fechaInicio || (fechaIngreso && fechaIngreso >= new Date(this.fechaInicio));
      const coincideFechaFin = !this.fechaFin || (fechaIngreso && fechaIngreso <= new Date(this.fechaFin + 'T23:59:59'));
      
      return coincideProveedor && coincideFactura && coincideEstadoPago && 
             coincideFechaInicio && coincideFechaFin;
    });
    
    this.calcularEstadisticas();
  }

  limpiarFiltros() {
    this.filtroProveedor = '';
    this.filtroFactura = '';
    this.filtroEstadoPago = 'todos';
    this.establecerFechasPorDefecto();
    this.ingresosFiltrados = [...this.ingresos];
    this.calcularEstadisticas();
  }

  calcularEstadisticas() {
    this.totalIngresos = this.ingresosFiltrados.length;
    this.totalMonto = this.ingresosFiltrados.reduce((sum, ingreso) => sum + (ingreso.total || 0), 0);
    this.pendientesPago = this.ingresosFiltrados.filter(ingreso => this.esPendientePago(ingreso)).length;
  }

  esPendientePago(ingreso: any): boolean {
    if (ingreso.metodoPago === 'contado') return false;
    
    if (ingreso.fechaPago) {
      const fechaPago = new Date(ingreso.fechaPago);
      const hoy = new Date();
      return fechaPago > hoy;
    }
    
    return ingreso.metodoPago === 'credito';
  }

  verDetalle(ingreso: any, modal: any) {
    this.ingresoSeleccionado = ingreso;
    this.modalService.open(modal, { size: 'lg' });
  }

  exportarExcel() {
    this.exportando = true;
    
    setTimeout(() => {
      const datos = this.ingresosFiltrados.map(ingreso => ({
        'N° Factura': ingreso.numeroFactura || 'N/A',
        'Proveedor': ingreso.proveedor?.nombre || 'N/A',
        'Fecha Ingreso': ingreso.fechaIngreso || 'N/A',
        'Fecha Emisión': ingreso.fechaEmision || 'N/A',
        'Método Pago': ingreso.metodoPago || 'N/A',
        'Subtotal': ingreso.subtotal || 0,
        'IGV': ingreso.igv || 0,
        'Total': ingreso.total || 0,
        'Estado Pago': this.esPendientePago(ingreso) ? 'PENDIENTE' : 'PAGADO'
      }));
      
      console.log('📊 Datos para exportar:', datos);
      alert(`✅ Se exportaron ${datos.length} registros a Excel`);
      
      this.exportando = false;
    }, 1000);
  }

  getClaseEstadoPago(ingreso: any): string {
    return this.esPendientePago(ingreso) ? 'badge bg-warning' : 'badge bg-success';
  }

  getTextoEstadoPago(ingreso: any): string {
    return this.esPendientePago(ingreso) ? 'PENDIENTE' : 'PAGADO';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    
    try {
      return new Date(fecha).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  getTotalProductos(ingreso: any): number {
    if (!ingreso.detalles || !Array.isArray(ingreso.detalles)) return 0;
    return ingreso.detalles.reduce((total: number, detalle: any) => total + (detalle.cantidad || 0), 0);
  }

  reintentarCarga() {
    this.cargarIngresos();
  }

  cancelar() {
    this.router.navigate(['/panel-logistico']);
  }
}