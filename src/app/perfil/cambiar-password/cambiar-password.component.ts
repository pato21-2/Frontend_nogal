import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cambiar-password.component.html',
})
export class CambiarPasswordComponent {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  passwordData = {
    passwordActual: '',
    nuevaPassword: ''
  };
  confirmarPassword: string = '';
  guardando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  cambiarPassword() {
    // Validaciones
    if (this.passwordData.nuevaPassword !== this.confirmarPassword) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.passwordData.nuevaPassword.length < 6) {
      this.mensajeError = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }

    // Obtener usuario actual
    const usuarioData = localStorage.getItem('usuario');
    if (!usuarioData) {
      this.mensajeError = 'No se encontró información del usuario. Por favor inicie sesión nuevamente.';
      return;
    }

    const usuario = JSON.parse(usuarioData);
    this.guardando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.usuarioService.cambiarPassword(usuario.id, this.passwordData).subscribe({
      next: (response) => {
        console.log('✅ Contraseña cambiada exitosamente');
        this.guardando = false;
        this.mensajeExito = 'Tu contraseña ha sido cambiada exitosamente.';
        
        // Limpiar formulario
        this.passwordData = { passwordActual: '', nuevaPassword: '' };
        this.confirmarPassword = '';
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/perfil']);
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Error cambiando contraseña:', err);
        this.guardando = false;
        this.mensajeError = 'Error al cambiar la contraseña: ' + err;
      }
    });
  }
}