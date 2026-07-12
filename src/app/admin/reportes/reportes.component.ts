import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { PedidoService } from '../../services/pedido.service';

// Importar ECharts
import { NgxEchartsModule } from 'ngx-echarts';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxEchartsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  private adminService = inject(AdminService);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);

  // Datos para reportes
  productosMasVendidos: any[] = [];
  estadisticas: any = {
    totalVentas30Dias: 0,
    promedioDiario: 0,
    totalPedidos30Dias: 0
  };
  fechaInicio: string = '';
  fechaFin: string = '';

  cargando: boolean = true;

  // Opciones para ECharts
  chartOption: any = {};
  isChartReady: boolean = false;

  ngOnInit() {
    this.establecerFechasPorDefecto();
    this.cargarReportes();
  }

  establecerFechasPorDefecto() {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    this.fechaInicio = primerDiaMes.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];
  }

  cargarReportes() {
    this.cargando = true;

    // Cargar estadísticas de ventas y productos más vendidos
    Promise.all([
      this.cargarEstadisticasVentas(),
      this.cargarProductosMasVendidos()
    ]).finally(() => {
      this.cargando = false;
    });
  }

  // NUEVO MÉTODO: Cargar estadísticas de ventas
  cargarEstadisticasVentas() {
    this.adminService.obtenerTendenciaVentas().subscribe({
      next: (data) => {
        this.estadisticas.totalVentas30Dias = data.totalVentas30Dias || 0;
        this.estadisticas.promedioDiario = data.promedioDiario || 0;
        this.estadisticas.totalPedidos30Dias = data.totalPedidos30Dias || 0;
      },
      error: (err) => {
        console.error('Error cargando estadísticas de ventas:', err);
        // Si falla, intentar calcular desde los pedidos
        this.calcularEstadisticasDesdePedidos();
      }
    });
  }

  // Método de respaldo: calcular estadísticas desde pedidos
  calcularEstadisticasDesdePedidos() {
    this.pedidoService.obtenerTodosLosPedidos().subscribe({
      next: (pedidos) => {
        // Filtrar pedidos de los últimos 30 días
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 30);
        
        const pedidos30Dias = pedidos.filter(pedido => {
          if (!pedido.fechaPedido) return false;
          const fechaPedido = new Date(pedido.fechaPedido);
          return fechaPedido >= fechaLimite;
        });

        // Calcular estadísticas
        this.estadisticas.totalVentas30Dias = pedidos30Dias.reduce((total, pedido) => 
          total + (pedido.total || 0), 0);
        this.estadisticas.totalPedidos30Dias = pedidos30Dias.length;
        this.estadisticas.promedioDiario = this.estadisticas.totalVentas30Dias / 30;
      },
      error: (err) => {
        console.error('Error calculando estadísticas desde pedidos:', err);
      }
    });
  }

  cargarProductosMasVendidos() {
    this.adminService.obtenerProductosMasVendidos().subscribe({
      next: (productos) => {
        this.productosMasVendidos = productos;
        this.actualizarGrafico();
      },
      error: (err) => {
        console.error('Error cargando productos más vendidos:', err);
      }
    });
  }

  // Método para actualizar el gráfico con datos reales
  actualizarGrafico() {
    if (!this.productosMasVendidos || this.productosMasVendidos.length === 0) {
      this.chartOption = {
        title: {
          text: 'Productos Más Vendidos',
          subtext: 'No hay datos disponibles',
          left: 'center',
          textStyle: {
            color: '#000000' // Cambiado a negro
          },
          subtextStyle: {
            color: '#4a5568' // Cambiado a gris oscuro
          }
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#38a169',
          textStyle: {
            color: '#000000' // Cambiado a negro
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: {
            color: '#000000' // Cambiado a negro
          }
        },
        series: [
          {
            name: 'Cantidad Vendida',
            type: 'pie',
            radius: '50%',
            data: [
              { value: 1, name: 'Sin datos disponibles' }
            ],
            label: {
              color: '#000000' // Cambiado a negro
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      this.isChartReady = true;
      return;
    }

    // Tomar los primeros 10 productos más vendidos
    const topProductos = this.productosMasVendidos.slice(0, 10);
    
    // Preparar datos para el gráfico
    const chartData = topProductos.map((producto: any) => ({
      value: producto.cantidadTotal || producto.ventasTotal || 0,
      name: producto.nombre
    }));

    // Calcular total de ventas para mostrar en subtítulo
    const totalVentas = topProductos.reduce((total: number, prod: any) => 
      total + (prod.cantidadTotal || prod.ventasTotal || 0), 0);

    this.chartOption = {
      backgroundColor: 'transparent',
      title: {
        text: 'Top 10 Productos Más Vendidos',
        subtext: `${totalVentas.toLocaleString()} unidades totales`,
        left: 'center',
        textStyle: {
          color: '#000000', // Cambiado a negro
          fontSize: 18,
          fontWeight: 'bold'
        },
        subtextStyle: {
          color: '#4a5568', // Cambiado a gris oscuro
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} unidades ({d}%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#38a169',
        textStyle: {
          color: '#000000' // Cambiado a negro
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          color: '#000000', // Cambiado a negro
          fontSize: 12
        },
        itemWidth: 20,
        itemHeight: 14
      },
      series: [
        {
          name: 'Unidades Vendidas',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#ffffff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center',
            color: '#000000' // Cambiado a negro
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: '#000000' // Cambiado a negro
            }
          },
          labelLine: {
            show: false
          },
          data: chartData,
          color: [
            '#38a169', '#3182ce', '#805ad5', '#d69e2e', '#e53e3e',
            '#ed8936', '#48bb78', '#4299e1', '#9f7aea', '#f56565'
          ]
        }
      ],
      // Efectos de animación
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };

    this.isChartReady = true;
  }

  // Método auxiliar para calcular el total vendido
  getTotalVendido(): number {
    if (!this.productosMasVendidos || this.productosMasVendidos.length === 0) {
      return 1; // Evitar división por cero
    }
    return this.productosMasVendidos.reduce((total, producto) => 
      total + (producto.cantidadTotal || 0), 0);
  }

  generarReporte() {
    alert('📊 Generando reporte personalizado...');
    // Aquí puedes implementar la lógica para generar reportes por fecha
  }

  exportarExcel() {
    alert('📄 Exportando a Excel...');
    // Aquí puedes implementar la exportación a Excel
  }

  volverAlPanel() {
    this.router.navigate(['/panel-admin']);
  }

  formatearMoneda(monto: number): string {
    return `S/ ${monto?.toFixed(2) || '0.00'}`;
  }
}