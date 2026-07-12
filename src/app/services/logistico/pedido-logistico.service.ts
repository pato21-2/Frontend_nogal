// services/logistico/pedido-logistico.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { appsettings } from '../../config/appsettings';
import { Pedido } from '../../models/pedido';

@Injectable({
  providedIn: 'root'
})
export class PedidoLogisticoService {
  private http = inject(HttpClient);
  private urlservicio = appsettings.apiurl + "pedido";

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error completo:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error.status === 0) {
      errorMessage = 'Error de conexión con el servidor';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // El backend devolvió un código de error
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('📝 Mensaje de error procesado:', errorMessage);
    return throwError(() => errorMessage);
  }

  // Obtener todos los pedidos (para logístico)
  obtenerTodosPedidos(): Observable<Pedido[]> {
    console.log('🔄 Solicitando todos los pedidos a:', this.urlservicio);
    return this.http.get<Pedido[]>(this.urlservicio)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener pedidos por estado
  obtenerPedidosPorEstado(estado: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.urlservicio}/estado/${estado}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Actualizar estado del pedido
  actualizarEstado(pedidoId: number, estado: string): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.urlservicio}/${pedidoId}/estado`, { estado })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener pedido por ID
  obtenerPedido(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.urlservicio}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Cancelar pedido
  cancelarPedido(pedidoId: number): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.urlservicio}/${pedidoId}/cancelar`, {})
      .pipe(
        catchError(this.handleError)
      );
  }
}