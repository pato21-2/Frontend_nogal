import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ErpService, Cotizacion, DetalleCotizacion } from '../../services/erp.service';
import { AdminService } from '../../services/admin.service';
import { ProductoService } from '../../services/logistico/producto.service';
import { DireccionService } from '../../services/direccion.service';
import { TarjetaService } from '../../services/tarjeta.service';

/**
 * Módulo de cotizaciones del ERP: creación con líneas y descuentos,
 * ciclo de vida (enviar/aceptar con firma/rechazar), versionado,
 * conversión a pedido real e impresión del documento (PDF vía navegador).
 */
@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css']
})
export class CotizacionesComponent implements OnInit {
  private erp = inject(ErpService);
  private adminService = inject(AdminService);
  private productoService = inject(ProductoService);
  private direccionService = inject(DireccionService);
  private tarjetaService = inject(TarjetaService);

  cotizaciones: Cotizacion[] = [];
  clientes: any[] = [];
  productos: any[] = [];
  cargando = true;
  error = '';
  exito = '';
  filtroEstado = '';

  // Formulario de nueva cotización
  mostrandoFormulario = false;
  guardando = false;
  nueva: { clienteId: number | null; vigenciaHasta: string; observaciones: string; descuento: number } = this.formularioVacio();
  lineas: { productoId: number | null; cantidad: number; precioUnitario: number; descuentoPct: number }[] = [];

  // Detalle / impresión
  seleccionada: Cotizacion | null = null;

  // Conversión a pedido
  convirtiendo: Cotizacion | null = null;
  direccionesCliente: any[] = [];
  tarjetasCliente: any[] = [];
  conversion = { direccionId: null as number | null, tarjetaId: null as number | null, metodoPago: 'TARJETA' };

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargando = true;
    this.erp.listarCotizaciones().subscribe({
      next: (data) => { this.cotizaciones = data; this.cargando = false; },
      error: (e) => { this.error = String(e); this.cargando = false; }
    });
    this.adminService.obtenerTodosUsuarios().subscribe({
      next: (u) => this.clientes = u.filter(x => (x.rol || '').toLowerCase() === 'cliente'),
      error: () => {}
    });
    this.productoService.listarProductos().subscribe({
      next: (p: any) => this.productos = p,
      error: () => {}
    });
  }

  get cotizacionesFiltradas(): Cotizacion[] {
    return this.filtroEstado
      ? this.cotizaciones.filter(c => c.estado === this.filtroEstado)
      : this.cotizaciones;
  }

  // ===== Creación =====

  abrirFormulario(): void {
    this.nueva = this.formularioVacio();
    this.lineas = [this.lineaVacia()];
    this.mostrandoFormulario = true;
    this.error = '';
    this.exito = '';
  }

  agregarLinea(): void { this.lineas.push(this.lineaVacia()); }
  quitarLinea(i: number): void { this.lineas.splice(i, 1); }

  alSeleccionarProducto(linea: { productoId: number | null; precioUnitario: number }): void {
    const producto = this.productos.find(p => p.id === Number(linea.productoId));
    if (producto) { linea.precioUnitario = Number(producto.precioVenta); }
  }

  get subtotalFormulario(): number {
    return this.lineas.reduce((suma, l) => {
      const bruto = (l.cantidad || 0) * (l.precioUnitario || 0);
      return suma + bruto * (1 - (l.descuentoPct || 0) / 100);
    }, 0);
  }
  get igvFormulario(): number {
    return Math.max(this.subtotalFormulario - (this.nueva.descuento || 0), 0) * 0.18;
  }
  get totalFormulario(): number {
    return Math.max(this.subtotalFormulario - (this.nueva.descuento || 0), 0) + this.igvFormulario;
  }

  guardar(): void {
    this.error = '';
    if (!this.nueva.clienteId) { this.error = 'Selecciona un cliente para la cotización.'; return; }
    const detalles: DetalleCotizacion[] = this.lineas
      .filter(l => l.productoId && l.cantidad > 0)
      .map(l => ({
        producto: { id: Number(l.productoId) },
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
        descuentoPct: Number(l.descuentoPct || 0)
      }));
    if (detalles.length === 0) { this.error = 'Agrega al menos un producto con cantidad válida.'; return; }

    const cotizacion: Cotizacion = {
      cliente: { id: Number(this.nueva.clienteId) },
      vigenciaHasta: this.nueva.vigenciaHasta || undefined,
      observaciones: this.nueva.observaciones,
      descuento: Number(this.nueva.descuento || 0),
      detalles
    };
    this.guardando = true;
    this.erp.crearCotizacion(cotizacion).subscribe({
      next: (creada) => {
        this.guardando = false;
        this.mostrandoFormulario = false;
        this.exito = `Cotización ${creada.numero} creada correctamente.`;
        this.cargarTodo();
      },
      error: (e) => { this.guardando = false; this.error = String(e); }
    });
  }

  // ===== Ciclo de vida =====

  cambiarEstado(cot: Cotizacion, estado: string): void {
    let firmadoPor: string | undefined;
    if (estado === 'ACEPTADA') {
      firmadoPor = window.prompt('Nombre de quien acepta la cotización (firma):',
        `${cot.cliente?.nombres || ''} ${cot.cliente?.apellidos || ''}`.trim()) || undefined;
      if (firmadoPor === undefined) { return; }
    }
    this.erp.cambiarEstadoCotizacion(cot.id!, estado, firmadoPor).subscribe({
      next: () => { this.exito = `Cotización ${cot.numero} → ${estado}.`; this.cargarTodo(); },
      error: (e) => this.error = String(e)
    });
  }

  nuevaVersion(cot: Cotizacion): void {
    if (!confirm(`Se creará la versión ${(cot.version || 1) + 1} de ${cot.numero} y la actual quedará RECHAZADA. ¿Continuar?`)) { return; }
    this.erp.nuevaVersionCotizacion(cot.id!, {}).subscribe({
      next: (v) => { this.exito = `Nueva versión creada: ${v.numero} (v${v.version}).`; this.cargarTodo(); },
      error: (e) => this.error = String(e)
    });
  }

  eliminar(cot: Cotizacion): void {
    if (!confirm(`¿Eliminar el borrador ${cot.numero}? Esta acción no puede deshacerse.`)) { return; }
    this.erp.eliminarCotizacion(cot.id!).subscribe({
      next: () => { this.exito = `Borrador ${cot.numero} eliminado.`; this.cargarTodo(); },
      error: (e) => this.error = String(e)
    });
  }

  // ===== Conversión a pedido =====

  abrirConversion(cot: Cotizacion): void {
    this.convirtiendo = cot;
    this.conversion = { direccionId: null, tarjetaId: null, metodoPago: 'TARJETA' };
    this.direccionesCliente = [];
    this.tarjetasCliente = [];
    const clienteId = cot.cliente?.id;
    if (clienteId) {
      this.direccionService.obtenerDireccionesPorUsuario(clienteId).subscribe({
        next: (d: any) => this.direccionesCliente = d, error: () => {}
      });
      this.tarjetaService.listarTarjetas(clienteId).subscribe({
        next: (t: any) => this.tarjetasCliente = t, error: () => {}
      });
    }
  }

  confirmarConversion(): void {
    if (!this.convirtiendo || !this.conversion.direccionId || !this.conversion.tarjetaId) {
      this.error = 'Selecciona la dirección de entrega y el método de pago del cliente.';
      return;
    }
    this.erp.convertirCotizacion(this.convirtiendo.id!,
      Number(this.conversion.direccionId), Number(this.conversion.tarjetaId), this.conversion.metodoPago)
      .subscribe({
        next: (pedido: any) => {
          this.exito = `Cotización convertida en pedido ${pedido.numeroPedido}. El stock fue descontado.`;
          this.convirtiendo = null;
          this.cargarTodo();
        },
        error: (e) => this.error = String(e)
      });
  }

  // ===== Utilitarios =====

  verDetalle(cot: Cotizacion): void {
    this.erp.obtenerCotizacion(cot.id!).subscribe({
      next: (completa) => this.seleccionada = completa,
      error: (e) => this.error = String(e)
    });
  }

  imprimir(): void { window.print(); }

  claseEstado(estado?: string): string {
    switch (estado) {
      case 'ACEPTADA': return 'bg-success';
      case 'CONVERTIDA': return 'bg-primary';
      case 'ENVIADA': return 'bg-info';
      case 'RECHAZADA': return 'bg-danger';
      case 'VENCIDA': return 'bg-secondary';
      default: return 'bg-warning';
    }
  }

  nombreCliente(cot: Cotizacion): string {
    return `${cot.cliente?.nombres || ''} ${cot.cliente?.apellidos || ''}`.trim() || `Cliente #${cot.cliente?.id}`;
  }

  private formularioVacio() {
    const en15dias = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
    return { clienteId: null, vigenciaHasta: en15dias, observaciones: '', descuento: 0 };
  }
  private lineaVacia() {
    return { productoId: null, cantidad: 1, precioUnitario: 0, descuentoPct: 0 };
  }
}
