// src/app/admin/productos-no-movimiento/productos-no-movimiento.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxEchartsModule } from 'ngx-echarts';
import { ProductoService } from '../../services/logistico/producto.service';
import { PedidoService } from '../../services/pedido.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-productos-no-movimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxEchartsModule],
  templateUrl: './productos-no-movimiento.component.html',
  styleUrls: ['./productos-no-movimiento.component.css']
})
export class ProductosNoMovimientoComponent implements OnInit, OnDestroy {
  private productoService = inject(ProductoService);
  private pedidoService = inject(PedidoService);
  private adminService = inject(AdminService);
  private router = inject(Router);

  // Datos para el gráfico
  chartOption: any = {};
  chartInstance: any = null;
  isChartReady: boolean = false;
  chartLoading: boolean = false;

  // Lista de productos sin movimiento
  productosSinMovimiento: any[] = [];

  // Estadísticas
  estadisticas = {
    totalProductosSinMovimiento: 0,
    stockAcumulado: 0,
    valorInventario: 0,
    diasPromedioSinVenta: 0,
    productosBajoMinimo: 0,
    porcentajeInventario: 0
  };

  // Filtros
  filtros = {
    diasSinMovimiento: 30,
    stockMinimo: 1,
    categoria: '',
    mostrarTodos: false
  };

  // Estados
  cargando: boolean = true;
  cargandoDatos: boolean = false;
  productosTodos: any[] = [];
  productosMasVendidos: any[] = [];
  pedidosTodos: any[] = [];
  
  // Historial de ventas por producto
  historialVentas: Map<number, { ultimaVenta: Date | null, totalVendido: number }> = new Map();

  constructor() {}

  ngOnInit() {
    this.cargarDatos();
  }

  ngOnDestroy() {
    // Limpiar listeners
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
  }

  cargarDatos() {
    this.cargando = true;
    this.cargandoDatos = true;
    
    // Limpiar datos anteriores
    this.productosTodos = [];
    this.productosMasVendidos = [];
    this.pedidosTodos = [];
    this.historialVentas.clear();
    this.productosSinMovimiento = [];
    this.isChartReady = false;
    this.chartLoading = true;
    
    // Cargar datos secuencialmente para mejor control
    this.cargarDatosSecuencialmente();
  }

  async cargarDatosSecuencialmente() {
    try {
      // 1. Cargar productos
      await this.cargarTodosProductos();
      
      // 2. Cargar pedidos
      await this.cargarTodosPedidos();
      
      // 3. Cargar productos más vendidos (en segundo plano)
      this.cargarProductosMasVendidos().catch(() => {
        console.warn('No se pudieron cargar productos más vendidos, continuando...');
      });
      
      // 4. Analizar datos
      this.analizarVentasPorProducto();
      this.identificarProductosSinMovimiento();
      
      // 5. Inicializar gráfico (con timeout para asegurar renderizado)
      setTimeout(() => {
        this.inicializarGrafico();
        this.cargando = false;
        this.cargandoDatos = false;
        this.chartLoading = false;
      }, 100);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.cargando = false;
      this.cargandoDatos = false;
      this.chartLoading = false;
    }
  }

  cargarTodosProductos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.productoService.listarProductos().subscribe({
        next: (productos) => {
          this.productosTodos = productos.filter(p => p.activo !== false);
          resolve();
        },
        error: (err) => {
          console.error('Error cargando productos:', err);
          reject(err);
        }
      });
    });
  }

  cargarProductosMasVendidos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.adminService.obtenerProductosMasVendidos().subscribe({
        next: (productos) => {
          this.productosMasVendidos = productos;
          resolve();
        },
        error: (err) => {
          console.error('Error cargando productos más vendidos:', err);
          reject(err);
        }
      });
    });
  }

  cargarTodosPedidos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pedidoService.obtenerTodosLosPedidos().subscribe({
        next: (pedidos) => {
          this.pedidosTodos = pedidos;
          resolve();
        },
        error: (err) => {
          console.error('Error cargando pedidos:', err);
          reject(err);
        }
      });
    });
  }

  analizarVentasPorProducto() {
    this.historialVentas.clear();
    
    // Procesar todos los pedidos para analizar ventas por producto
    this.pedidosTodos.forEach(pedido => {
      if (pedido.detalles && pedido.fechaPedido) {
        let fechaPedido: Date;
        
        try {
          fechaPedido = new Date(pedido.fechaPedido);
          if (isNaN(fechaPedido.getTime())) {
            return; // Fecha inválida, saltar este pedido
          }
        } catch {
          return; // Error al parsear fecha
        }
        
        pedido.detalles.forEach((detalle: any) => {
          if (detalle.producto && detalle.producto.id) {
            const productoId = detalle.producto.id;
            const cantidad = detalle.cantidad || 0;
            
            const ventaActual = this.historialVentas.get(productoId) || {
              ultimaVenta: null,
              totalVendido: 0
            };
            
            // Actualizar última venta si esta es más reciente
            if (!ventaActual.ultimaVenta || fechaPedido > ventaActual.ultimaVenta) {
              ventaActual.ultimaVenta = fechaPedido;
            }
            
            // Sumar cantidad vendida
            ventaActual.totalVendido += cantidad;
            
            this.historialVentas.set(productoId, ventaActual);
          }
        });
      }
    });
  }

  identificarProductosSinMovimiento() {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - this.filtros.diasSinMovimiento);
    
    this.productosSinMovimiento = this.productosTodos.filter(producto => {
      // Obtener historial de ventas del producto
      const historial = this.historialVentas.get(producto.id);
      
      // Si nunca se ha vendido y tiene stock
      if (!historial || !historial.ultimaVenta) {
        return producto.stock > 0;
      }
      
      // Si se ha vendido pero hace más de X días
      const diasSinVenta = Math.floor((new Date().getTime() - historial.ultimaVenta.getTime()) / (1000 * 60 * 60 * 24));
      
      return diasSinVenta > this.filtros.diasSinMovimiento && producto.stock > 0;
    });
    
    // Calcular estadísticas
    this.calcularEstadisticas();
  }

  calcularEstadisticas() {
    this.estadisticas.totalProductosSinMovimiento = this.productosSinMovimiento.length;
    this.estadisticas.stockAcumulado = this.productosSinMovimiento.reduce((sum, p) => sum + p.stock, 0);
    
    // Calcular valor del inventario
    this.estadisticas.valorInventario = this.productosSinMovimiento.reduce((sum, p) => {
      const precioCompra = p.precioCompra || (p.precioVenta * 0.7);
      return sum + (precioCompra * p.stock);
    }, 0);
    
    // Calcular productos con stock bajo el mínimo
    this.estadisticas.productosBajoMinimo = this.productosSinMovimiento.filter(
      p => p.stock < this.filtros.stockMinimo
    ).length;
    
    // Calcular porcentaje del inventario total
    const valorTotalInventario = this.productosTodos.reduce((sum, p) => {
      const precioCompra = p.precioCompra || (p.precioVenta * 0.7);
      return sum + (precioCompra * p.stock);
    }, 0);
    
    this.estadisticas.porcentajeInventario = valorTotalInventario > 0 ?
      (this.estadisticas.valorInventario / valorTotalInventario) * 100 : 0;
    
    // Calcular días promedio sin venta
    const productosConHistorial = this.productosSinMovimiento.filter(p => {
      const historial = this.historialVentas.get(p.id);
      return historial && historial.ultimaVenta;
    });
    
    if (productosConHistorial.length > 0) {
      const totalDiasSinVenta = productosConHistorial.reduce((sum, p) => {
        const historial = this.historialVentas.get(p.id)!;
        const diasSinVenta = Math.floor((new Date().getTime() - historial.ultimaVenta!.getTime()) / (1000 * 60 * 60 * 24));
        return sum + diasSinVenta;
      }, 0);
      
      this.estadisticas.diasPromedioSinVenta = Math.floor(totalDiasSinVenta / productosConHistorial.length);
    } else {
      this.estadisticas.diasPromedioSinVenta = this.filtros.diasSinMovimiento * 2;
    }
  }

  inicializarGrafico() {
    if (this.productosSinMovimiento.length === 0) {
      this.chartOption = this.crearGraficoVacio();
      this.isChartReady = true;
      return;
    }
    
    try {
      // Preparar datos para el gráfico - ordenar por valor de inventario
      const productosOrdenados = [...this.productosSinMovimiento]
        .sort((a, b) => {
          const valorA = (a.precioCompra || a.precioVenta * 0.7) * a.stock;
          const valorB = (b.precioCompra || b.precioVenta * 0.7) * b.stock;
          return valorB - valorA;
        })
        .slice(0, 10); // Mostrar solo los 10 con mayor valor de inventario
      
      if (productosOrdenados.length === 0) {
        this.chartOption = this.crearGraficoVacio();
        this.isChartReady = true;
        return;
      }
      
      const nombresProductos = productosOrdenados.map(p => 
        p.nombre.length > 12 ? p.nombre.substring(0, 12) + '...' : p.nombre
      );
      
      const valoresInventario = productosOrdenados.map(p => {
        const precioCompra = p.precioCompra || p.precioVenta * 0.7;
        return (precioCompra * p.stock);
      });
      
      const diasSinVenta = productosOrdenados.map(p => {
        const historial = this.historialVentas.get(p.id);
        if (!historial || !historial.ultimaVenta) {
          return this.filtros.diasSinMovimiento * 2; // Nunca vendido
        }
        return Math.floor((new Date().getTime() - historial.ultimaVenta.getTime()) / (1000 * 60 * 60 * 24));
      });
      
      this.chartOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params: any) => {
            const producto = productosOrdenados[params[0].dataIndex];
            const historial = this.historialVentas.get(producto.id);
            const ultimaVenta = historial && historial.ultimaVenta ?
              historial.ultimaVenta.toLocaleDateString('es-PE') : 'Nunca vendido';
            const totalVendido = historial ? historial.totalVendido : 0;
            
            return `
              <div style="font-weight: bold; margin-bottom: 5px;">${producto.nombre}</div>
              <div>Stock: ${producto.stock} unidades</div>
              <div>Valor inventario: S/ ${((producto.precioCompra || producto.precioVenta * 0.7) * producto.stock).toFixed(2)}</div>
              <div>Última venta: ${ultimaVenta}</div>
              <div>Total vendido: ${totalVendido} unidades</div>
              <div>Días sin venta: ${diasSinVenta[params[0].dataIndex]}</div>
            `;
          },
          backgroundColor: 'rgba(26, 31, 54, 0.95)',
          borderColor: '#ff6b6b',
          textStyle: {
            color: '#ffffff'
          }
        },
        xAxis: {
          type: 'category',
          data: nombresProductos,
          axisLine: {
            lineStyle: {
              color: '#718096'
            }
          },
          axisLabel: {
            color: '#e2e8f0', // Color blanco más claro
            rotate: 45,
            interval: 0,
            fontSize: 11
          }
        },
        yAxis: [
          {
            type: 'value',
            name: 'Valor (S/)',
            position: 'left',
            axisLine: {
              lineStyle: {
                color: '#718096'
              }
            },
            axisLabel: {
              color: '#e2e8f0', // Color blanco más claro
              formatter: 'S/ {value}'
            },
            splitLine: {
              lineStyle: {
                color: '#2d3748',
                type: 'dashed'
              }
            }
          },
          {
            type: 'value',
            name: 'Días sin venta',
            position: 'right',
            axisLine: {
              lineStyle: {
                color: '#718096'
              }
            },
            axisLabel: {
              color: '#e2e8f0', // Color blanco más claro
              formatter: '{value} días'
            }
          }
        ],
        series: [
          {
            name: 'Valor Inventario',
            type: 'bar',
            data: valoresInventario,
            yAxisIndex: 0,
            itemStyle: {
              color: function(params: any) {
                const dias = diasSinVenta[params.dataIndex];
                if (dias > 90) return '#ff4444';
                if (dias > 60) return '#ff8844';
                if (dias > 30) return '#ffaa44';
                return '#ffcc44';
              }
            },
            barWidth: '40%'
          },
          {
            name: 'Días sin venta',
            type: 'line',
            data: diasSinVenta,
            yAxisIndex: 1,
            itemStyle: {
              color: '#ff6b6b'
            },
            lineStyle: {
              width: 3
            },
            symbol: 'circle',
            symbolSize: 8
          }
        ],
        grid: {
          left: '3%',
          right: '8%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        legend: {
          data: ['Valor Inventario', 'Días sin venta'],
          textStyle: {
            color: '#e2e8f0' // Color blanco más claro
          },
          top: 'top'
        },
        backgroundColor: 'transparent'
      };
      
      this.isChartReady = true;
    } catch (error) {
      console.error('Error inicializando gráfico:', error);
      this.chartOption = this.crearGraficoVacio();
      this.isChartReady = true;
    }
  }

  crearGraficoVacio() {
    return {
      title: {
        text: '¡Excelente! No hay productos sin movimiento',
        subtext: 'Todos los productos han tenido ventas recientemente',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#00cc88',
          fontSize: 16,
          fontWeight: 'bold'
        },
        subtextStyle: {
          color: '#a0aec0',
          fontSize: 12
        }
      },
      xAxis: {
        show: false
      },
      yAxis: {
        show: false
      },
      series: [],
      backgroundColor: 'transparent'
    };
  }

  onChartInit(ec: any) {
    this.chartInstance = ec;
    
    // Redimensionar gráfico cuando cambia el tamaño de la ventana
    const resizeHandler = () => {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    };
    
    window.addEventListener('resize', resizeHandler);
    
    // Limpiar listener cuando se destruye el componente
    this.ngOnDestroy = () => {
      window.removeEventListener('resize', resizeHandler);
      if (this.chartInstance) {
        this.chartInstance.dispose();
      }
    };
  }

  aplicarFiltros() {
    this.cargandoDatos = true;
    this.chartLoading = true;
    
    setTimeout(() => {
      this.identificarProductosSinMovimiento();
      this.inicializarGrafico();
      this.cargandoDatos = false;
      this.chartLoading = false;
    }, 300);
  }

  limpiarFiltros() {
    this.filtros = {
      diasSinMovimiento: 30,
      stockMinimo: 1,
      categoria: '',
      mostrarTodos: false
    };
    this.aplicarFiltros();
  }

  exportarReporte() {
    if (this.productosSinMovimiento.length === 0) {
      alert('No hay productos para exportar');
      return;
    }
    
    const headers = ['ID', 'Producto', 'Categoría', 'Stock', 'Precio Compra', 'Precio Venta', 
                     'Valor Inventario', 'Última Venta', 'Total Vendido', 'Días sin venta', 'Estado'];
    
    const rows = this.productosSinMovimiento.map(producto => {
      const historial = this.historialVentas.get(producto.id);
      const precioCompra = producto.precioCompra || producto.precioVenta * 0.7;
      const valorInventario = precioCompra * producto.stock;
      
      let ultimaVenta = 'Nunca vendido';
      let totalVendido = 0;
      let diasSinVenta = this.filtros.diasSinMovimiento * 2;
      
      if (historial && historial.ultimaVenta) {
        ultimaVenta = historial.ultimaVenta.toLocaleDateString('es-PE');
        totalVendido = historial.totalVendido;
        diasSinVenta = Math.floor((new Date().getTime() - historial.ultimaVenta.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      const estado = producto.stock < this.filtros.stockMinimo ? 'STOCK BAJO' : 'SIN MOVIMIENTO';
      
      return [
        producto.id,
        `"${producto.nombre}"`,
        producto.categoria?.nombre || 'Sin categoría',
        producto.stock,
        precioCompra.toFixed(2),
        producto.precioVenta?.toFixed(2) || '0.00',
        valorInventario.toFixed(2),
        ultimaVenta,
        totalVendido,
        diasSinVenta,
        estado
      ];
    });
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `productos_sin_movimiento_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  navegarAPanelAdmin() {
    this.router.navigate(['/panel-admin']);
  }

  verDetalleProducto(producto: any) {
    console.log('Ver detalle:', producto);
    const historial = this.historialVentas.get(producto.id);
    const ultimaVenta = historial && historial.ultimaVenta ?
      historial.ultimaVenta.toLocaleDateString('es-PE') : 'Nunca vendido';
    const totalVendido = historial ? historial.totalVendido : 0;
    
    alert(`📦 Detalle del producto:\n\n` +
          `Nombre: ${producto.nombre}\n` +
          `Stock: ${producto.stock} unidades\n` +
          `Precio Venta: S/ ${producto.precioVenta?.toFixed(2) || '0.00'}\n` +
          `Valor Inventario: S/ ${((producto.precioCompra || producto.precioVenta * 0.7) * producto.stock).toFixed(2)}\n` +
          `Última venta: ${ultimaVenta}\n` +
          `Total vendido: ${totalVendido} unidades`);
  }

  obtenerUltimaVentaTexto(productoId: number): string {
    const historial = this.historialVentas.get(productoId);
    if (!historial || !historial.ultimaVenta) {
      return 'Nunca vendido';
    }
    return historial.ultimaVenta.toLocaleDateString('es-PE');
  }

  obtenerDiasSinVenta(productoId: number): number {
    const historial = this.historialVentas.get(productoId);
    if (!historial || !historial.ultimaVenta) {
      return this.filtros.diasSinMovimiento * 2;
    }
    return Math.floor((new Date().getTime() - historial.ultimaVenta.getTime()) / (1000 * 60 * 60 * 24));
  }

  obtenerTotalVendido(productoId: number): number {
    const historial = this.historialVentas.get(productoId);
    return historial ? historial.totalVendido : 0;
  }

  formatearMoneda(monto: number): string {
    return `S/ ${monto.toFixed(2)}`;
  }

  formatearNumero(numero: number): string {
    return numero.toLocaleString('es-PE');
  }

  formatearPorcentaje(porcentaje: number): string {
    return `${porcentaje.toFixed(1)}%`;
  }
}