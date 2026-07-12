// app.routes.ts - ACTUALIZADO PARA STANDALONE
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './registro/registro.component';
import { PrincipalComponent } from './principal/principal.component';
import { PanelLogisticoComponent } from './logistico/panel-logistico/panel-logistico.component';
import { PanelAdminComponent } from './admin/panel-admin/panel-admin.component';
import { CarritoComponent } from './carrito/carrito.component';
import { PerfilComponent } from './perfil/perfil.component';
import { CambiarPasswordComponent } from './perfil/cambiar-password/cambiar-password.component';
import { MisTarjetasComponent } from './perfil/mis-tarjetas/mis-tarjetas.component';

export const routes: Routes = [
  { path: '', redirectTo: '/principal', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'principal', component: PrincipalComponent },
  { path: 'panel-logistico', component: PanelLogisticoComponent },
  { path: 'panel-admin', component: PanelAdminComponent },
  
  
  // ✅ ACTUALIZAR RUTA PARA COMPONENTE STANDALONE
  { path: 'repartidor', loadComponent: () => import('./repartidor/panel-repartidor/panel-repartidor.component').then(m => m.PanelRepartidorComponent) },
  
  { path: 'carrito', component: CarritoComponent },
  { path: 'perfil', component: PerfilComponent },
  { path: 'cambiar-password', component: CambiarPasswordComponent },
  { path: 'mis-tarjetas', component: MisTarjetasComponent },
  
  // Lazy loading components
  { path: 'ingreso-inventario', loadComponent: () => import('./logistico/ingreso-inventario/ingreso-inventario.component').then(m => m.IngresoInventarioComponent) },
  { path: 'gestion-productos', loadComponent: () => import('./logistico/gestion-productos/gestion-productos.component').then(m => m.GestionProductosComponent) },
  { path: 'gestion-proveedores', loadComponent: () => import('./logistico/gestion-proveedores/gestion-proveedores.component').then(m => m.GestionProveedoresComponent) },
  { path: 'gestion-pedidos', loadComponent: () => import('./logistico/gestion-pedidos/gestion-pedidos.component').then(m => m.GestionPedidosComponent) },
  { path: 'historial-ingresos', loadComponent: () => import('./logistico/historial-ingresos/historial-ingresos.component').then(m => m.HistorialIngresosComponent) },
  { path: 'direcciones', loadComponent: () => import('./perfil/direcciones/direcciones.component').then(m => m.DireccionesComponent) },
  { path: 'mis-pedidos', loadComponent: () => import('./perfil/mis-pedidos/mis-pedidos.component').then(m => m.MisPedidosComponent) },
  { path: 'gestion-usuarios', loadComponent: () => import('./admin/gestion-usuarios/gestion-usuarios.component').then(m => m.GestionUsuariosComponent) },
{ path: 'reportes', loadComponent: () => import('./admin/reportes/reportes.component').then(m => m.ReportesComponent) },
{ path: 'configuracion', loadComponent: () => import('./admin/configuracion/configuracion.component').then(m => m.ConfiguracionComponent) },
{ path: 'clientes-top', loadComponent: () => import('./admin/clientes-top/clientes-top.component').then(m => m.ClientesTopComponent) },
{path: 'productos-no-movimiento', loadComponent: () => import('./admin/productos-no-movimiento/productos-no-movimiento.component').then(m => m.ProductosNoMovimientoComponent) },
{ path: 'bi', loadComponent: () => import('./admin/bi-center/bi-center.component').then(m => m.BiCenterComponent) },
{ path: 'cotizaciones', loadComponent: () => import('./admin/cotizaciones/cotizaciones.component').then(m => m.CotizacionesComponent) },
{ path: 'crm', loadComponent: () => import('./admin/crm/crm.component').then(m => m.CrmComponent) },
{ path: 'asistente', loadComponent: () => import('./admin/asistente/asistente.component').then(m => m.AsistenteComponent) },
];