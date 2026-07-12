import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErpService } from '../../services/erp.service';

interface Mensaje {
  autor: 'usuario' | 'asistente';
  texto: string;
  tabla?: { columnas: string[]; filas: string[][] };
}

/**
 * Asistente empresarial del ERP.
 * Motor analítico basado en reglas: interpreta la pregunta por intención
 * y responde consultando los datos reales del negocio vía /api/analytics.
 * No requiere servicios externos ni conexión a modelos de terceros.
 */
@Component({
  selector: 'app-asistente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './asistente.component.html',
  styleUrls: ['./asistente.component.css']
})
export class AsistenteComponent {
  private erp = inject(ErpService);

  mensajes = signal<Mensaje[]>([{
    autor: 'asistente',
    texto: 'Hola 👋 Soy el asistente de Nogal. Analizo los datos reales de tu negocio. Pregúntame, por ejemplo: "¿Qué producto vendo más?", "¿Qué clientes debo contactar?", "¿Qué debo comprar esta semana?" o usa los accesos rápidos.'
  }]);
  pregunta = '';
  pensando = signal(false);

  readonly sugerencias = [
    '¿Qué producto vendo más?',
    '¿Qué clientes debo contactar?',
    '¿Por qué bajaron las ventas?',
    '¿Qué proveedor demora más?',
    '¿Qué debo comprar esta semana?',
    '¿Qué pedidos están retrasados?',
    '¿Qué clientes dejaron de comprar?',
    '¿Qué productos generan mayor utilidad?'
  ];

  enviar(texto?: string): void {
    const q = (texto ?? this.pregunta).trim();
    if (!q || this.pensando()) { return; }
    this.pregunta = '';
    this.mensajes.update(m => [...m, { autor: 'usuario', texto: q }]);
    this.pensando.set(true);
    this.responder(q.toLowerCase());
  }

  private responder(q: string): void {
    const s = (n: any) => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

    // ===== ¿Qué producto vendo más / menos? =====
    if (this.coincide(q, ['vendo más', 'más vendido', 'mas vendido', 'top producto', 'mejor producto'])) {
      this.erp.topProductos(5).subscribe({
        next: (top) => {
          if (!top.length) { return this.decir('Aún no hay ventas registradas para analizar.'); }
          const lider = top[0];
          this.decir(
            `Tu producto estrella es **${lider.producto}**: ${lider.unidades} unidades vendidas por ${s(lider.venta)}, dejando ${s(lider.utilidad)} de utilidad. Este es el top 5:`,
            { columnas: ['Producto', 'Unidades', 'Venta', 'Utilidad'],
              filas: top.map(t => [t.producto, String(t.unidades), s(t.venta), s(t.utilidad)]) });
        }, error: (e) => this.fallo(e)
      });

    } else if (this.coincide(q, ['vendo menos', 'menos vendido', 'peor producto', 'no se vende', 'sin movimiento'])) {
      this.erp.productosSinMovimiento(60).subscribe({
        next: (lista) => {
          if (!lista.length) { return this.decir('Buena noticia: todos tus productos activos registraron ventas en los últimos 60 días.'); }
          this.decir(
            `Hay ${lista.length} productos sin ninguna venta en 60 días. Considera promocionarlos o liquidarlos para liberar capital:`,
            { columnas: ['Producto', 'Stock inmovilizado', 'Precio'],
              filas: lista.slice(0, 8).map(p => [p.producto, String(p.stock), s(p.precioVenta)]) });
        }, error: (e) => this.fallo(e)
      });

    // ===== ¿Qué clientes debo contactar? / dejaron de comprar =====
    } else if (this.coincide(q, ['clientes debo contactar', 'contactar', 'dejaron de comprar', 'clientes inactivos', 'recuperar clientes'])) {
      this.erp.clientesInactivos(60).subscribe({
        next: (lista) => {
          if (!lista.length) { return this.decir('Excelente: ningún cliente con historial lleva más de 60 días sin comprar.'); }
          this.decir(
            `Detecté ${lista.length} clientes que compraban y llevan 60+ días inactivos. Prioriza a los de mayor gasto histórico — recuperar un cliente cuesta menos que ganar uno nuevo:`,
            { columnas: ['Cliente', 'Teléfono', 'Última compra', 'Gasto histórico'],
              filas: lista.slice(0, 8).map(c => [c.cliente, c.telefono || '—', String(c.ultimaCompra).slice(0, 10), s(c.totalHistorico)]) });
        }, error: (e) => this.fallo(e)
      });

    // ===== ¿Por qué bajaron las ventas? =====
    } else if (this.coincide(q, ['bajaron las ventas', 'ventas bajaron', 'caida de ventas', 'caída', 'por que bajaron', 'por qué bajaron'])) {
      forkJoin({
        kpis: this.erp.kpis(),
        retrasados: this.erp.pedidosRetrasados(3).pipe(catchError(() => of([]))),
        inactivos: this.erp.clientesInactivos(60).pipe(catchError(() => of([]))),
        alertas: this.erp.alertasStock().pipe(catchError(() => of([])))
      }).subscribe({
        next: ({ kpis, retrasados, inactivos, alertas }) => {
          const actual = Number(kpis.ventas30d), anterior = Number(kpis.ventas30dAnterior);
          const variacion = anterior ? Math.round(((actual - anterior) / anterior) * 100) : 0;
          if (variacion >= 0) {
            return this.decir(`En realidad tus ventas de los últimos 30 días (${s(actual)}) están ${variacion}% por ENCIMA del periodo anterior (${s(anterior)}). 📈 No hay caída que explicar.`);
          }
          const causas: string[] = [];
          if (alertas.length) { causas.push(`• ${alertas.length} productos están bajo stock mínimo (quiebres = ventas perdidas).`); }
          if (inactivos.length) { causas.push(`• ${inactivos.length} clientes recurrentes dejaron de comprar en 60 días.`); }
          if (retrasados.length) { causas.push(`• ${retrasados.length} pedidos llevan +3 días sin entregar (afecta recompra).`); }
          this.decir(`Tus ventas cayeron ${Math.abs(variacion)}% (${s(actual)} vs ${s(anterior)}). Causas probables detectadas en tus datos:\n${causas.join('\n') || '• No detecto causas operativas internas; revisa estacionalidad o competencia.'}\n\nRecomendación: repón el stock crítico y lanza una campaña de recontacto a los clientes inactivos.`);
        }, error: (e) => this.fallo(e)
      });

    // ===== ¿Qué proveedor demora más? =====
    } else if (this.coincide(q, ['proveedor demora', 'proveedor más lento', 'demora más', 'demora mas', 'proveedores'])) {
      this.erp.topProveedores().subscribe({
        next: (lista) => {
          if (!lista.length) { return this.decir('No hay compras a proveedores registradas todavía.'); }
          const ordenado = [...lista].sort((a, b) => Number(b.demoraPromedioDias || 0) - Number(a.demoraPromedioDias || 0));
          const lento = ordenado[0];
          this.decir(
            `El proveedor con mayor demora es **${lento.proveedor}**: ${Number(lento.demoraPromedioDias || 0).toFixed(1)} días promedio entre la emisión de la factura y el ingreso a almacén. Comparativa:`,
            { columnas: ['Proveedor', 'Compras', 'Total comprado', 'Demora prom. (días)'],
              filas: ordenado.map(p => [p.proveedor, String(p.compras), s(p.total), Number(p.demoraPromedioDias || 0).toFixed(1)]) });
        }, error: (e) => this.fallo(e)
      });

    // ===== ¿Qué debo comprar esta semana? =====
    } else if (this.coincide(q, ['debo comprar', 'que comprar', 'qué comprar', 'reabastecer', 'reponer stock', 'comprar esta semana'])) {
      this.erp.alertasStock().subscribe({
        next: (alertas) => {
          if (!alertas.length) { return this.decir('Tu inventario está sano: ningún producto está bajo su stock mínimo. No necesitas comprar esta semana. ✅'); }
          const costo = alertas.reduce((t, a) => t + Number(a.costoEstimado || 0), 0);
          this.decir(
            `Debes reponer ${alertas.length} productos que están en o bajo su stock mínimo. Inversión estimada: ${s(costo)}. Lista de compra sugerida (hasta el stock máximo):`,
            { columnas: ['Producto', 'Stock', 'Comprar', 'Costo est.', 'Proveedor'],
              filas: alertas.map(a => [a.producto, String(a.stock), String(a.comprarSugerido), s(a.costoEstimado), a.proveedor || '—']) });
        }, error: (e) => this.fallo(e)
      });

    // ===== ¿Qué pedidos están retrasados? =====
    } else if (this.coincide(q, ['pedidos retrasados', 'retrasados', 'pedidos pendientes', 'demorados', 'atrasados'])) {
      this.erp.pedidosRetrasados(3).subscribe({
        next: (lista) => {
          if (!lista.length) { return this.decir('Operación al día: no hay pedidos con más de 3 días sin entregar. 🚚'); }
          this.decir(
            `Atención: ${lista.length} pedidos llevan más de 3 días abiertos. Contacta a logística para priorizarlos:`,
            { columnas: ['Pedido', 'Cliente', 'Estado', 'Total'],
              filas: lista.map(p => [p.pedido, p.cliente, p.estado, s(p.total)]) });
        }, error: (e) => this.fallo(e)
      });

    // ===== ¿Qué productos generan mayor utilidad? =====
    } else if (this.coincide(q, ['mayor utilidad', 'más rentable', 'mas rentable', 'utilidad', 'margen', 'rentabilidad'])) {
      this.erp.topProductos(50).subscribe({
        next: (top) => {
          if (!top.length) { return this.decir('Aún no hay ventas para calcular utilidades.'); }
          const porUtilidad = [...top].sort((a, b) => Number(b.utilidad) - Number(a.utilidad)).slice(0, 5);
          this.decir(
            `Estos productos generan la mayor utilidad (precio de venta − costo de compra, por unidades vendidas). Enfoca tu marketing aquí:`,
            { columnas: ['Producto', 'Venta', 'Utilidad'],
              filas: porUtilidad.map(t => [t.producto, s(t.venta), s(t.utilidad)]) });
        }, error: (e) => this.fallo(e)
      });

    // ===== Resumen / estado del negocio =====
    } else if (this.coincide(q, ['resumen', 'como va', 'cómo va', 'estado del negocio', 'kpis', 'dashboard', 'hoy'])) {
      this.erp.kpis().subscribe({
        next: (k) => this.decir(
          `📊 Resumen ejecutivo:\n` +
          `• Hoy: ${s(k.ventasHoy)} en ${k.pedidosHoy} pedidos.\n` +
          `• Mes: ${s(k.ventasMes)} con utilidad de ${s(k.utilidadMes)} (margen ${k.margenMesPct}%).\n` +
          `• Ticket promedio (30 d): ${s(k.ticketPromedio30d)}.\n` +
          `• Pedidos: ${k.pedidosPendientes} pendientes, ${k.pedidosEnviados} en camino, ${k.pedidosEntregados} entregados.\n` +
          `• Clientes nuevos (30 d): ${k.clientesNuevos30d}.\n` +
          `• Inventario: ${k.stockCritico} productos en stock crítico; valorizado en ${s(k.valorInventario)}.`),
        error: (e) => this.fallo(e)
      });

    // ===== Cobranza =====
    } else if (this.coincide(q, ['por cobrar', 'cobranza', 'deben', 'por pagar', 'deudas'])) {
      forkJoin({ cxc: this.erp.cuentasPorCobrar(), cxp: this.erp.cuentasPorPagar() }).subscribe({
        next: ({ cxc, cxp }) => {
          const totalCxc = cxc.reduce((t, c) => t + Number(c.monto || 0), 0);
          const totalCxp = cxp.reduce((t, c) => t + Number(c.monto || 0), 0);
          const vencidas = cxp.filter(c => c.vencida).length;
          this.decir(
            `💰 Posición de cobros y pagos:\n` +
            `• Por cobrar: ${s(totalCxc)} en ${cxc.length} pedidos contraentrega aún no entregados.\n` +
            `• Por pagar a proveedores: ${s(totalCxp)} en ${cxp.length} facturas a crédito${vencidas ? ` (⚠ ${vencidas} vencidas)` : ''}.`);
        }, error: (e) => this.fallo(e)
      });

    } else {
      this.decir('Puedo analizar ventas, productos, clientes, proveedores, inventario, pedidos y cobranza con tus datos reales. Prueba una de las preguntas sugeridas o reformula, por ejemplo: "¿Qué debo comprar esta semana?"');
    }
  }

  private coincide(q: string, claves: string[]): boolean {
    return claves.some(c => q.includes(c));
  }

  private decir(texto: string, tabla?: Mensaje['tabla']): void {
    this.mensajes.update(m => [...m, { autor: 'asistente', texto, tabla }]);
    this.pensando.set(false);
    setTimeout(() => document.querySelector('.chat-mensajes')?.scrollTo({ top: 999999, behavior: 'smooth' }));
  }

  private fallo(e: any): void {
    this.decir('No pude consultar los datos: ' + String(e));
  }
}
