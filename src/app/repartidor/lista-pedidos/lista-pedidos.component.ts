import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ✅ IMPORTAR ReporteEntregaComponent
import { ReporteEntregaComponent } from '../reporte-entrega/reporte-entrega.component';

import { RepartidorService, Pedido } from '../../services/repartidor.service';

@Component({
  selector: 'app-lista-pedidos',
  standalone: true, // ✅ CONVERTIR A STANDALONE
  imports: [
    CommonModule, 
    FormsModule,
    ReporteEntregaComponent // ✅ IMPORTAR COMPONENTE HIJO
  ],
  templateUrl: './lista-pedidos.component.html',
  styleUrls: ['./lista-pedidos.component.css']
})
export class ListaPedidosComponent implements OnInit {
  @Input() pedidos: Pedido[] = [];
  @Input() repartidor: any;
  @Output() reporteCreado = new EventEmitter<void>();
  
  pedidoSeleccionado: Pedido | null = null;
  filtroEstado: string = 'todos';

  constructor(private repartidorService: RepartidorService) {}

  ngOnInit() {
    console.log('🎯 ListaPedidosComponent INICIALIZADO');
    console.log('📦 Pedidos recibidos:', this.pedidos);
    console.log('👤 Repartidor:', this.repartidor);
  }

  get pedidosFiltrados(): Pedido[] {
    if (this.filtroEstado === 'todos') {
      return this.pedidos;
    }
    return this.pedidos.filter(pedido => pedido.estado === this.filtroEstado);
  }

  seleccionarPedido(pedido: Pedido) {
    this.pedidoSeleccionado = this.pedidoSeleccionado?.id === pedido.id ? null : pedido;
  }

  onReporteCreado() {
    this.reporteCreado.emit();
    this.pedidoSeleccionado = null;
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case 'ENVIADO':
        return 'badge-warning';
      case 'ENTREGADO':
        return 'badge-success';
      case 'CANCELADO':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'PENDIENTE': 'Pendiente',
      'PROCESANDO': 'Procesando',
      'ENVIADO': 'Listo para entregar',
      'ENTREGADO': 'Entregado',
      'CANCELADO': 'Cancelado'
    };
    return estados[estado] || estado;
  }
}