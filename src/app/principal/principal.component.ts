import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductoService } from '../services/logistico/producto.service';
import { CarritoService } from '../services/carrito.service';
import { Producto } from '../models/producto';
import { HeaderComponent } from '../components/header/header.component';

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    HeaderComponent
  ],
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.css']
})
export class PrincipalComponent implements OnInit {
  private productoService = inject(ProductoService);
  private carritoService = inject(CarritoService);
  private router = inject(Router);

  // Productos
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  productosEconomicos: Producto[] = [];
  cargando: boolean = true;

  // Filtros
  filtroTexto: string = '';
  filtroCategoria: string = '';
  filtroMaterial: string = '';
  filtroPrecioMax: number = 2000;
  filtroOfertas: boolean = false;
  filtroEnStock: boolean = true;
  ordenamiento: string = 'nombre';

  // Datos para filtros
  categorias: any[] = [];
  materiales: string[] = [];

  // Categorías populares
  categoriasPopulares = [
    { nombre: 'Mesas', icono: 'bi bi-table' },
    { nombre: 'Sillas', icono: 'bi bi-archive' },
    { nombre: 'Camas', icono: 'bi bi-bag-plus' },
    { nombre: 'Roperos', icono: 'bi bi-door-closed' },
    { nombre: 'Comedores', icono: 'bi bi-cup-straw' },
    { nombre: 'Colchones', icono: 'bi bi-cloud' }
  ];

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.cargando = true;
    this.productoService.listarProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.productosFiltrados = data;
        this.productosEconomicos = data.filter(p => p.precioVenta < 200);
        this.extraerDatosFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.cargando = false;
        // Datos de ejemplo para desarrollo
        this.cargarDatosEjemplo();
      }
    });
  }

  extraerDatosFiltros() {
    // Extraer categorías únicas
    const categoriasUnicas = new Set(this.productos.map(p => p.categoria?.nombre).filter(Boolean));
    this.categorias = Array.from(categoriasUnicas).map(nombre => ({ nombre }));
    
    // Extraer materiales únicos
    const materialesUnicos = new Set(this.productos.map(p => p.material).filter(Boolean));
    this.materiales = Array.from(materialesUnicos) as string[];
  }

  aplicarFiltros() {
    this.productosFiltrados = this.productos.filter(producto => {
      // Filtro por texto
      const coincideTexto = !this.filtroTexto || 
        producto.nombre.toLowerCase().includes(this.filtroTexto.toLowerCase());
      
      // Filtro por categoría
      const coincideCategoria = !this.filtroCategoria || 
        producto.categoria?.nombre === this.filtroCategoria;
      
      // Filtro por material
      const coincideMaterial = !this.filtroMaterial || 
        producto.material?.toLowerCase().includes(this.filtroMaterial.toLowerCase());
      
      // Filtro por precio
      const coincidePrecio = producto.precioVenta <= this.filtroPrecioMax;
      
      // Filtro por ofertas
      const coincideOfertas = !this.filtroOfertas || this.esProductoOferta(producto);
      
      // Filtro por stock
      const coincideStock = !this.filtroEnStock || producto.stock > 0;
      
      return coincideTexto && coincideCategoria && coincideMaterial && 
             coincidePrecio && coincideOfertas && coincideStock;
    });

    this.ordenarProductos();
  }

  ordenarProductos() {
    switch (this.ordenamiento) {
      case 'precio-asc':
        this.productosFiltrados.sort((a, b) => a.precioVenta - b.precioVenta);
        break;
      case 'precio-desc':
        this.productosFiltrados.sort((a, b) => b.precioVenta - a.precioVenta);
        break;
      case 'stock-desc':
        this.productosFiltrados.sort((a, b) => b.stock - a.stock);
        break;
      default:
        this.productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.filtroCategoria = '';
    this.filtroMaterial = '';
    this.filtroPrecioMax = 2000;
    this.filtroOfertas = false;
    this.filtroEnStock = true;
    this.ordenamiento = 'nombre';
    this.aplicarFiltros();
  }

  filtrarPorCategoria(categoria: string) {
    this.filtroCategoria = categoria;
    this.aplicarFiltros();
    this.scrollToProducts();
  }

  scrollToProducts() {
    const element = document.querySelector('.products-main');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // MÉTODO ACTUALIZADO: Agregar al carrito con validación de autenticación y stock
  agregarAlCarrito(producto: Producto) {
    console.log('🛒 Intentando agregar al carrito:', producto.nombre);
    
    // Verificar si el usuario está autenticado
    if (!this.estaAutenticado()) {
      console.log('🔐 Usuario no autenticado, mostrando alerta');
      this.mostrarAlertaAutenticacion(producto);
      return;
    }

    // Verificar stock
    if (producto.stock === 0) {
      alert('⚠️ Este producto está agotado');
      return;
    }

    // Verificar stock disponible usando el servicio del carrito
    const cantidadEnCarrito = this.obtenerCantidadEnCarrito(producto.id!);
    const cantidadTotalRequerida = cantidadEnCarrito + 1;
    
    if (!this.carritoService.verificarStock(producto, cantidadTotalRequerida)) {
      alert(`❌ No hay suficiente stock disponible.\n\nStock actual: ${producto.stock} unidades\nEn tu carrito: ${cantidadEnCarrito} unidades\n\nPor favor ajusta la cantidad.`);
      return;
    }
    
    // Agregar al carrito real
    console.log('✅ Agregando producto al carrito real');
    this.carritoService.agregarProducto(producto, 1);
    
    // Mostrar confirmación mejorada
    this.mostrarConfirmacionCarrito(producto);
  }

  // MÉTODO NUEVO: Obtener cantidad de un producto en el carrito
  private obtenerCantidadEnCarrito(productoId: number): number {
    const carrito = this.carritoService['carritoSubject'].value;
    const item = carrito.find(item => item.producto.id === productoId);
    return item ? item.cantidad : 0;
  }

  // MÉTODO NUEVO: Mostrar confirmación de agregado al carrito
  private mostrarConfirmacionCarrito(producto: Producto): void {
    const cantidadTotal = this.obtenerCantidadEnCarrito(producto.id!);
    const mensaje = `
✅ **${this.acortarNombre(producto.nombre, 30)}**

📦 Agregado al carrito exitosamente
💰 Precio: S/ ${producto.precioVenta}
🛒 En tu carrito: ${cantidadTotal} unidad${cantidadTotal > 1 ? 'es' : ''}

¿Deseas ver tu carrito ahora?
    `;

    if (confirm(mensaje)) {
      this.router.navigate(['/carrito']);
    }
  }

  // MÉTODO NUEVO: Verificar autenticación
  estaAutenticado(): boolean {
    const usuario = localStorage.getItem('usuario');
    return !!usuario;
  }

  // MÉTODO NUEVO: Mostrar alerta de autenticación y redirigir
  private mostrarAlertaAutenticacion(producto: Producto): void {
    const mensaje = `
🛒 **${this.acortarNombre(producto.nombre, 30)}**
💵 Precio: S/ ${producto.precioVenta}

🔐 Para agregar productos al carrito necesitas:

• Iniciar sesión con tu cuenta existente
• O registrarte si eres nuevo cliente

¿Te gustaría ir a la página de autenticación ahora?
    `;

    if (confirm(mensaje)) {
      // Redirigir automáticamente a login
      this.router.navigate(['/login']);
    }
  }

  // Métodos de utilidad
  acortarNombre(nombre: string, maxLength: number = 50): string {
    if (nombre.length <= maxLength) {
      return nombre;
    }
    return nombre.substring(0, maxLength) + '...';
  }

  esProductoOferta(producto: Producto): boolean {
    return producto.precioVenta > 300;
  }

  tieneEnvioGratis(producto: Producto): boolean {
    return producto.precioVenta > 100;
  }

  getStockBadgeClass(stock: number): string {
    if (stock === 0) return 'out-of-stock';
    if (stock < 5) return 'low-stock';
    return 'in-stock';
  }

  getStockText(stock: number): string {
    if (stock === 0) return 'AGOTADO';
    if (stock < 5) return `ÚLTIMOS ${stock}`;
    return 'EN STOCK';
  }

  getProductImage(producto: Producto): string {
  if (producto.imagenUrl) {
    return producto.imagenUrl;
  }

  const categoria = producto.categoria?.nombre.toLowerCase();
  if (categoria?.includes('mesa')) return 'assets/default-mesa.jpg';
  if (categoria?.includes('silla')) return 'assets/default-silla.jpg';
  if (categoria?.includes('cama')) return 'assets/default-cama.jpg';
  return 'assets/default-product.jpg';
}



  handleImageError(event: any) {
    event.target.src = 'assets/default-product.jpg';
  }

  // MÉTODO NUEVO: Verificar si un producto puede agregarse al carrito
  puedeAgregarAlCarrito(producto: Producto): boolean {
    if (!this.estaAutenticado() || producto.stock === 0) {
      return false;
    }
    
    const cantidadEnCarrito = this.obtenerCantidadEnCarrito(producto.id!);
    return this.carritoService.verificarStock(producto, cantidadEnCarrito + 1);
  }

  // MÉTODO NUEVO: Obtener texto para el botón del carrito
  getTextoBotonCarrito(producto: Producto): string {
    if (!this.estaAutenticado()) {
      return 'INICIAR SESIÓN';
    }
    
    if (producto.stock === 0) {
      return 'SIN STOCK';
    }
    
    const cantidadEnCarrito = this.obtenerCantidadEnCarrito(producto.id!);
    if (cantidadEnCarrito > 0) {
      return `AGREGAR (${cantidadEnCarrito} EN CARRITO)`;
    }
    
    return 'AGREGAR AL CARRITO';
  }

  // Datos de ejemplo para desarrollo
  private cargarDatosEjemplo() {
    this.productos = [
      {
        id: 1,
        nombre: 'Mesa de Pino para 6 personas',
        proveedor: { id: 1, nombre: 'Taller Pino', materialEspecialidad: 'Madera Pino', activo: true },
        categoria: { id: 1, nombre: 'Mesas' },
        precioCompra: 150,
        precioVenta: 350,
        stock: 10,
        material: 'Madera Pino',
        dimensiones: '1.20m x 0.80m',
        color: 'Natural',
        activo: true
      },
      {
        id: 2,
        nombre: 'Silla de Plástico Rey',
        proveedor: { id: 2, nombre: 'Rey Plástico', materialEspecialidad: 'Plástico', activo: true },
        categoria: { id: 2, nombre: 'Sillas' },
        precioCompra: 25,
        precioVenta: 49,
        stock: 50,
        material: 'Plástico',
        color: 'Blanco',
        activo: true
      },
      {
        id: 3,
        nombre: 'Cama Box Eucalipto 2 Plazas',
        proveedor: { id: 3, nombre: 'Taller Tarimas', materialEspecialidad: 'Madera Eucalipto', activo: true },
        categoria: { id: 3, nombre: 'Camas' },
        precioCompra: 300,
        precioVenta: 599,
        stock: 5,
        material: 'Madera Eucalipto',
        dimensiones: '1.90m x 1.40m',
        color: 'Natural',
        activo: true
      },
      {
        id: 4,
        nombre: 'Banquito de Plástico BM',
        proveedor: { id: 4, nombre: 'BM Plástico', materialEspecialidad: 'Plástico', activo: true },
        categoria: { id: 2, nombre: 'Sillas' },
        precioCompra: 15,
        precioVenta: 29,
        stock: 25,
        material: 'Plástico',
        color: 'Negro',
        activo: true
      }
    ];
    
    this.productosFiltrados = this.productos;
    this.productosEconomicos = this.productos.filter(p => p.precioVenta < 200);
    this.extraerDatosFiltros();
  }

  // ===== Modal de detalles de producto =====
  productoDetalle: Producto | null = null;
  errorDetalle: string = '';

  verDetallesProducto(producto: Producto): void {
    if (!producto || producto.id == null) {
      this.errorDetalle = 'No hay información disponible para este producto.';
      this.productoDetalle = null;
      return;
    }
    this.errorDetalle = '';
    this.productoDetalle = producto;
    document.body.style.overflow = 'hidden';
  }

  cerrarDetalles(): void {
    this.productoDetalle = null;
    this.errorDetalle = '';
    document.body.style.overflow = '';
  }

  agregarDesdeDetalles(): void {
    if (this.productoDetalle) {
      this.agregarAlCarrito(this.productoDetalle);
      this.cerrarDetalles();
    }
  }
}