import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { forkJoin } from 'rxjs';
import { ErpService } from '../../services/erp.service';

/**
 * Centro de Business Intelligence del ERP.
 * Consolida KPIs ejecutivos y visualizaciones de ventas, inventario,
 * finanzas y operación sobre los endpoints de /api/analytics.
 */
@Component({
  selector: 'app-bi-center',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxEchartsModule],
  templateUrl: './bi-center.component.html',
  styleUrls: ['./bi-center.component.css']
})
export class BiCenterComponent implements OnInit {
  private erp = inject(ErpService);

  cargando = true;
  error = '';
  pestania: 'ventas' | 'inventario' | 'finanzas' | 'operacion' = 'ventas';

  kpis: any = {};
  alertasStock: any[] = [];
  cuentasPorCobrar: any[] = [];
  cuentasPorPagar: any[] = [];
  pedidosRetrasados: any[] = [];
  clientesInactivos: any[] = [];

  // Opciones de gráficos
  chartVentasDiarias: EChartsOption = {};
  chartVentasMensuales: EChartsOption = {};
  chartTopProductos: EChartsOption = {};
  chartTopCategorias: EChartsOption = {};
  chartDistritos: EChartsOption = {};
  chartEmbudo: EChartsOption = {};
  chartHeatmap: EChartsOption = {};
  chartAbc: EChartsOption = {};
  chartFlujoCaja: EChartsOption = {};
  chartProveedores: EChartsOption = {};
  chartTopClientes: EChartsOption = {};
  chartRadarCategorias: EChartsOption = {};

  private readonly PALETA = ['#2E5B34', '#B4763B', '#4E7C4C', '#2F6F8F', '#B57A16', '#7A5FBF', '#C24141', '#5CB57F'];
  private readonly DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  ngOnInit(): void {
    forkJoin({
      kpis: this.erp.kpis(),
      diarias: this.erp.ventasDiarias(30),
      mensuales: this.erp.ventasMensuales(12),
      topProd: this.erp.topProductos(10),
      topCat: this.erp.topCategorias(8),
      distritos: this.erp.ventasPorDistrito(),
      embudo: this.erp.embudoPedidos(),
      heatmap: this.erp.heatmapPedidos(90),
      abc: this.erp.abcInventario(),
      flujo: this.erp.flujoCaja(6),
      proveedores: this.erp.topProveedores(),
      topCli: this.erp.topClientes(10),
      alertas: this.erp.alertasStock(),
      cxc: this.erp.cuentasPorCobrar(),
      cxp: this.erp.cuentasPorPagar(),
      retrasados: this.erp.pedidosRetrasados(3),
      inactivos: this.erp.clientesInactivos(60)
    }).subscribe({
      next: (d) => {
        this.kpis = d.kpis;
        this.alertasStock = d.alertas;
        this.cuentasPorCobrar = d.cxc;
        this.cuentasPorPagar = d.cxp;
        this.pedidosRetrasados = d.retrasados;
        this.clientesInactivos = d.inactivos;
        this.construirGraficos(d);
        this.cargando = false;
      },
      error: (e) => { this.error = String(e); this.cargando = false; }
    });
  }

  cambiarPestania(p: 'ventas' | 'inventario' | 'finanzas' | 'operacion'): void {
    this.pestania = p;
  }

  /** Variación % de ventas 30d vs. 30d anteriores. */
  get variacionVentas(): number {
    const actual = Number(this.kpis.ventas30d || 0);
    const anterior = Number(this.kpis.ventas30dAnterior || 0);
    if (!anterior) { return 0; }
    return Math.round(((actual - anterior) / anterior) * 100);
  }

  get totalPorCobrar(): number {
    return this.cuentasPorCobrar.reduce((s, c) => s + Number(c.monto || 0), 0);
  }
  get totalPorPagar(): number {
    return this.cuentasPorPagar.reduce((s, c) => s + Number(c.monto || 0), 0);
  }

  imprimir(): void { window.print(); }

  exportarCsv(nombre: string, filas: any[]): void {
    if (!filas.length) { return; }
    const claves = Object.keys(filas[0]);
    const csv = [claves.join(';')]
      .concat(filas.map(f => claves.map(k => `"${String(f[k] ?? '').replace(/"/g, '""')}"`).join(';')))
      .join('\n');
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    enlace.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  // ===== Construcción de gráficos =====

  private construirGraficos(d: any): void {
    const base = { textStyle: { fontFamily: 'Manrope' }, color: this.PALETA };

    this.chartVentasDiarias = {
      ...base,
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: d.diarias.map((x: any) => String(x.fecha)) },
      yAxis: { type: 'value', name: 'S/' },
      series: [{
        name: 'Ventas', type: 'line', smooth: true, areaStyle: { opacity: .15 },
        data: d.diarias.map((x: any) => Number(x.total))
      }]
    };

    this.chartVentasMensuales = {
      ...base,
      tooltip: { trigger: 'axis' },
      legend: { data: ['Ventas', 'Pedidos'] },
      grid: { left: 60, right: 50, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: d.mensuales.map((x: any) => `${x.mes}/${x.anio}`) },
      yAxis: [{ type: 'value', name: 'S/' }, { type: 'value', name: 'Pedidos' }],
      series: [
        { name: 'Ventas', type: 'bar', data: d.mensuales.map((x: any) => Number(x.total)), itemStyle: { borderRadius: [6, 6, 0, 0] } },
        { name: 'Pedidos', type: 'line', yAxisIndex: 1, smooth: true, data: d.mensuales.map((x: any) => Number(x.pedidos)) }
      ]
    };

    this.chartTopProductos = {
      ...base,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 150, right: 40, top: 20, bottom: 30 },
      xAxis: { type: 'value', name: 'S/' },
      yAxis: { type: 'category', data: d.topProd.map((x: any) => x.producto).reverse() },
      series: [{ name: 'Venta', type: 'bar', data: d.topProd.map((x: any) => Number(x.venta)).reverse(), itemStyle: { borderRadius: [0, 6, 6, 0] } }]
    };

    this.chartTopCategorias = {
      ...base,
      tooltip: { trigger: 'item', formatter: '{b}: S/ {c} ({d}%)' },
      series: [{
        name: 'Categorías', type: 'pie', radius: ['45%', '72%'],
        itemStyle: { borderRadius: 8, borderColor: 'transparent', borderWidth: 2 },
        label: { formatter: '{b}\n{d}%' },
        data: d.topCat.map((x: any) => ({ name: x.categoria, value: Number(x.venta) }))
      }]
    };

    this.chartDistritos = {
      ...base,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 120, right: 40, top: 20, bottom: 30 },
      xAxis: { type: 'value', name: 'S/' },
      yAxis: { type: 'category', data: d.distritos.map((x: any) => x.distrito).reverse() },
      series: [{ name: 'Ventas', type: 'bar', data: d.distritos.map((x: any) => Number(x.total)).reverse() }]
    };

    const ordenEmbudo = ['PENDIENTE', 'PROCESANDO', 'ENVIADO', 'ENTREGADO'];
    this.chartEmbudo = {
      ...base,
      tooltip: { trigger: 'item', formatter: '{b}: {c} pedidos' },
      series: [{
        name: 'Pedidos', type: 'funnel', sort: 'none', gap: 4,
        label: { position: 'inside', formatter: '{b}\n{c}' },
        data: ordenEmbudo.map(e => ({
          name: e,
          value: Number((d.embudo.find((x: any) => x.estado === e) || {}).pedidos || 0)
        }))
      }]
    };

    const maxHeat = Math.max(1, ...d.heatmap.map((x: any) => Number(x.pedidos)));
    this.chartHeatmap = {
      ...base,
      tooltip: { formatter: (p: any) => `${this.DIAS[p.value[1]]} ${p.value[0]}:00 — ${p.value[2]} pedidos` },
      grid: { left: 60, right: 20, top: 20, bottom: 60 },
      xAxis: { type: 'category', data: Array.from({ length: 24 }, (_, h) => `${h}h`) },
      yAxis: { type: 'category', data: this.DIAS },
      visualMap: { min: 0, max: maxHeat, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#E9F1E7', '#2E5B34'] } },
      series: [{
        name: 'Pedidos', type: 'heatmap',
        data: d.heatmap.map((x: any) => [Number(x.hora), Number(x.diaSemana) - 1, Number(x.pedidos)])
      }]
    };

    const clases = ['A', 'B', 'C'].map(c => ({
      name: `Clase ${c}`,
      value: d.abc.filter((x: any) => x.clase === c).length
    }));
    this.chartAbc = {
      ...base,
      tooltip: { trigger: 'item', formatter: '{b}: {c} productos' },
      series: [{
        name: 'ABC', type: 'pie', radius: '70%', roseType: 'radius',
        data: clases
      }]
    };

    this.chartFlujoCaja = {
      ...base,
      tooltip: { trigger: 'axis' },
      legend: { data: ['Ingresos', 'Egresos'] },
      grid: { left: 70, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: d.flujo.map((x: any) => `${x.mes}/${x.anio}`) },
      yAxis: { type: 'value', name: 'S/' },
      series: [
        { name: 'Ingresos', type: 'bar', stack: 'flujo', data: d.flujo.map((x: any) => Number(x.ingresos || 0)), itemStyle: { color: '#2E5B34' } },
        { name: 'Egresos', type: 'bar', stack: 'flujo', data: d.flujo.map((x: any) => -Number(x.egresos || 0)), itemStyle: { color: '#C24141' } }
      ]
    };

    this.chartProveedores = {
      ...base,
      tooltip: { trigger: 'axis' },
      legend: { data: ['Compras S/', 'Demora (días)'] },
      grid: { left: 70, right: 60, top: 40, bottom: 60 },
      xAxis: { type: 'category', data: d.proveedores.map((x: any) => x.proveedor), axisLabel: { rotate: 20 } },
      yAxis: [{ type: 'value', name: 'S/' }, { type: 'value', name: 'días' }],
      series: [
        { name: 'Compras S/', type: 'bar', data: d.proveedores.map((x: any) => Number(x.total)) },
        { name: 'Demora (días)', type: 'line', yAxisIndex: 1, data: d.proveedores.map((x: any) => Number(x.demoraPromedioDias || 0).toFixed(1)) }
      ]
    };

    this.chartTopClientes = {
      ...base,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 160, right: 40, top: 20, bottom: 30 },
      xAxis: { type: 'value', name: 'S/' },
      yAxis: { type: 'category', data: d.topCli.map((x: any) => x.cliente).reverse() },
      series: [{ name: 'Compras', type: 'bar', data: d.topCli.map((x: any) => Number(x.total)).reverse(), itemStyle: { color: '#B4763B', borderRadius: [0, 6, 6, 0] } }]
    };

    const cat5 = d.topCat.slice(0, 5);
    const maxCat = Math.max(1, ...cat5.map((x: any) => Number(x.venta)));
    this.chartRadarCategorias = {
      ...base,
      tooltip: {},
      radar: { indicator: cat5.map((x: any) => ({ name: x.categoria, max: maxCat })) },
      series: [{
        name: 'Ventas por categoría', type: 'radar',
        data: [{ value: cat5.map((x: any) => Number(x.venta)), name: 'Ventas', areaStyle: { opacity: .25 } }]
      }]
    };
  }
}
