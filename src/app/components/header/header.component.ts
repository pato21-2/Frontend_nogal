import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private carritoService = inject(CarritoService);
  private themeService = inject(ThemeService);

  private carritoSubscription!: Subscription;
  cantidadCarrito: number = 0;

  ngOnInit() {
    // Suscribirse a los cambios del carrito
    this.carritoSubscription = this.carritoService.carrito$.subscribe(() => {
      this.actualizarCantidadCarrito();
    });
    
    // Inicializar cantidad
    this.actualizarCantidadCarrito();
  }

  ngOnDestroy() {
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  // Verificar si el usuario está autenticado
  estaAutenticado(): boolean {
    const usuario = localStorage.getItem('usuario');
    return !!usuario;
  }

  // Obtener el nombre del usuario para mostrar
  obtenerNombreUsuario(): string {
    const usuarioData = localStorage.getItem('usuario');
    if (usuarioData) {
      try {
        const usuario = JSON.parse(usuarioData);
        return usuario.nombres || 'Usuario';
      } catch (error) {
        return 'Usuario';
      }
    }
    return 'Usuario';
  }

  // Actualizar cantidad del carrito
  actualizarCantidadCarrito(): void {
    this.cantidadCarrito = this.carritoService.getCantidadTotal();
  }

  // Obtener cantidad del carrito para el template
  obtenerCantidadCarrito(): number {
    return this.cantidadCarrito;
  }

  // Ir a la página de login
  irALogin(): void {
    this.router.navigate(['/login']);
  }

  // Ir a la página de registro
  irARegistro(): void {
    this.router.navigate(['/registro']);
  }

  // Ir al carrito
  irAlCarrito(): void {
    this.router.navigate(['/carrito']);
  }

  // Cerrar sesión
  cerrarSesion(): void {
    const confirmar = confirm('¿Estás seguro de que deseas cerrar sesión?');
    if (confirmar) {
      // Limpiar carrito al cerrar sesión
      this.carritoService.limpiarCarrito();
      localStorage.removeItem('usuario');
      this.router.navigate(['/principal']);
      // Recargar la página para actualizar el estado
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }

  // Cambiar entre tema claro y oscuro
  cambiarTema(): void {
    this.themeService.toggle();
  }

  // Saber si el tema actual es oscuro (para el icono del botón)
  esTemaOscuro(): boolean {
    return this.themeService.esOscuro();
  }
}