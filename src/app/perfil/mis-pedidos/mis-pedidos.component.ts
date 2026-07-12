import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../models/pedido';
import { Factura } from '../../models/factura';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mis-pedidos.component.html',
  styleUrls: ['./mis-pedidos.component.css']
})
export class MisPedidosComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private router = inject(Router);
  private modalService = inject(NgbModal);

  // Listas
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  pedidoSeleccionado: Pedido | null = null;
  facturaSeleccionada: any = null;

  // Filtros
  filtroEstado: string = '';
  filtroBusqueda: string = '';

  // Estados
  cargando: boolean = true;

  ngOnInit() {
    this.cargarPedidos();
  }

  // Cargar pedidos del usuario
  cargarPedidos() {
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
      console.error('❌ No hay usuario autenticado');
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(usuarioData);
    this.cargando = true;

    this.pedidoService.obtenerPedidosPorUsuario(usuario.id).subscribe({
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
      }
    });
  }

  // Aplicar filtros
  aplicarFiltro() {
    this.pedidosFiltrados = this.pedidos.filter(pedido => {
      // Filtro por estado
      const coincideEstado = !this.filtroEstado || pedido.estado === this.filtroEstado;
      
      // Filtro por búsqueda (número de pedido)
      const coincideBusqueda = !this.filtroBusqueda || 
        pedido.numeroPedido?.toLowerCase().includes(this.filtroBusqueda.toLowerCase());
      
      return coincideEstado && coincideBusqueda;
    });
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroBusqueda = '';
    this.pedidosFiltrados = this.pedidos;
  }

  // Ver detalle del pedido
  verDetalle(pedido: Pedido, modal: any) {
    this.pedidoSeleccionado = pedido;
    this.modalService.open(modal, { size: 'lg' });
  }

  // Cancelar pedido
  cancelarPedido(pedido: Pedido) {
    const mensaje = `¿Estás seguro de que deseas cancelar el pedido ${pedido.numeroPedido}?\n\nEsta acción no se puede deshacer.`;
    
    if (confirm(mensaje)) {
      this.pedidoService.cancelarPedido(pedido.id!).subscribe({
        next: (pedidoActualizado) => {
          console.log('✅ Pedido cancelado:', pedidoActualizado);
          this.mostrarMensaje('✅ Pedido cancelado exitosamente', 'success');
          
          // Actualizar el pedido en la lista
          const index = this.pedidos.findIndex(p => p.id === pedido.id);
          if (index !== -1) {
            this.pedidos[index] = pedidoActualizado;
          }
          
          // Recargar pedidos
          this.cargarPedidos();
        },
        error: (err) => {
          console.error('❌ Error cancelando pedido:', err);
          this.mostrarMensaje('❌ Error al cancelar el pedido: ' + err, 'error');
        }
      });
    }
  }

  // Método para copiar el código al portapapeles
  copiarCodigo(codigo: string): void {
    navigator.clipboard.writeText(codigo).then(() => {
      this.mostrarMensaje('Código copiado: ' + codigo, 'success');
    }).catch(err => {
      console.error('Error al copiar: ', err);
      this.mostrarMensaje('Error al copiar el código', 'error');
    });
  }

  // Método para mostrar mensajes/notificaciones
  mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    // Crear elemento de mensaje
    const mensajeElement = document.createElement('div');
    mensajeElement.className = `alert alert-${tipo === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
    mensajeElement.style.top = '20px';
    mensajeElement.style.right = '20px';
    mensajeElement.style.zIndex = '9999';
    mensajeElement.style.minWidth = '300px';
    
    mensajeElement.innerHTML = `
      <i class="bi ${tipo === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2"></i>
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(mensajeElement);
    
    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
      if (document.body.contains(mensajeElement)) {
        document.body.removeChild(mensajeElement);
      }
    }, 3000);
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
      year: '2-digit'
    });
  }

  // Navegar a la tienda
  irATienda() {
    this.router.navigate(['/principal']);
  }
  verFactura(pedidoId: number) {
  this.pedidoService.obtenerFactura(pedidoId).subscribe({
    next: (factura: Factura) => {
      // ✅ Ya no usamos URL.createObjectURL porque ahora recibimos datos, no un archivo
      this.facturaSeleccionada = factura; 
      if(this.facturaSeleccionada.detalles){
        const totalCalculado = this.facturaSeleccionada.detalles.reduce(
          (acc: number, item: any) => acc + (item.precioUnitario * item.cantidad), 0
        );
        this.facturaSeleccionada.total = totalCalculado;
      }
      console.log('Factura cargada correctamente:', this.facturaSeleccionada);
    },
    error: (err) => {
      console.error('Error al obtener la factura:', err);
      this.mostrarMensaje('No se pudo cargar el comprobante', 'error');
    }
  });
  }
  imprimirFactura() {
    window.print();
  }
}