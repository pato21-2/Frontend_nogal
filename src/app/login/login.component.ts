// login.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
// import { UsuarioService } from '../services/usuario.service'; // NO NECESARIO si AuthService maneja la llamada
import { AuthService } from '../services/auth.service'; // ✅ USAR ESTE
import { FormsModule } from '@angular/forms';

@Component({
selector: 'app-login',
  standalone: true, // Asumiendo que es un componente Standalone
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html', // <-- ¡CLAVE!
  styleUrl: './login.component.css'     // <-- ¡CLAVE!
})
export class LoginComponent {
  // private usuarioService = inject(UsuarioService); // YA NO ES NECESARIO SI AUTHSERVICE LO HACE
  private authService = inject(AuthService); // ✅ INYECTAR AUTHSERVICE
  private router = inject(Router);

  // Variables para two-way data binding
  username: string = '';
  password: string = '';
  mensajeError: string = '';

  constructor() {}

  login() {
    this.mensajeError = '';
    if (!this.username || !this.password) {
      this.mensajeError = 'Este campo es obligatorio: ingresa tu usuario y tu contraseña para continuar.';
      return;
    }

    console.log('Intentando login:', this.username);

    // CAMBIO CLAVE: Llama directamente al método login del AuthService, que ahora maneja la sesión y la redirección.
    this.authService.login(this.username, this.password).subscribe({
      next: (usuario) => {
        console.log('Login exitoso:', usuario);
        // ¡No se necesita más código de manejo de sesión ni redirección aquí!
      },
      error: (err) => {
        console.error("Error en login:", err);
        this.mensajeError = 'El usuario o la contraseña no son correctos. Revisa tus datos e inténtalo nuevamente.';
      }
    });
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }
}