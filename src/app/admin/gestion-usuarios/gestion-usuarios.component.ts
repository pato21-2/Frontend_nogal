import { TraducirPipe } from '../../pipes/traducir.pipe';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service'; 
import { UsuarioService } from '../../services/usuario.service'; 
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TraducirPipe],
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.css']
})
export class GestionUsuariosComponent implements OnInit {
  private adminService = inject(AdminService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  cargando: boolean = true;
  procesando: boolean = false; // Para el botón de guardar
  
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  totalRegistros: number = 0;

  filtroRol: string = '';
  filtroBusqueda: string = '';

  kpis = { total: 0, activos: 0, admins: 0, logisticos: 0, repartidores: 0, clientes: 0 };
  puedeEditar: boolean = true;
  
  // Usuario temporal para el formulario
  usuarioSeleccionado: Partial<Usuario> = {};

  ngOnInit() {
    this.cargarUsuariosReales();
  }

  cargarUsuariosReales() {
    this.cargando = true;
    this.adminService.obtenerTodosUsuarios().subscribe({
      next: (data: any[]) => {
        this.usuarios = data.map((u, index) => ({
          ...u,
          // CORREGIDO: Se agregaron las comillas invertidas (backticks) para interpolar correctamente
          codigoUsuario: u.codigoUsuario || `USR-${(index + 1).toString().padStart(5, '0')}`,
          estado: u.estado || 'ACTIVO' 
        }));
        
        this.calcularKPIs();
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.cargando = false;
      }
    });
  }

  calcularKPIs() {
    this.kpis = {
      total: this.usuarios.length,
      activos: this.usuarios.filter(u => u.estado === 'ACTIVO').length,
      admins: this.usuarios.filter(u => (u.rol || '').toLowerCase().includes('admin')).length,
      logisticos: this.usuarios.filter(u => (u.rol || '').toLowerCase().includes('logistic')).length,
      repartidores: this.usuarios.filter(u => (u.rol || '').toLowerCase().includes('repart')).length,
      clientes: this.usuarios.filter(u => (u.rol || '').toLowerCase().includes('client')).length,
    };
  }

  aplicarFiltros() {
    // Asegurar conversión correcta a número para evitar bugs en el selector de cantidad por página
    const limite = Number(this.registrosPorPagina);

    let result = this.usuarios.filter(usuario => {
      const rolUsuario = (usuario.rol || '').toLowerCase();
      const coincideRol = !this.filtroRol || rolUsuario === this.filtroRol.toLowerCase();
      const busqueda = (this.filtroBusqueda || '').toLowerCase();
      
      const coincideBusqueda = !this.filtroBusqueda || 
        (usuario.nombres || '').toLowerCase().includes(busqueda) ||
        (usuario.apellidos || '').toLowerCase().includes(busqueda) ||
        (usuario.email || '').toLowerCase().includes(busqueda) ||
        (usuario.codigoUsuario || '').toLowerCase().includes(busqueda);
      
      return coincideRol && coincideBusqueda;
    });

    this.totalRegistros = result.length;
    const inicio = (this.paginaActual - 1) * limite;
    this.usuariosFiltrados = result.slice(inicio, inicio + limite);
  }

  limpiarFiltros() { 
    this.filtroRol = ''; 
    this.filtroBusqueda = ''; 
    this.paginaActual = 1; 
    this.aplicarFiltros(); 
  }

  cambiarPagina(pagina: number) { 
    const limite = Number(this.registrosPorPagina);
    if (pagina >= 1 && pagina <= Math.ceil(this.totalRegistros / limite)) { 
      this.paginaActual = pagina; 
      this.aplicarFiltros(); 
    } 
  }

  getClaseRol(rol?: string): string { 
    if (!rol) return 'bg-secondary'; 
    const r = rol.toLowerCase().trim(); 
    if (r.includes('admin')) return 'bg-danger'; 
    if (r.includes('logistic')) return 'bg-warning'; 
    if (r.includes('repart')) return 'bg-info'; 
    if (r.includes('client')) return 'bg-success'; 
    return 'bg-secondary'; 
  }

  getClaseEstado(estado?: string): string { 
    if (!estado) return 'bg-secondary'; 
    return estado.toUpperCase() === 'ACTIVO' ? 'bg-success' : 'bg-danger'; 
  }

  volverAlPanel() { 
    this.router.navigate(['/panel-admin']); 
  }

  exportar(formato: 'excel' | 'pdf') { 
    // CORREGIDO: Se agregaron las comillas invertidas correspondientes
    alert(`Generando reporte en ${formato.toUpperCase()}...`); 
  }

  // --- LÓGICA DE MODALES Y GUARDADO ---
  verDetalle(usuario: Usuario) { this.usuarioSeleccionado = { ...usuario }; }
  editarUsuario(usuario: Usuario) { this.usuarioSeleccionado = { ...usuario }; }
  confirmarDesactivacion(usuario: Usuario) { this.usuarioSeleccionado = { ...usuario }; }
  
  guardarUsuario() {
    this.procesando = true;
    const rolNuevo = (this.usuarioSeleccionado.rol || '').toLowerCase();
    const rolesAdmin = ['admin', 'logistico', 'repartidor'];

    if (rolesAdmin.includes(rolNuevo)) {
      this.usuarioService.crearUsuarioAdmin(this.usuarioSeleccionado as any).subscribe({
        next: () => {
          alert('✅ Usuario administrativo creado exitosamente');
          this.finalizarGuardado();
        },
        error: (err) => { this.procesando = false; alert('Error: ' + err.message); }
      });
    } else {
      this.usuarioService.registrarUsuario(this.usuarioSeleccionado as any).subscribe({
        next: () => {
          alert('✅ Usuario cliente creado exitosamente');
          this.finalizarGuardado();
        },
        error: (err) => { this.procesando = false; alert('Error: ' + err.message); }
      });
    }
  }

  finalizarGuardado() {
    this.procesando = false;
    document.getElementById('modalUsuario')?.click(); // Cierra el modal (truco de bootstrap)
    this.cargarUsuariosReales(); // Recarga la tabla
  }
}