import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { appsettings } from '../config/appsettings';
import { Pedido } from '../models/pedido';
import { Factura } from '../models/factura';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private http = inject(HttpClient);
  private urlservicio = appsettings.apiurl + 'pedido';
  private repartidorUrl = appsettings.apiurl + 'repartidor'; // ✅ Agregar URL para repartidor


  // Manejo de errores
  private handleError(error: HttpErrorResponse) {
    console.error('Error completo:', error);
    
    if (error.status === 0) {
      return throwError(() => 'Error de conexión con el servidor');
    } else if (error.error instanceof ErrorEvent) {
      return throwError(() => `Error: ${error.error.message}`);
    } else {
      if (typeof error.error === 'string') {
        return throwError(() => error.error);
      } else {
        return throwError(() => error.error?.message || 'Error desconocido del servidor');
      }
    }
  }

  // Obtener pedidos por usuario
  obtenerPedidosPorUsuario(usuarioId: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.urlservicio}/usuario/${usuarioId}`)
      .pipe(catchError(this.handleError));
  }

  // Obtener pedido por ID
  obtenerPedido(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.urlservicio}/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  // Obtener pedido por número
  obtenerPedidoPorNumero(numeroPedido: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.urlservicio}/numero/${numeroPedido}`)
      .pipe(catchError(this.handleError));
  }

  // Crear nuevo pedido
  crearPedido(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.urlservicio}/crear`, pedido)
      .pipe(catchError(this.handleError));
  }

  // Actualizar estado del pedido
  actualizarEstado(id: number, estado: string): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.urlservicio}/${id}/estado`, { estado })
      .pipe(catchError(this.handleError));
  }

  // Cancelar pedido
  cancelarPedido(id: number): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.urlservicio}/${id}/cancelar`, {})
      .pipe(catchError(this.handleError));
  }

  // Obtener pedidos por estado
  obtenerPedidosPorEstado(estado: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.urlservicio}/estado/${estado}`)
      .pipe(catchError(this.handleError));
  }

  //mis cambios para logistico
  obtenerTodosLosPedidos(): Observable<Pedido[]> {
  return this.http.get<Pedido[]>(`${this.urlservicio}/todos`)
    .pipe(catchError(this.handleError));
  }
  // ✅ NUEVO: Obtener reporte de entrega por ID de pedido
  obtenerReportePorPedido(pedidoId: number): Observable<any> {
    return this.http.get<any>(`${this.repartidorUrl}/reporte/pedido/${pedidoId}`)
      .pipe(catchError(this.handleError));
  }

  // ✅ NUEVO: Obtener todos los reportes
  obtenerTodosLosReportes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.repartidorUrl}/reportes`)
      .pipe(catchError(this.handleError));
  }

  // ✅ NUEVO: Obtener reporte por ID
  obtenerReportePorId(reporteId: number): Observable<any> {
    return this.http.get<any>(`${this.repartidorUrl}/reporte/${reporteId}`)
      .pipe(catchError(this.handleError));
  }

  // ✅ NUEVO: Obtener reportes por repartidor
  obtenerReportesPorRepartidor(repartidorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.repartidorUrl}/reportes/${repartidorId}`)
      .pipe(catchError(this.handleError));
  }
  obtenerFactura(pedidoId: number){
    return this.http.get<Factura>(`http://localhost:8080/comprobante/${pedidoId}`);
  }
  calcularTotalPedido(detalles: any[]): number {
  return detalles.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
}
}