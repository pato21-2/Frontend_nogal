import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { appsettings } from '../config/appsettings';
import { Usuario } from '../models/usuario';
import { catchError, throwError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private urlservicio = appsettings.apiurl + "usuario";

  constructor() { }

  // Manejo de errores global
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

  // Login de usuario
  login(username: string, password: string) {
    const loginData = { username, password };
    return this.http.post<Usuario>(`${this.urlservicio}/login`, loginData)
      .pipe(catchError(this.handleError));
  }

  crearUsuarioAdmin(obj: Usuario) {
  let ruta = this.urlservicio + "/crear-admin";
  return this.http.post<Usuario>(ruta, obj)
    .pipe(catchError(this.handleError));
  }

  // Registrar nuevo usuario
  registrarUsuario(obj: Usuario) {
    let ruta = this.urlservicio + "/crear";
    return this.http.post<Usuario>(ruta, obj)
      .pipe(catchError(this.handleError));
  }

  // Obtener usuario por ID
  getUsuario(id: number) {
    return this.http.get<Usuario>(`${this.urlservicio}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Actualizar usuario
  actualizarUsuario(id: number, obj: Usuario) {
    return this.http.put<Usuario>(`${this.urlservicio}/${id}`, obj)
      .pipe(catchError(this.handleError));
  }

  // Cambiar contraseña - MÉTODO REAL
  cambiarPassword(id: number, passwordData: { passwordActual: string, nuevaPassword: string }) {
  console.log('🔐 Enviando solicitud de cambio de contraseña al backend');
  console.log('👤 Usuario ID:', id);
  console.log('📝 Datos:', passwordData);
  
  return this.http.put(`${this.urlservicio}/${id}/password`, passwordData, {
    responseType: 'text'  // ← Esto le dice a Angular que espere texto plano, no JSON
  })
  .pipe(catchError(this.handleError));
}
  

  // Eliminar usuario
  eliminarUsuario(id: number) {
    return this.http.delete<String>(`${this.urlservicio}/${id}`)
      .pipe(catchError(this.handleError));
  }
}