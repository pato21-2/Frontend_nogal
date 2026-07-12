import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ErpService, InteraccionCliente } from '../../services/erp.service';
import { AuthService } from '../../services/auth.service';

/**
 * CRM del ERP: cartera de clientes con métricas comerciales
 * (CLV, ranking, estado comercial) y vista 360 con línea de tiempo
 * unificada (pedidos, cotizaciones e interacciones registradas).
 */
@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crm.component.html',
  styleUrls: ['./crm.component.css']
})
export class CrmComponent implements OnInit {
  private erp = inject(ErpService);
  private authService = inject(AuthService);

  clientes: any[] = [];
  cargando = true;
  error = '';
  exito = '';
  busqueda = '';
  filtroEstado = '';

  ficha: any = null;
  cargandoFicha = false;

  registrando = false;
  interaccion = { tipo: 'LLAMADA', notas: '', proximaAccion: '' };

  readonly tiposInteraccion = ['LLAMADA', 'VISITA', 'CORREO', 'SEGUIMIENTO', 'OBSERVACION'];

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargando = true;
    this.erp.clientesCrm().subscribe({
      next: (data) => { this.clientes = data; this.cargando = false; },
      error: (e) => { this.error = String(e); this.cargando = false; }
    });
  }

  get clientesFiltrados(): any[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.clientes.filter(c =>
      (!q || String(c.nombre).toLowerCase().includes(q) || String(c.email).toLowerCase().includes(q)) &&
      (!this.filtroEstado || c.estadoComercial === this.filtroEstado)
    );
  }

  abrirFicha(cliente: any): void {
    this.cargandoFicha = true;
    this.ficha = null;
    this.erp.cliente360(cliente.clienteId).subscribe({
      next: (data) => { this.ficha = data; this.cargandoFicha = false; },
      error: (e) => { this.error = String(e); this.cargandoFicha = false; }
    });
  }

  cerrarFicha(): void {
    this.ficha = null;
    this.registrando = false;
  }

  guardarInteraccion(): void {
    if (!this.interaccion.notas.trim()) {
      this.error = 'Este campo es obligatorio: escribe las notas de la interacción.';
      return;
    }
    const usuario = this.authService.getUsuarioActual();
    const cuerpo: InteraccionCliente = {
      cliente: { id: this.ficha.clienteId },
      registradoPor: usuario?.id ? { id: usuario.id } : null,
      tipo: this.interaccion.tipo,
      notas: this.interaccion.notas.trim(),
      proximaAccion: this.interaccion.proximaAccion.trim() || undefined
    };
    this.erp.registrarInteraccion(cuerpo).subscribe({
      next: () => {
        this.exito = 'Interacción registrada en la línea de tiempo del cliente.';
        this.error = '';
        this.registrando = false;
        this.interaccion = { tipo: 'LLAMADA', notas: '', proximaAccion: '' };
        this.abrirFicha({ clienteId: this.ficha.clienteId });
      },
      error: (e) => this.error = String(e)
    });
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'VIP': return 'bg-warning';
      case 'FRECUENTE': return 'bg-success';
      case 'NUEVO': return 'bg-info';
      case 'INACTIVO': return 'bg-danger';
      case 'POTENCIAL': return 'bg-secondary';
      default: return 'bg-primary';
    }
  }

  iconoEvento(tipo: string): string {
    switch (tipo) {
      case 'PEDIDO': return 'bi-cart-check';
      case 'COTIZACION': return 'bi-file-earmark-text';
      case 'LLAMADA': return 'bi-telephone';
      case 'VISITA': return 'bi-geo-alt';
      case 'CORREO': return 'bi-envelope';
      case 'SEGUIMIENTO': return 'bi-flag';
      default: return 'bi-chat-left-text';
    }
  }
}
