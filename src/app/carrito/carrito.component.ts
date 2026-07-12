import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CarritoService, ItemCarrito } from '../services/carrito.service';
import { DireccionService } from '../services/direccion.service';
import { TarjetaService } from '../services/tarjeta.service';
import { PedidoService } from '../services/pedido.service';
import { Producto } from '../models/producto';
import { Direccion } from '../models/direccion';
import { Tarjeta } from '../models/tarjeta';
import { Pedido, DetallePedido } from '../models/pedido';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit, OnDestroy {
  private carritoService = inject(CarritoService);
  private direccionService = inject(DireccionService);
  private tarjetaService = inject(TarjetaService);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);
  private modalService = inject(NgbModal);

  carrito: ItemCarrito[] = [];
  private carritoSubscription!: Subscription;

  // Totales
  subtotal: number = 0;
  envio: number = 0;
  igv: number = 0;
  total: number = 0;

  // Datos del usuario
  usuarioActual: any = null;

  // Datos del checkout
  direccionPrincipal: Direccion | null = null;
  tarjetaPredeterminada: Tarjeta | null = null;
  direcciones: Direccion[] = [];
  tarjetas: Tarjeta[] = [];

  // Estados
  cargandoDatosCheckout: boolean = false;
  procesandoPago: boolean = false;

  // Selecciones del usuario
  direccionSeleccionada: Direccion | null = null;
  tarjetaSeleccionada: Tarjeta | null = null;

  ngOnInit() {
    this.carritoSubscription = this.carritoService.carrito$.subscribe(carrito => {
      this.carrito = carrito;
      this.calcularTotales();
    });

    this.obtenerUsuarioActual();
  }

  ngOnDestroy() {
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  obtenerUsuarioActual() {
    const usuarioData = localStorage.getItem('usuario');
    if (usuarioData) {
      this.usuarioActual = JSON.parse(usuarioData);
    }
  }

  // Métodos de cantidad
  incrementarCantidad(item: ItemCarrito): void {
    if (this.hayStockSuficiente(item)) {
      this.carritoService.actualizarCantidad(item.producto.id!, item.cantidad + 1);
    }
  }

  decrementarCantidad(item: ItemCarrito): void {
    if (item.cantidad > 1) {
      this.carritoService.actualizarCantidad(item.producto.id!, item.cantidad - 1);
    }
  }

  // Eliminar producto
  eliminarProducto(productoId: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
      this.carritoService.eliminarProducto(productoId);
    }
  }

  // Limpiar carrito
  limpiarCarrito(): void {
    if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
      this.carritoService.limpiarCarrito();
    }
  }

  // Verificar stock
  hayStockSuficiente(item: ItemCarrito): boolean {
    return this.carritoService.verificarStock(item.producto, item.cantidad + 1);
  }

  hayStockDisponible(): boolean {
    return this.carrito.every(item => 
      this.carritoService.verificarStock(item.producto, item.cantidad)
    );
  }

  // Calcular totales
  calcularTotales(): void {
    this.subtotal = this.carritoService.getTotal();
    this.envio = this.subtotal > 100 ? 0 : 15;
    this.igv = this.subtotal * 0.18;
    this.total = this.subtotal + this.envio;
  }

  // NUEVO: Proceder al pago (abrir modal)
  procederAlPago(): void {
    if (!this.hayStockDisponible()) {
      alert('❌ Algunos productos no tienen stock suficiente. Por favor ajusta las cantidades.');
      return;
    }

    if (!this.usuarioActual) {
      alert('❌ Debes iniciar sesión para realizar una compra');
      this.router.navigate(['/login']);
      return;
    }

    // Cargar datos del usuario (dirección y tarjeta)
    this.cargarDatosCheckout();
  }

  // NUEVO: Cargar datos para el checkout
  cargarDatosCheckout(): void {
    this.cargandoDatosCheckout = true;

    // Cargar dirección principal
    this.direccionService.obtenerDireccionPrincipal(this.usuarioActual.id).subscribe({
      next: (direccion) => {
        this.direccionPrincipal = direccion;
        this.direccionSeleccionada = direccion;
      },
      error: (err) => {
        console.log('No hay dirección principal');
        this.direccionPrincipal = null;
      }
    });

    // Cargar todas las direcciones
    this.direccionService.obtenerDireccionesPorUsuario(this.usuarioActual.id).subscribe({
      next: (direcciones) => {
        this.direcciones = direcciones;
      },
      error: (err) => {
        console.error('Error cargando direcciones:', err);
        this.direcciones = [];
      }
    });

    // Cargar tarjeta predeterminada
    this.tarjetaService.listarTarjetas(this.usuarioActual.id).subscribe({
      next: (tarjetas) => {
        this.tarjetas = tarjetas;
        this.tarjetaPredeterminada = tarjetas.find(t => t.predeterminada) || null;
        this.tarjetaSeleccionada = this.tarjetaPredeterminada;
        this.cargandoDatosCheckout = false;

        // Abrir modal después de cargar los datos
        this.abrirModalCheckout();
      },
      error: (err) => {
        console.error('Error cargando tarjetas:', err);
        this.tarjetas = [];
        this.tarjetaPredeterminada = null;
        this.cargandoDatosCheckout = false;
        
        // Abrir modal de todos modos
        this.abrirModalCheckout();
      }
    });
  }

  // NUEVO: Abrir modal de checkout
  abrirModalCheckout(): void {
    const modalElement = document.getElementById('modalCheckout');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // NUEVO: Confirmar pago
  confirmarPago(): void {
    // Validar que tenga dirección y tarjeta
    if (!this.direccionSeleccionada) {
      alert('❌ Debes seleccionar una dirección de envío');
      return;
    }

    if (!this.tarjetaSeleccionada) {
      alert('❌ Debes seleccionar un método de pago');
      return;
    }

    if (confirm('¿Confirmas que deseas realizar esta compra?')) {
      this.realizarCompra();
    }
  }

  // NUEVO: Realizar la compra
  realizarCompra(): void {
    //validacion de seguridad
    if(!this.usuarioActual?.id||!this.direccionSeleccionada?.id||!this.tarjetaSeleccionada?.id){
      alert('❌ Información incompleta. No se puede procesar la compra.');
      return;
    }
    this.procesandoPago = true;

    // Crear detalles del pedido
    const detalles: DetallePedido[] = this.carrito.map(item => ({
      producto: item.producto,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.subtotal
    }));

    // Crear el pedido
    const pedido: Pedido = {
      usuario: { id: this.usuarioActual.id } as any,
      direccion: { id: this.direccionSeleccionada.id } as any,
      tarjeta: { id: this.tarjetaSeleccionada.id } as any,
      subtotal: this.subtotal,
      igv: this.igv,
      envio: this.envio,
      total: this.total,
      metodoPago: 'TARJETA',
      estado: 'PENDIENTE',
      fechaPedido: new Date().toISOString(),
      detalles: detalles

    };

    console.log('📦 Enviando pedido:', pedido);

    // Enviar al backend
    this.pedidoService.crearPedido(pedido).subscribe({
      next: (pedidoCreado) => {
        console.log('✅ Pedido creado exitosamente:', pedidoCreado);
        this.procesandoPago = false;

        // Cerrar modal
        const modalElement = document.getElementById('modalCheckout');
        if (modalElement) {
          const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }

        // Limpiar carrito
        this.carritoService.limpiarCarrito();

       // MOSTRAR CÓDIGO DE VERIFICACIÓN EN LA ALERTA
      const mensaje = `✅ ¡Compra realizada exitosamente!\n\n` +
        `📦 Número de pedido: ${pedidoCreado.numeroPedido}\n` +
        `🔢 Código de verificación: ${pedidoCreado.codigoVerificacion}\n\n` +
        `💡 *Guarda este código, lo necesitarás cuando te entreguen tu pedido*\n\n` +
        `¡Gracias por tu compra!`;

      alert(mensaje);

        // Redirigir a mis pedidos (cuando lo implementes) o a principal
        this.router.navigate(['/factura', pedidoCreado.id]);
      },
      error: (err) => {
        console.error('❌ Error al crear pedido:', err);
        this.procesandoPago = false;
        alert('❌ Error al procesar la compra: ' + err);
      }
    });
  }

  // NUEVO: Ir a agregar dirección
  irAAgregarDireccion(): void {
    // Cerrar modal
    const modalElement = document.getElementById('modalCheckout');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.router.navigate(['/direcciones']);
  }

  // NUEVO: Ir a agregar tarjeta
  irAAgregarTarjeta(): void {
    // Cerrar modal
    const modalElement = document.getElementById('modalCheckout');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.router.navigate(['/mis-tarjetas']);
  }

  // NUEVO: Obtener logo de tarjeta
  getLogo(tipo: string): string {
    const logos: {[key: string]: string} = {
      'VISA': 'img/visa-logo.png',
      'MASTERCARD': 'img/mastercard-logo.png',
      'AMEX': 'img/amex-logo.png',
      'DISCOVER': 'img/discover-logo.png'
    };
    return logos[tipo] || 'img/credit-card-logo.png';
  }

  // Utilidades
  getProductImage(producto: Producto): string {
    if (producto.imagenUrl) {
      return producto.imagenUrl;
    }
    return 'assets/default-product.jpg';
  }

  getStockText(stock: number): string {
    if (stock === 0) return 'Agotado';
    if (stock < 5) return `Últimas ${stock} unidades`;
    if (stock < 10) return `Stock bajo (${stock})`;
    return `En stock (${stock})`;
  }
}