import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { appsettings } from '../config/appsettings';
import { Tarjeta } from '../models/tarjeta';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TarjetaService {
  private http = inject(HttpClient);
  private urlservicio = appsettings.apiurl + "tarjeta";

  constructor() { }

  // Manejo de errores mejorado
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

  listarTarjetas(usuarioId: number): Observable<Tarjeta[]> {
    return this.http.get<Tarjeta[]>(`${this.urlservicio}/usuario/${usuarioId}`)
      .pipe(catchError(this.handleError));
  }

  crearTarjeta(tarjeta: any): Observable<Tarjeta> {
    console.log('📤 Enviando tarjeta al backend:', tarjeta);
    return this.http.post<Tarjeta>(`${this.urlservicio}/crear`, tarjeta)
      .pipe(catchError(this.handleError));
  }

  actualizarTarjeta(id: number, tarjeta: Tarjeta): Observable<Tarjeta> {
    return this.http.put<Tarjeta>(`${this.urlservicio}/${id}`, tarjeta)
      .pipe(catchError(this.handleError));
  }

  eliminarTarjeta(id: number): Observable<string> {
  return this.http.delete<string>(`${this.urlservicio}/${id}`, {
    // Asegurar que maneje la respuesta como texto
    responseType: 'text' as 'json'
  });
}

  establecerPredeterminada(id: number): Observable<Tarjeta> {
    return this.http.put<Tarjeta>(`${this.urlservicio}/${id}/predeterminada`, {})
      .pipe(catchError(this.handleError));
  }

  getTarjeta(id: number): Observable<Tarjeta> {
    return this.http.get<Tarjeta>(`${this.urlservicio}/${id}`)
      .pipe(catchError(this.handleError));
  }
}