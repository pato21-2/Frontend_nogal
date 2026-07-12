import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { UsuarioService } from './usuario.service'; // Se mantiene para la llamada HTTP

// Usamos la interfaz local, pero la hacemos coincidir con la realidad del backend
export interface Usuario {
  id?: number;
  username: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  rol?: string; // Propiedad opcional para evitar conflictos de tipo con el modelo fuente
  tipoDocumento: string;
  numeroDocumento: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/usuario';
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private usuarioService: UsuarioService // Inyectado para la llamada HTTP
  ) {
    // Cargar usuario desde localStorage al inicializar
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  // Login: Delega la llamada a UsuarioService y usa tap para manejar la sesión
  login(username: string, password: string): Observable<Usuario> {
    return this.usuarioService.login(username, password)
    .pipe(
     tap((usuario: Usuario) => {
          this.handleSuccessfulLogin(usuario);
        })
    );
  }
  
  // Método centralizado para guardar sesión y redirigir
  public handleSuccessfulLogin(usuario: Usuario): void {
    // 1. Guardar en localStorage (Sincrónico)
    localStorage.setItem('currentUser', JSON.stringify(usuario));
    localStorage.setItem('usuario', JSON.stringify(usuario));
    
    // 2. Notificar al BehaviorSubject (Sincrónico)
    this.currentUserSubject.next(usuario);

    // 3. Redirigir (Verificando rol)
    if (usuario.rol) {
      this.redirectByRole(usuario.rol);
    } else {
      console.error('⚠️ ERROR DE SEGURIDAD/DATOS: Usuario autenticado sin rol definido.');
      this.router.navigate(['/login']);
    }
  }

  // Registro
  register(usuario: any): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/crear`, usuario);
  }

  // Logout
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('usuario');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Obtener usuario actual
  getUsuarioActual(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.getUsuarioActual() !== null;
  }

  // Verificar rol
  hasRole(role: string): boolean {
    const user = this.getUsuarioActual();
    return user ? user.rol === role : false;
  }

  // Redirección por rol (Implementación ÚNICA)
  private redirectByRole(rol: string): void {
    switch (rol) {
      case 'repartidor':
        this.router.navigate(['/repartidor']);
        break;
      case 'admin':
        this.router.navigate(['/panel-admin']); // Ruta corregida
        break;
      case 'logistico':
        this.router.navigate(['/panel-logistico']); // Ruta corregida
        break;
      default:
        this.router.navigate(['/principal']);
        break;
    }
  }

  // Cambiar contraseña
  cambiarPassword(usuarioId: number, passwordActual: string, nuevaPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${usuarioId}/password`, {
      passwordActual,
      nuevaPassword
    });
  }
}