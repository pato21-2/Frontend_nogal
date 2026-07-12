import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { appsettings } from '../config/appsettings';

/** Línea de cotización enviada al backend. */
export interface DetalleCotizacion {
  id?: number;
  producto: { id: number; nombre?: string; precioVenta?: number };
  cantidad: number;
  precioUnitario?: number;
  descuentoPct?: number;
  subtotal?: number;
}

export interface Cotizacion {
  id?: number;
  numero?: string;
  cliente: { id: number; nombres?: string; apellidos?: string };
  vendedor?: { id: number } | null;
  fechaEmision?: string;
  vigenciaHasta?: string;
  estado?: string;
  subtotal?: number;
  descuento?: number;
  igv?: number;
  total?: number;
  observaciones?: string;
  version?: number;
  pedidoGeneradoId?: number;
  firmadoPor?: string;
  detalles: DetalleCotizacion[];
}

export interface InteraccionCliente {
  id?: number;
  cliente: { id: number };
  registradoPor?: { id: number } | null;
  tipo: string;
  notas: string;
  proximaAccion?: string;
  fecha?: string;
}

/**
 * Fachada del módulo ERP: analítica (BI/dashboard/asistente),
 * cotizaciones y CRM. Un único punto de acceso HTTP para los
 * nuevos módulos, siguiendo el patrón de servicios existente.
 */
@Injectable({ providedIn: 'root' })
export class ErpService {
  private http = inject(HttpClient);
  private analyticsUrl = appsettings.apiurl + 'api/analytics';
  private cotizacionUrl = appsettings.apiurl + 'api/cotizacion';
  private crmUrl = appsettings.apiurl + 'api/crm';

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      return throwError(() => 'Error de conexión con el servidor');
    }
    const mensaje = (error.error && (error.error.mensaje || error.error.message)) ||
      (typeof error.error === 'string' ? error.error : 'Error del servidor');
    return throwError(() => mensaje);
  }

  // ===== Analítica =====
  kpis(): Observable<any> { return this.get('/kpis'); }
  ventasDiarias(dias = 30): Observable<any[]> { return this.get(`/ventas-diarias?dias=${dias}`); }
  ventasMensuales(meses = 12): Observable<any[]> { return this.get(`/ventas-mensuales?meses=${meses}`); }
  heatmapPedidos(dias = 90): Observable<any[]> { return this.get(`/heatmap-pedidos?dias=${dias}`); }
  topProductos(limite = 10): Observable<any[]> { return this.get(`/top-productos?limite=${limite}`); }
  productosMenosVendidos(limite = 10): Observable<any[]> { return this.get(`/productos-menos-vendidos?limite=${limite}`); }
  productosSinMovimiento(dias = 60): Observable<any[]> { return this.get(`/productos-sin-movimiento?dias=${dias}`); }
  topCategorias(limite = 10): Observable<any[]> { return this.get(`/top-categorias?limite=${limite}`); }
  topClientes(limite = 10): Observable<any[]> { return this.get(`/top-clientes?limite=${limite}`); }
  ventasPorDistrito(): Observable<any[]> { return this.get('/ventas-por-distrito'); }
  topProveedores(): Observable<any[]> { return this.get('/top-proveedores'); }
  alertasStock(): Observable<any[]> { return this.get('/alertas-stock'); }
  kardex(productoId: number): Observable<any[]> { return this.get(`/kardex/${productoId}`); }
  abcInventario(): Observable<any[]> { return this.get('/abc-inventario'); }
  cuentasPorCobrar(): Observable<any[]> { return this.get('/cuentas-por-cobrar'); }
  cuentasPorPagar(): Observable<any[]> { return this.get('/cuentas-por-pagar'); }
  flujoCaja(meses = 6): Observable<any[]> { return this.get(`/flujo-caja?meses=${meses}`); }
  pedidosRetrasados(dias = 3): Observable<any[]> { return this.get(`/pedidos-retrasados?dias=${dias}`); }
  clientesInactivos(dias = 60): Observable<any[]> { return this.get(`/clientes-inactivos?dias=${dias}`); }
  embudoPedidos(): Observable<any[]> { return this.get('/embudo-pedidos'); }

  // ===== Cotizaciones =====
  listarCotizaciones(): Observable<Cotizacion[]> {
    return this.http.get<Cotizacion[]>(this.cotizacionUrl).pipe(catchError(this.handleError));
  }
  obtenerCotizacion(id: number): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.cotizacionUrl}/${id}`).pipe(catchError(this.handleError));
  }
  crearCotizacion(cotizacion: Cotizacion): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(this.cotizacionUrl, cotizacion).pipe(catchError(this.handleError));
  }
  nuevaVersionCotizacion(id: number, cambios: Partial<Cotizacion>): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.cotizacionUrl}/${id}/version`, cambios).pipe(catchError(this.handleError));
  }
  cambiarEstadoCotizacion(id: number, estado: string, firmadoPor?: string): Observable<Cotizacion> {
    return this.http.put<Cotizacion>(`${this.cotizacionUrl}/${id}/estado`, { estado, firmadoPor })
      .pipe(catchError(this.handleError));
  }
  convertirCotizacion(id: number, direccionId: number, tarjetaId: number, metodoPago: string): Observable<any> {
    return this.http.post(`${this.cotizacionUrl}/${id}/convertir`, { direccionId, tarjetaId, metodoPago })
      .pipe(catchError(this.handleError));
  }
  eliminarCotizacion(id: number): Observable<any> {
    return this.http.delete(`${this.cotizacionUrl}/${id}`).pipe(catchError(this.handleError));
  }

  // ===== CRM =====
  clientesCrm(): Observable<any[]> {
    return this.http.get<any[]>(`${this.crmUrl}/clientes`).pipe(catchError(this.handleError));
  }
  cliente360(id: number): Observable<any> {
    return this.http.get(`${this.crmUrl}/cliente/${id}`).pipe(catchError(this.handleError));
  }
  registrarInteraccion(interaccion: InteraccionCliente): Observable<any> {
    return this.http.post(`${this.crmUrl}/interaccion`, interaccion).pipe(catchError(this.handleError));
  }

  private get(ruta: string): Observable<any> {
    return this.http.get(this.analyticsUrl + ruta).pipe(catchError(this.handleError));
  }
}
