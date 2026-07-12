import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { PedidoService } from '../../services/pedido.service';
import { NgxEchartsModule } from 'ngx-echarts';

@Component({
  selector: 'app-ventas-evolucion',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxEchartsModule],
  templateUrl: './ventas-evolucion.component.html',
  styleUrls: ['./ventas-evolucion.component.css']
})
export class VentasEvolucionComponent implements OnInit {
  private adminService = inject(AdminService);
  private pedidoService = inject(PedidoService);
  private router = inject(Router);

  // Datos REALES de la base de datos
  evolucionVentas: any[] = [];
  todosLosPedidos: any[] = [];
  cargando: boolean = true;
  
  // Filtros
  periodoSeleccionado: string = '30dias';
  fechaInicio: string = '';
  fechaFin: string = '';
  
  // Opciones para ECharts
  chartOption: any = {};
  isChartReady: boolean = false;

  // Estadísticas REALES como en tu PanelAdmin
  estadisticas = {
    totalVentas: 0,
    promedioDiario: 0,
    diaMaxVentas: { fecha: '', ventas: 0 },
    diaMinVentas: { fecha: '', ventas: 0 },
    tendencia: 'estable' as 'ascendente' | 'descendente' | 'estable',
    totalPedidosPeriodo: 0
  };

  // Variable para Math (soluciona el error del template)
  Math = Math;

  ngOnInit() {
    this.establecerFechasPorDefecto();
    this.cargarDatosReales();
  }

  establecerFechasPorDefecto() {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    this.fechaInicio = hace30Dias.toISOString().split('T')[0];
    this.fechaFin = hoy.toISOString().split('T')[0];
  }

  cargarDatosReales() {
    this.cargando = true;
    
    // 1. Primero cargar todos los pedidos (como haces en PanelAdmin)
    this.pedidoService.obtenerTodosLosPedidos().subscribe({
      next: (pedidos) => {
        this.todosLosPedidos = pedidos;
        console.log('📦 Pedidos cargados:', pedidos.length);
        
        // 2. Procesar los datos para la evolución de ventas
        this.procesarDatosParaEvolucion();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando pedidos:', err);
        this.cargando = false;
      }
    });
  }

  procesarDatosParaEvolucion() {
    if (!this.todosLosPedidos || this.todosLosPedidos.length === 0) {
      console.warn('⚠️ No hay pedidos para procesar');
      this.crearDatosEjemplo(); // Solo para desarrollo
      return;
    }

    // Obtener los últimos 30 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    
    // Filtrar pedidos de los últimos 30 días
    const pedidos30Dias = this.todosLosPedidos.filter(pedido => {
      if (!pedido.fechaPedido) return false;
      const fechaPedido = new Date(pedido.fechaPedido);
      return fechaPedido >= fechaLimite;
    });

    console.log('📊 Pedidos de los últimos 30 días:', pedidos30Dias.length);

    // Crear mapa para agrupar ventas por día
    const ventasPorDiaMap = new Map<string, number>();
    
    // Inicializar todos los días de los últimos 30 días con 0
    const ultimos30Dias = this.getUltimos30Dias();
    ultimos30Dias.forEach(dia => {
      const fechaStr = dia.fecha.toISOString().split('T')[0];
      ventasPorDiaMap.set(fechaStr, 0);
    });

    // Sumar ventas por día
    pedidos30Dias.forEach(pedido => {
      if (pedido.fechaPedido && pedido.total) {
        const fechaPedido = new Date(pedido.fechaPedido);
        const fechaStr = fechaPedido.toISOString().split('T')[0];
        const ventasActuales = ventasPorDiaMap.get(fechaStr) || 0;
        ventasPorDiaMap.set(fechaStr, ventasActuales + Number(pedido.total));
      }
    });

    // Convertir mapa a array para la evolución de ventas
    this.evolucionVentas = ultimos30Dias.map(dia => {
      const fechaStr = dia.fecha.toISOString().split('T')[0];
      const ventas = ventasPorDiaMap.get(fechaStr) || 0;
      
      return {
        fecha: fechaStr,
        nombre: dia.nombre,
        ventas: ventas
      };
    });

    // Calcular estadísticas
    this.calcularEstadisticas();
    
    // Actualizar gráfico
    this.actualizarGrafico();
  }

  getUltimos30Dias() {
    const dias = [];
    for (let i = 29; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const nombre = fecha.toLocaleDateString('es-PE', { weekday: 'short' });
      dias.push({
        fecha: fecha,
        nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1)
      });
    }
    return dias;
  }

  calcularEstadisticas() {
    if (!this.evolucionVentas || this.evolucionVentas.length === 0) {
      return;
    }

    // Calcular total de ventas del período
    this.estadisticas.totalVentas = this.evolucionVentas.reduce((total, dia) => 
      total + (dia.ventas || 0), 0);

    // Calcular promedio diario
    this.estadisticas.promedioDiario = this.estadisticas.totalVentas / this.evolucionVentas.length;

    // Encontrar día con máximo y mínimo de ventas
    let maxVentas = -Infinity;
    let minVentas = Infinity;
    let diaMaxIndex = -1;
    let diaMinIndex = -1;

    this.evolucionVentas.forEach((dia, index) => {
      const ventas = dia.ventas || 0;
      if (ventas > maxVentas) {
        maxVentas = ventas;
        diaMaxIndex = index;
      }
      if (ventas < minVentas) {
        minVentas = ventas;
        diaMinIndex = index;
      }
    });

    if (diaMaxIndex !== -1) {
      this.estadisticas.diaMaxVentas = {
        fecha: this.evolucionVentas[diaMaxIndex].fecha,
        ventas: this.evolucionVentas[diaMaxIndex].ventas || 0
      };
    }

    if (diaMinIndex !== -1) {
      this.estadisticas.diaMinVentas = {
        fecha: this.evolucionVentas[diaMinIndex].fecha,
        ventas: this.evolucionVentas[diaMinIndex].ventas || 0
      };
    }

    // Calcular tendencia (similar a tu PanelAdmin)
    if (this.evolucionVentas.length >= 2) {
      const primerTercio = Math.floor(this.evolucionVentas.length / 3);
      const ultimoTercio = this.evolucionVentas.length - primerTercio;
      
      const promedioInicial = this.evolucionVentas
        .slice(0, primerTercio)
        .reduce((sum, dia) => sum + (dia.ventas || 0), 0) / primerTercio;
      
      const promedioFinal = this.evolucionVentas
        .slice(ultimoTercio)
        .reduce((sum, dia) => sum + (dia.ventas || 0), 0) / primerTercio;
      
      const diferenciaPorcentual = ((promedioFinal - promedioInicial) / (promedioInicial || 1)) * 100;
      
      if (diferenciaPorcentual > 10) {
        this.estadisticas.tendencia = 'ascendente';
      } else if (diferenciaPorcentual < -10) {
        this.estadisticas.tendencia = 'descendente';
      } else {
        this.estadisticas.tendencia = 'estable';
      }
    }

    // Calcular total de pedidos en el período
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);
    this.estadisticas.totalPedidosPeriodo = this.todosLosPedidos.filter(pedido => {
      if (!pedido.fechaPedido) return false;
      const fechaPedido = new Date(pedido.fechaPedido);
      return fechaPedido >= fechaLimite;
    }).length;
  }

  actualizarGrafico() {
    if (!this.evolucionVentas || this.evolucionVentas.length === 0) {
      this.chartOption = this.crearGraficoVacio();
      this.isChartReady = true;
      return;
    }

    // Preparar datos para el gráfico
    const fechas = this.evolucionVentas.map(dia => dia.nombre);
    const ventas = this.evolucionVentas.map(dia => dia.ventas || 0);

    // Calcular promedio para la línea de referencia
    const promedio = ventas.reduce((sum, v) => sum + v, 0) / ventas.length;

    this.chartOption = {
      backgroundColor: 'transparent',
      title: {
        text: 'Evolución de Ventas - Últimos 30 Días',
        subtext: `Total: ${this.formatearMoneda(this.estadisticas.totalVentas)} | ${this.estadisticas.totalPedidosPeriodo} pedidos`,
        left: 'center',
        textStyle: {
          color: '#000000',
          fontSize: 18,
          fontWeight: 'bold'
        },
        subtextStyle: {
          color: '#4a5568',
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const punto = params[0];
          const dataIndex = punto.dataIndex;
          const dia = this.evolucionVentas[dataIndex];
          
          const fecha = new Date(dia.fecha);
          const fechaCompleta = fecha.toLocaleDateString('es-PE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          return `
            <div style="font-weight: bold; margin-bottom: 5px;">${fechaCompleta}</div>
            <div style="color: #3182ce; margin: 3px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: #3182ce; border-radius: 50%; margin-right: 5px;"></span>
              Ventas: <strong>${this.formatearMoneda(dia.ventas)}</strong>
            </div>
            <div style="color: #38a169; margin: 3px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background: #38a169; border-radius: 50%; margin-right: 5px;"></span>
              Comparación: <strong>${((dia.ventas / promedio - 1) * 100).toFixed(1)}%</strong> vs promedio
            </div>
          `;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#3182ce',
        borderWidth: 1,
        borderRadius: 8,
        padding: [10, 15],
        textStyle: {
          color: '#000000',
          fontSize: 13
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: fechas,
        axisLabel: {
          color: '#000000',
          rotate: 45,
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0'
          }
        },
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: {
        type: 'value',
        name: 'Ventas (S/)',
        nameTextStyle: {
          color: '#000000',
          fontSize: 12
        },
        axisLabel: {
          color: '#000000',
          formatter: (value: number) => {
            if (value >= 1000) return `S/ ${(value/1000).toFixed(0)}k`;
            return `S/ ${value}`;
          },
          fontSize: 11
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e2e8f0'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f7fafc',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: 'Ventas Diarias',
          type: 'line',
          data: ventas,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: '#3182ce'
          },
          itemStyle: {
            color: '#3182ce',
            borderColor: '#ffffff',
            borderWidth: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(49, 130, 206, 0.3)'
              }, {
                offset: 1, color: 'rgba(49, 130, 206, 0.05)'
              }]
            }
          },
          markLine: {
            silent: true,
            lineStyle: {
              color: '#38a169',
              type: 'dashed',
              width: 2
            },
            data: [{
              yAxis: promedio,
              label: {
                formatter: `Promedio: ${this.formatearMoneda(promedio)}`,
                position: 'insideEndTop',
                color: '#38a169',
                fontSize: 11
              }
            }]
          }
        }
      ],
      visualMap: {
        top: 50,
        right: 10,
        pieces: [
          { gt: promedio * 1.5, label: 'Excelente', color: '#38a169' },
          { gt: promedio * 1.2, lte: promedio * 1.5, label: 'Bueno', color: '#3182ce' },
          { gt: promedio * 0.8, lte: promedio * 1.2, label: 'Normal', color: '#d69e2e' },
          { lte: promedio * 0.8, label: 'Bajo', color: '#e53e3e' }
        ],
        outOfRange: {
          color: '#999'
        }
      }
    };

    this.isChartReady = true;
  }

  crearGraficoVacio() {
    return {
      title: {
        text: 'Evolución de Ventas',
        subtext: 'No hay datos disponibles para el período seleccionado',
        left: 'center',
        textStyle: {
          color: '#000000',
          fontSize: 16
        },
        subtextStyle: {
          color: '#4a5568',
          fontSize: 13
        }
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLabel: {
          color: '#000000'
        }
      },
      yAxis: {
        type: 'value',
        name: 'Ventas (S/)',
        nameTextStyle: {
          color: '#000000'
        },
        axisLabel: {
          color: '#000000'
        }
      },
      series: [
        {
          type: 'line',
          data: [],
          smooth: true
        }
      ]
    };
  }

  // Método para desarrollo (solo si no hay datos)
  crearDatosEjemplo() {
    console.log('📊 Creando datos de ejemplo para desarrollo...');
    
    const fechas = [];
    const hoy = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() - i);
      
      // Generar ventas aleatorias (menores para simular realidad)
      const ventasBase = 500 + (i * 10); // Tendencia leve ascendente
      const variacion = Math.random() * 200 - 100;
      const ventas = Math.max(0, ventasBase + variacion);
      
      const diaSemana = fecha.toLocaleDateString('es-PE', { weekday: 'short' });
      
      fechas.push({
        fecha: fecha.toISOString().split('T')[0],
        nombre: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
        ventas: Math.round(ventas)
      });
    }
    
    this.evolucionVentas = fechas;
    this.calcularEstadisticas();
    this.actualizarGrafico();
  }

  cambiarPeriodo(nuevoPeriodo: string) {
    this.periodoSeleccionado = nuevoPeriodo;
    this.cargarDatosReales();
  }

  aplicarFiltroFechas() {
    if (this.fechaInicio && this.fechaFin) {
      console.log('🔍 Aplicando filtro personalizado:', this.fechaInicio, '->', this.fechaFin);
      // Aquí implementarías la lógica para filtrar por fechas específicas
      alert(`Filtrando desde ${this.fechaInicio} hasta ${this.fechaFin}`);
      this.cargarDatosReales();
    } else {
      alert('Por favor seleccione ambas fechas');
    }
  }

  exportarDatos() {
    console.log('📊 Exportando datos...');
    
    // Crear CSV
    const headers = ['Fecha', 'Día', 'Ventas (S/)', 'Comparación vs Promedio'];
    const rows = this.evolucionVentas.map(dia => [
      dia.fecha,
      dia.nombre,
      dia.ventas.toFixed(2),
      `${((dia.ventas / this.estadisticas.promedioDiario - 1) * 100).toFixed(1)}%`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `evolucion-ventas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('✅ Datos exportados exitosamente');
  }

  volverAlPanel() {
    this.router.navigate(['/panel-admin']);
  }

  // Métodos auxiliares (igual que tu PanelAdmin)
  obtenerIconoTendencia(): string {
    switch (this.estadisticas.tendencia) {
      case 'ascendente': return 'bi-arrow-up-right';
      case 'descendente': return 'bi-arrow-down-right';
      default: return 'bi-arrow-right';
    }
  }

  obtenerColorTendencia(): string {
    switch (this.estadisticas.tendencia) {
      case 'ascendente': return 'text-success';
      case 'descendente': return 'text-danger';
      default: return 'text-warning';
    }
  }

  formatearMoneda(monto: number): string {
    return `S/ ${(monto || 0).toFixed(2)}`;
  }

  formatearFecha(fechaString: string): string {
    if (!fechaString) return 'N/A';
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  recargarDatos() {
    this.cargando = true;
    this.cargarDatosReales();
  }
}