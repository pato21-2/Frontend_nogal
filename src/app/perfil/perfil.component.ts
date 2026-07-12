import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';
import { Usuario } from '../models/usuario';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  usuario: Usuario | null = null;
  usuarioOriginal: Usuario | null = null;
  cargando: boolean = true;
  guardando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';
  fechaRegistro: Date = new Date();

  ngOnInit() {
    this.cargarPerfilUsuario();
  }

  cargarPerfilUsuario() {
    this.cargando = true;
    const usuarioData = localStorage.getItem('usuario');
    
    if (!usuarioData) {
      this.mensajeError = 'No se encontró información del usuario. Por favor inicie sesión nuevamente.';
      this.cargando = false;
      return;
    }

    try {
      const usuarioLocal = JSON.parse(usuarioData);
      this.usuarioService.getUsuario(usuarioLocal.id).subscribe({
        next: (usuario) => {
          this.usuario = usuario;
          this.usuarioOriginal = { ...usuario }; // Guardar copia para cancelar
          this.cargando = false;
          console.log('✅ Perfil cargado:', usuario);
        },
        error: (err) => {
          console.error('❌ Error cargando perfil:', err);
          // Usar datos de localStorage como fallback
          this.usuario = usuarioLocal;
          this.usuarioOriginal = { ...usuarioLocal };
          this.cargando = false;
          this.mensajeError = 'No se pudo cargar la información actualizada del servidor. Mostrando información local.';
        }
      });
    } catch (error) {
      console.error('❌ Error parseando usuario:', error);
      this.mensajeError = 'Error al cargar la información del usuario.';
      this.cargando = false;
    }
  }

  guardarCambios() {
    if (!this.usuario || !this.usuario.id) {
      this.mensajeError = 'No se puede guardar: información del usuario incompleta.';
      return;
    }

    // Validaciones
    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    console.log('💾 Guardando cambios del perfil:', this.usuario);

    this.usuarioService.actualizarUsuario(this.usuario.id, this.usuario).subscribe({
      next: (usuarioActualizado) => {
        console.log('✅ Perfil actualizado:', usuarioActualizado);
        
        // Actualizar localStorage
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
        
        this.usuario = usuarioActualizado;
        this.usuarioOriginal = { ...usuarioActualizado };
        this.guardando = false;
        this.mensajeExito = 'Tus datos se han actualizado correctamente.';
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => {
          this.mensajeExito = '';
        }, 5000);
      },
      error: (err) => {
        console.error('❌ Error actualizando perfil:', err);
        this.guardando = false;
        this.mensajeError = 'Error al actualizar los datos: ' + err;
        
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => {
          this.mensajeError = '';
        }, 5000);
      }
    });
  }

  cancelarEdicion() {
    if (this.usuarioOriginal) {
      this.usuario = { ...this.usuarioOriginal };
      this.mensajeError = '';
      this.mensajeExito = '';
      console.log('↩️ Cambios cancelados, restaurando datos originales');
    }
  }

  validarFormulario(): boolean {
    if (!this.usuario) return false;

    // Validar email
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    if (!emailPattern.test(this.usuario.email)) {
      this.mensajeError = 'El formato del email no es válido.';
      return false;
    }

    // Validar teléfono
    const telefonoPattern = /^9[0-9]{8}$/;
    if (!telefonoPattern.test(this.usuario.telefono)) {
      this.mensajeError = 'El teléfono debe tener 9 dígitos y empezar con 9.';
      return false;
    }

    // Validar campos obligatorios
    if (!this.usuario.nombres?.trim() || !this.usuario.apellidos?.trim() || 
        !this.usuario.username?.trim() || !this.usuario.email?.trim() ||
        !this.usuario.telefono?.trim() || !this.usuario.tipoDocumento?.trim() ||
        !this.usuario.numeroDocumento?.trim()) {
      this.mensajeError = 'Todos los campos obligatorios deben estar completos.';
      return false;
    }

    return true;
  }

  // Verificar si hay cambios pendientes
  hayCambiosPendientes(): boolean {
    if (!this.usuario || !this.usuarioOriginal) return false;
    
    return this.usuario.nombres !== this.usuarioOriginal.nombres ||
           this.usuario.apellidos !== this.usuarioOriginal.apellidos ||
           this.usuario.username !== this.usuarioOriginal.username ||
           this.usuario.email !== this.usuarioOriginal.email ||
           this.usuario.telefono !== this.usuarioOriginal.telefono;
  }
}