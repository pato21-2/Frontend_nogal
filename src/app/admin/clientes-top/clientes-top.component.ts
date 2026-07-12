import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { NgxEchartsModule } from 'ngx-echarts';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-clientes-top',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxEchartsModule],
  templateUrl: './clientes-top.component.html',
  styleUrls: ['./clientes-top.component.css']
})
export class ClientesTopComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private router = inject(Router);

  // Datos
  clientesTop: any[] = [];
  cargando: boolean = true;
  
  // Propiedades calculadas para el template
  totalGasto: number = 0;
  totalPedidos: number = 0;
  mejorClienteGasto: number = 0;
  
  // Opciones para ECharts
  chartOption: any = {};
  isChartReady: boolean = false;
  
  // Para animación en tiempo real
  private updateSubscription?: Subscription;
  animationInterval: number = 5000; // Actualizar cada 5 segundos

  ngOnInit() {
    this.cargarClientesTop();
  }

  ngOnDestroy() {
    // Limpiar suscripción al destruir componente
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  cargarClientesTop() {
    this.cargando = true;
    
    this.adminService.obtenerClientesTop().subscribe({
      next: (clientes) => {
        this.clientesTop = clientes;
        this.calcularPropiedades();
        this.actualizarGrafico();
        this.iniciarAnimacion();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando clientes top:', err);
        this.cargando = false;
      }
    });
  }

  // Método para calcular propiedades que se usarán en el template
  calcularPropiedades() {
    // Calcular total gastado
    this.totalGasto = this.clientesTop.reduce((total, cliente) => 
      total + (cliente.totalGastado || 0), 0);
    
    // Calcular total de pedidos
    this.totalPedidos = this.clientesTop.reduce((total, cliente) => 
      total + (cliente.totalPedidos || 0), 0);
    
    // Obtener gasto del mejor cliente
    this.mejorClienteGasto = this.clientesTop.length > 0 
      ? (this.clientesTop[0].totalGastado || 0) 
      : 0;
  }

  // Método para actualizar el gráfico
  actualizarGrafico() {
    if (!this.clientesTop || this.clientesTop.length === 0) {
      this.chartOption = this.crearGraficoVacio();
      this.isChartReady = true;
      return;
    }

    // Tomar los primeros 5 clientes para el gráfico
    const top5Clientes = this.clientesTop.slice(0, 5);
    
    // Preparar datos para el gráfico
    const nombresClientes = top5Clientes.map(cliente => 
      `${cliente.nombres?.substring(0, 1)}. ${cliente.apellidos}`.substring(0, 15)
    );
    
    const datosGastado = top5Clientes.map(cliente => cliente.totalGastado || 0);

    this.chartOption = {
      backgroundColor: 'transparent',
      title: {
        text: 'Top 5 Clientes por Gasto Total',
        subtext: 'Clientes que más han comprado en la tienda',
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
      xAxis: {
        max: 'dataMax',
        axisLabel: {
          color: '#000000',
          formatter: 'S/ {value}'
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: nombresClientes,
        inverse: true,
        animationDuration: 300,
        animationDurationUpdate: 300,
        max: 4, // Solo mostrar los 5 primeros
        axisLabel: {
          color: '#000000',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0'
          }
        }
      },
      series: [
        {
          realtimeSort: true,
          name: 'Gasto Total',
          type: 'bar',
          data: datosGastado,
          label: {
            show: true,
            position: 'right',
            valueAnimation: true,
            color: '#000000',
            formatter: 'S/ {c}'
          },
          itemStyle: {
            color: function(params: any) {
              // Gradiente de colores según la posición
              const colors = [
                '#38a169', // 1er lugar - verde
                '#3182ce', // 2do lugar - azul
                '#805ad5', // 3er lugar - morado
                '#d69e2e', // 4to lugar - dorado
                '#e53e3e'  // 5to lugar - rojo
              ];
              return colors[params.dataIndex] || '#38a169';
            }
          }
        }
      ],
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          const cliente = params[0];
          const clienteData = top5Clientes[cliente.dataIndex];
          return `
            <strong>${clienteData.nombres} ${clienteData.apellidos}</strong><br/>
            <span style="color:#3182ce">● Gasto Total:</span> S/ ${clienteData.totalGastado?.toFixed(2) || '0.00'}<br/>
            <span style="color:#38a169">● Pedidos Realizados:</span> ${clienteData.totalPedidos || 0}<br/>
            <span style="color:#d69e2e">● Última Compra:</span> ${clienteData.ultimaCompra ? new Date(clienteData.ultimaCompra).toLocaleDateString() : 'N/A'}
          `;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#38a169',
        textStyle: {
          color: '#000000'
        }
      },
      animationDuration: 0,
      animationDurationUpdate: 3000,
      animationEasing: 'linear',
      animationEasingUpdate: 'linear'
    };

    this.isChartReady = true;
  }

  // Método para crear gráfico vacío
  crearGraficoVacio() {
    return {
      title: {
        text: 'Top Clientes',
        subtext: 'No hay datos disponibles',
        left: 'center',
        textStyle: {
          color: '#000000'
        },
        subtextStyle: {
          color: '#4a5568'
        }
      },
      xAxis: {
        max: 100,
        axisLabel: {
          color: '#000000'
        }
      },
      yAxis: {
        type: 'category',
        data: ['Sin datos'],
        inverse: true,
        axisLabel: {
          color: '#000000'
        }
      },
      series: [
        {
          name: 'Gasto',
          type: 'bar',
          data: [0],
          label: {
            show: true,
            position: 'right',
            color: '#000000'
          }
        }
      ]
    };
  }

  // Iniciar animación en tiempo real
  iniciarAnimacion() {
    // Limpiar suscripción anterior si existe
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }

    // Crear nueva suscripción para actualizar datos
    this.updateSubscription = interval(this.animationInterval).subscribe(() => {
      this.actualizarDatosEnTiempoReal();
    });
  }

  // Simular actualización en tiempo real
  actualizarDatosEnTiempoReal() {
    this.adminService.obtenerClientesTop().subscribe({
      next: (clientes) => {
        this.clientesTop = clientes;
        this.calcularPropiedades();
        this.actualizarGrafico();
      },
      error: (err) => {
        console.error('Error actualizando clientes top:', err);
      }
    });
  }

  // Cambiar intervalo de actualización
  cambiarIntervalo(nuevoIntervalo: number) {
    this.animationInterval = nuevoIntervalo;
    this.iniciarAnimacion();
  }

  // Navegación
  volverAlPanel() {
    this.router.navigate(['/panel-admin']);
  }

  verDetalleCliente(clienteId: number) {
    console.log('Ver detalle del cliente:', clienteId);
    alert(`Ver detalle del cliente ID: ${clienteId}`);
  }

  // Método para calcular el promedio por pedido de un cliente
  calcularPromedioPorPedido(cliente: any): number {
    const totalGastado = cliente.totalGastado || 0;
    const totalPedidos = cliente.totalPedidos || 1; // Evitar división por cero
    return totalGastado / totalPedidos;
  }

  // Método para calcular porcentaje de participación
  calcularPorcentajeParticipacion(cantidad: number): number {
    const totalVendido = this.clientesTop.reduce((total, cliente) => 
      total + (cliente.cantidadTotal || cliente.totalPedidos || 0), 0);
    
    if (totalVendido === 0) return 0;
    return (cantidad / totalVendido) * 100;
  }

  // Formateadores
  formatearMoneda(monto: number): string {
    return `S/ ${monto?.toFixed(2) || '0.00'}`;
  }

  formatearFecha(fechaString: string): string {
    if (!fechaString) return 'N/A';
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }
}