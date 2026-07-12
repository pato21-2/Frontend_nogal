import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  // Variables para two-way data binding
  username: string = '';
  password: string = '';
  confirmarPassword: string = '';
  nombres: string = '';
  apellidos: string = '';
  email: string = '';
  telefono: string = '';
  tipoDocumento: string = 'DNI'; // Valor por defecto
  numeroDocumento: string = '';

  // Errores de validación mostrados en pantalla (accesibles)
  erroresValidacion: string[] = [];
  mensajeExito: string = '';

  // Métodos de validación (mantener igual)
  validarEmail(email: string): boolean {
    const emailPattern = /^[A-Za-z0-9+_.-]+@(.+)$/;
    return emailPattern.test(email);
  }

  validarTelefono(telefono: string): boolean {
    const telefonoPattern = /^9[0-9]{8}$/;
    return telefonoPattern.test(telefono);
  }

  validarDocumento(): boolean {
    if (this.tipoDocumento === 'DNI') {
      const dniPattern = /^[0-9]{8}$/;
      return dniPattern.test(this.numeroDocumento);
    } else if (this.tipoDocumento === 'CE') {
      const cePattern = /^[0-9]{9,12}$/;
      return cePattern.test(this.numeroDocumento);
    }
    return false;
  }

  validarFormulario(): string[] {
    const errores: string[] = [];

    // Validar campos obligatorios
    if (!this.username || !this.password || !this.nombres || !this.apellidos || 
        !this.email || !this.telefono || !this.tipoDocumento || !this.numeroDocumento) {
      errores.push('Este campo es obligatorio: revisa que todos los campos marcados con * estén completos.');
    }

    // Validar email
    if (this.email && !this.validarEmail(this.email)) {
      if (!this.email.includes('@')) {
        errores.push('Falta el símbolo @ en el correo electrónico.');
      } else {
        errores.push('El correo debe tener un formato válido, por ejemplo: usuario@dominio.com.');
      }
    }

    // Validar teléfono
    if (this.telefono && !this.validarTelefono(this.telefono)) {
      errores.push('El teléfono debe tener 9 dígitos y empezar con 9, por ejemplo: 987654321.');
    }

    // Validar documento
    if (this.numeroDocumento && !this.validarDocumento()) {
      if (this.tipoDocumento === 'DNI') {
        errores.push('El DNI debe tener exactamente 8 dígitos numéricos');
      } else {
        errores.push('El Carnet de Extranjería debe tener entre 9 y 12 dígitos numéricos');
      }
    }

    // Validar longitud de contraseña
    if (this.password && this.password.length < 8) {
      errores.push('La contraseña debe contener al menos 8 caracteres.');
    }

    // Validar contraseñas
    if (this.password && this.confirmarPassword && this.password !== this.confirmarPassword) {
      errores.push('Las contraseñas no coinciden: escribe la misma contraseña en ambos campos.');
    }

    return errores;
  }

  registrar() {
    this.mensajeExito = '';
    const errores = this.validarFormulario();

    if (errores.length > 0) {
      this.erroresValidacion = errores;
      // Llevar el foco visual a la lista de errores
      setTimeout(() => document.getElementById('errores-registro')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    this.erroresValidacion = [];

    const usuario = {
      username: this.username,
      password: this.password,
      nombres: this.nombres,
      apellidos: this.apellidos,
      email: this.email,
      telefono: this.telefono,
      tipoDocumento: this.tipoDocumento,
      numeroDocumento: this.numeroDocumento
    };

    console.log('Enviando usuario:', usuario);

    this.usuarioService.registrarUsuario(usuario).subscribe({
      next: (data) => {
        console.log('Registro exitoso:', data);
        alert("Usuario registrado exitosamente. Ahora puedes iniciar sesión.");
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error("Error en registro:", err);
        this.erroresValidacion = ['No se pudo completar el registro. Verifica tu conexión o inténtalo nuevamente; si el problema continúa, es posible que el usuario o el correo ya estén registrados.'];
      }
    });
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  // Método para limitar input a solo números
  soloNumeros(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  // Método para validar en tiempo real el documento según el tipo
  onTipoDocumentoChange() {
    // Limpiar número de documento cuando cambia el tipo
    this.numeroDocumento = '';
  }

  // Método para limitar la longitud del documento según el tipo
  onDocumentoInput() {
    if (this.tipoDocumento === 'DNI' && this.numeroDocumento.length > 8) {
      this.numeroDocumento = this.numeroDocumento.slice(0, 8);
    } else if (this.tipoDocumento === 'CE' && this.numeroDocumento.length > 12) {
      this.numeroDocumento = this.numeroDocumento.slice(0, 12);
    }
  }

  // Método para limitar la longitud del teléfono
  onTelefonoInput() {
    if (this.telefono.length > 9) {
      this.telefono = this.telefono.slice(0, 9);
    }
  }
}