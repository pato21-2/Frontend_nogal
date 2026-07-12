import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido';

@Component({
  selector: 'app-gestion-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gestion-pedidos.component.html',
  styleUrls: ['./gestion-pedidos.component.css']
})
export class GestionPedidosComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private router = inject(Router);
  private modalService = inject(NgbModal);

  // Listas
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  pedidoSeleccionado: Pedido | null = null;
  reporteSeleccionado: any = null; // ✅ NUEVO: Para almacenar el reporte


  // Filtros
  filtroEstado: string = '';
  filtroBusqueda: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

  // Estados
  cargando: boolean = true;
  actualizandoEstado: boolean = false;
    cargandoReporte: boolean = false; // ✅ NUEVO: Para carga de reportes


  // Estados disponibles para el logístico
  estadosLogistico = [
    { valor: 'PENDIENTE', label: 'Pendiente', clase: 'badge-pendiente' },
    { valor: 'PROCESANDO', label: 'Procesando', clase: 'badge-procesando' },
    { valor: 'ENVIADO', label: 'Enviado', clase: 'badge-enviado' },
    { valor: 'ENTREGADO', label: 'Entregado', clase: 'badge-entregado' },
    { valor: 'CANCELADO', label: 'Cancelado', clase: 'badge-cancelado' }
  ];

  ngOnInit() {
    this.cargarTodosLosPedidos();
  }

  // Cargar TODOS los pedidos (sin filtrar por usuario)
  cargarTodosLosPedidos() {
    this.cargando = true;

    // Necesitarás crear este método en el PedidoService
    this.pedidoService.obtenerTodosLosPedidos().subscribe({
      next: (pedidos) => {
        console.log('✅ Pedidos cargados:', pedidos);
        this.pedidos = pedidos;
        this.pedidosFiltrados = pedidos;
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando pedidos:', err);
        this.pedidos = [];
        this.pedidosFiltrados = [];
        this.cargando = false;
        alert('Error al cargar pedidos: ' + err);
      }
    });
  }

  // Aplicar filtros
  aplicarFiltros() {
    this.pedidosFiltrados = this.pedidos.filter(pedido => {
      // Filtro por estado
      const coincideEstado = !this.filtroEstado || pedido.estado === this.filtroEstado;
      
      // Filtro por búsqueda (número de pedido o cliente)
      const coincideBusqueda = !this.filtroBusqueda || 
        pedido.numeroPedido?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        pedido.usuario.nombres.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
        pedido.usuario.apellidos.toLowerCase().includes(this.filtroBusqueda.toLowerCase());
      
      // Filtro por fecha
      let coincideFecha = true;
      if (this.filtroFechaInicio) {
        const fechaPedido = new Date(pedido.fechaPedido!);
        const fechaInicio = new Date(this.filtroFechaInicio);
        coincideFecha = coincideFecha && fechaPedido >= fechaInicio;
      }
      
      if (this.filtroFechaFin) {
        const fechaPedido = new Date(pedido.fechaPedido!);
        const fechaFin = new Date(this.filtroFechaFin);
        fechaFin.setHours(23, 59, 59, 999); // Incluir todo el día
        coincideFecha = coincideFecha && fechaPedido <= fechaFin;
      }
      
      return coincideEstado && coincideBusqueda && coincideFecha;
    });
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroBusqueda = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.pedidosFiltrados = this.pedidos;
  }

  // Ver detalle del pedido
  verDetalle(pedido: Pedido, modal: any) {
    this.pedidoSeleccionado = pedido;
    this.modalService.open(modal, { size: 'lg' });
  }

  verReporteEntrega(pedido: Pedido, modal: any) {
    this.cargandoReporte = true;
    this.pedidoSeleccionado = pedido;

    this.pedidoService.obtenerReportePorPedido(pedido.id!).subscribe({
      next: (reporte) => {
        console.log('✅ Reporte cargado:', reporte);
        this.reporteSeleccionado = reporte;
        this.cargandoReporte = false;
        this.modalService.open(modal, { size: 'lg' });
      },
      error: (err) => {
        console.error('❌ Error cargando reporte:', err);
        this.cargandoReporte = false;
        this.reporteSeleccionado = null;
        
        // Mostrar modal incluso si no hay reporte, con mensaje informativo
        this.modalService.open(modal, { size: 'lg' });
      }
    });
  }

  // ✅ NUEVO: Verificar si un pedido tiene reporte
  tieneReporte(pedido: Pedido): boolean {
    // Por ahora, asumimos que los pedidos ENTREGADOS pueden tener reporte
    // En una implementación real, verificarías si existe un reporte en el backend
    return pedido.estado === 'ENTREGADO';
  }

  // ✅ NUEVO: Formatear fecha para reportes
  formatearFechaReporte(fecha: string): string {
    if (!fecha) return 'No registrada';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Cambiar estado del pedido
  cambiarEstado(pedido: Pedido, nuevoEstado: string) {
    const mensaje = `¿Cambiar estado del pedido ${pedido.numeroPedido} a "${nuevoEstado}"?`;
    
    if (confirm(mensaje)) {
      this.actualizandoEstado = true;

      this.pedidoService.actualizarEstado(pedido.id!, nuevoEstado).subscribe({
        next: (pedidoActualizado) => {
          console.log('✅ Estado actualizado:', pedidoActualizado);
          this.actualizandoEstado = false;
          
          // Actualizar el pedido en la lista
          const index = this.pedidos.findIndex(p => p.id === pedido.id);
          if (index !== -1) {
            this.pedidos[index] = pedidoActualizado;
          }
          
          // Re-aplicar filtros
          this.aplicarFiltros();
          
          alert(`✅ Estado cambiado a: ${nuevoEstado}`);
        },
        error: (err) => {
          console.error('❌ Error cambiando estado:', err);
          this.actualizandoEstado = false;
          alert('❌ Error al cambiar estado: ' + err);
        }
      });
    }
  }

  // Obtener opciones de estado según el estado actual
  getOpcionesEstado(estadoActual: string): any[] {
  const opciones: {[key: string]: any[]} = {
    'PENDIENTE': [
      { 
        valor: 'PROCESANDO', 
        label: 'Marcar como Procesando', 
        clase: 'btn-warning',
        icono: 'bi-arrow-right'
      }
    ],
    'PROCESANDO': [
      { 
        valor: 'ENVIADO', 
        label: 'Marcar como Enviado', 
        clase: 'btn-info',
        icono: 'bi-truck'
      }
    ],
    'ENVIADO': [
      { 
        valor: 'ENTREGADO', 
        label: 'Marcar como Entregado', 
        clase: 'btn-success',
        icono: 'bi-check-circle'
      }
    ],
    'ENTREGADO': [],
    'CANCELADO': []
  };
    return opciones[estadoActual] || [];
  }

  // Obtener clase CSS según estado
  getClaseEstado(estado: string): string {
    const clases: {[key: string]: string} = {
      'PENDIENTE': 'badge-pendiente',
      'PROCESANDO': 'badge-procesando',
      'ENVIADO': 'badge-enviado',
      'ENTREGADO': 'badge-entregado',
      'CANCELADO': 'badge-cancelado'
    };
    return clases[estado] || 'badge-pendiente';
  }

  // Obtener total de productos en un pedido
  getTotalProductos(pedido: Pedido): number {
    return pedido.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
  }

  // Formatear fecha
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Navegar al panel logístico
  volverAlPanel() {
    this.router.navigate(['/panel-logistico']);
  }
}