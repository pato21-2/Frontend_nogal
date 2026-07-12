import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { appsettings } from '../config/appsettings';
import { Direccion } from '../models/direccion';

@Injectable({
  providedIn: 'root'
})
export class DireccionService {
  private http = inject(HttpClient);
  private urlservicio = appsettings.apiurl + 'direccion';

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

  // Obtener todas las direcciones de un usuario
  obtenerDireccionesPorUsuario(usuarioId: number): Observable<Direccion[]> {
    return this.http.get<Direccion[]>(`${this.urlservicio}/usuario/${usuarioId}`)
      .pipe(catchError(this.handleError));
  }

  // Obtener dirección principal del usuario
  obtenerDireccionPrincipal(usuarioId: number): Observable<Direccion> {
    return this.http.get<Direccion>(`${this.urlservicio}/usuario/${usuarioId}/principal`)
      .pipe(catchError(this.handleError));
  }

  // Obtener dirección por ID
  obtenerDireccion(id: number): Observable<Direccion> {
    return this.http.get<Direccion>(`${this.urlservicio}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Crear nueva dirección
  crearDireccion(direccion: Direccion): Observable<Direccion> {
    return this.http.post<Direccion>(`${this.urlservicio}/crear`, direccion)
      .pipe(catchError(this.handleError));
  }

  // Actualizar dirección
  actualizarDireccion(id: number, direccion: Direccion): Observable<Direccion> {
    return this.http.put<Direccion>(`${this.urlservicio}/${id}`, direccion)
      .pipe(catchError(this.handleError));
  }

  // Eliminar dirección
  eliminarDireccion(id: number): Observable<string> {
    return this.http.delete(`${this.urlservicio}/${id}`, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  // Marcar dirección como principal
  marcarComoPrincipal(id: number): Observable<Direccion> {
    return this.http.put<Direccion>(`${this.urlservicio}/${id}/principal`, {})
      .pipe(catchError(this.handleError));
  }
}