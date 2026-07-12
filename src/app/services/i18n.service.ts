import { Injectable, signal } from '@angular/core';

export type Idioma = 'es' | 'en';

const STORAGE_KEY = 'nogal-idioma';

/**
 * Servicio de internacionalización del panel de administración.
 * Diccionario ES/EN con clave = texto en español (idioma fuente),
 * lo que permite traducir plantillas existentes sin reescribir claves.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly idioma = signal<Idioma>(this.leerGuardado());

  private readonly diccionarioEN: Record<string, string> = {
    // ===== Panel de administración: navegación =====
    'Nogal Admin': 'Nogal Admin',
    'Dashboard': 'Dashboard',
    'Gestión Usuarios': 'User Management',
    'Módulo Logístico': 'Logistics Module',
    'Reportes': 'Reports',
    'Configuración': 'Settings',
    'Panel de Administración': 'Administration Panel',
    'Cerrar Sesión': 'Log Out',
    'Cerrar sesión': 'Log out',
    'Administrador': 'Administrator',
    'Ir a Tienda': 'Go to Store',

    // ===== Métricas y tarjetas =====
    'Total Usuarios': 'Total Users',
    'Clientes Nuevos': 'New Customers',
    'Pedidos Totales': 'Total Orders',
    'Pedidos Pendientes': 'Pending Orders',
    'Pedidos 30 días': 'Orders (30 days)',
    'Total 30 días': 'Total (30 days)',
    'Promedio diario': 'Daily average',
    'Productos Activos': 'Active Products',
    'Productos Bajos': 'Low-stock Products',
    'Stock Bajo': 'Low Stock',
    'Proveedores Activos': 'Active Suppliers',
    'Ingresos Mensuales': 'Monthly Revenue',
    'Ventas Totales': 'Total Sales',
    'este mes': 'this month',
    'Ver todos': 'View all',

    // ===== Secciones del dashboard =====
    'Tendencia de Ventas - Últimos 7 Días': 'Sales Trend — Last 7 Days',
    'Productos Más Vendidos': 'Best-selling Products',
    'Últimos Pedidos': 'Latest Orders',
    'Top Clientes': 'Top Customers',
    'N° Pedido': 'Order No.',
    'Fecha': 'Date',
    'Estado': 'Status',
    'Acciones': 'Actions',
    'Cliente': 'Customer',
    'Total': 'Total',
    'Cargando datos...': 'Loading data...',
    'Sin datos disponibles': 'No data available',

    // ===== Modal crear usuario (panel admin) =====
    'Crear Usuario': 'Create User',
    'NOMBRE DE USUARIO *': 'USERNAME *',
    'CONTRASEÑA *': 'PASSWORD *',
    'NOMBRES *': 'FIRST NAME *',
    'APELLIDOS *': 'LAST NAME *',
    'EMAIL *': 'EMAIL *',
    'TELÉFONO *': 'PHONE *',
    'TIPO DOCUMENTO': 'DOCUMENT TYPE',
    'N° DOCUMENTO *': 'DOCUMENT NO. *',
    'ROL *': 'ROLE *',
    'DNI': 'National ID (DNI)',
    'Carnet Extranjería': 'Foreigner ID Card',
    'Repartidor': 'Delivery Driver',
    'Logístico': 'Logistics',
    'Cancelar': 'Cancel',
    'Guardar': 'Save',
    'Guardando...': 'Saving...',

    // ===== Gestión de usuarios =====
    'Gestión de Usuarios': 'User Management',
    'Exportar': 'Export',
    'Editar Usuario': 'Edit User',
    'Buscar por nombre, email o documento...': 'Search by name, email or document...',
    'Todos los roles': 'All roles',
    'Todos los estados': 'All statuses',
    'Activos': 'Active',
    'Inactivos': 'Inactive',
    'Activo': 'Active',
    'Inactivo': 'Inactive',
    'Usuario': 'User',
    'Documento': 'Document',
    'Contacto': 'Contact',
    'Rol': 'Role',
    'Registro': 'Registered',
    'Clientes': 'Customers',
    'Admins': 'Admins',
    'Personal': 'Staff',
    'Nuevos (30d)': 'New (30d)',
    'Ver detalle': 'View details',
    'Editar': 'Edit',
    'Desactivar': 'Deactivate',
    'Activar': 'Activate',
    'Detalle de Usuario': 'User Details',
    'Confirmar Desactivación': 'Confirm Deactivation',
    'Sin resultados': 'No results',
    'Username': 'Username',
    'Nombres': 'First name',
    'Apellidos': 'Last name',
    'Email': 'Email',
    'Teléfono': 'Phone',
    'Dirección': 'Address',
    'Cerrar': 'Close',

    // ===== Configuración =====
    'Configuración del Sistema': 'System Settings',
    'Preferencias Generales': 'General Preferences',
    'Idioma del sistema': 'System language',
    'Idioma': 'Language',
    'Español': 'Spanish',
    'Inglés': 'English',
    'Zona horaria': 'Time zone',
    'Moneda': 'Currency',
    'Notificaciones': 'Notifications',
    'Notificaciones por email': 'Email notifications',
    'Alertas de stock bajo': 'Low-stock alerts',
    'Alertas de nuevos pedidos': 'New-order alerts',
    'Seguridad': 'Security',
    'Autenticación de dos factores': 'Two-factor authentication',
    'Tiempo de sesión (minutos)': 'Session timeout (minutes)',
    'Respaldo automático': 'Automatic backup',
    'Guardar Cambios': 'Save Changes',
    'Guardar Configuración': 'Save Settings',
    'Restaurar valores por defecto': 'Restore defaults',
    'Configuración guardada exitosamente': 'Settings saved successfully',
    'Volver': 'Back',

    // ===== Estados de pedido =====
    'PENDIENTE': 'PENDING',
    'PAGADO': 'PAID',
    'EN PREPARACION': 'IN PREPARATION',
    'EN PREPARACIÓN': 'IN PREPARATION',
    'ENVIADO': 'SHIPPED',
    'EN CAMINO': 'ON THE WAY',
    'ENTREGADO': 'DELIVERED',
    'CANCELADO': 'CANCELLED',
    'Pendiente': 'Pending',
    'Pagado': 'Paid',
    'Enviado': 'Shipped',
    'Entregado': 'Delivered',
    'Cancelado': 'Cancelled',
    'Centro BI': 'BI Center',
    'Cotizaciones': 'Quotations',
    'Asistente': 'Assistant',
    'Preferencias del Sistema': 'System Preferences',
    'Información del Sistema': 'System Information',
    'Notificaciones por Email': 'Email Notifications',
    'Recibir notificaciones de pedidos y reportes': 'Receive order and report notifications',
    'Reportes Automáticos': 'Automatic Reports',
    'Generar reportes semanales automáticamente': 'Generate weekly reports automatically',
    'Modo Oscuro': 'Dark Mode',
    'Interfaz con tema oscuro': 'Dark-themed interface',
    'Idioma de la interfaz': 'Interface language',
    'Versión:': 'Version:',
    'Última Actualización:': 'Last Update:',
    'Usuarios Registrados:': 'Registered Users:',
    'Estado:': 'Status:',
    'Operativo': 'Operational',
    'Administradores': 'Administrators',
    'Logísticos': 'Logistics staff',
    'Repartidores': 'Delivery drivers',
    'Buscar': 'Search',
    'Anterior': 'Previous',
    'Siguiente': 'Next',
    'Username *': 'Username *',
    'Contraseña *': 'Password *',
    'Nombres *': 'First name *',
    'Apellidos *': 'Last name *',
    'Correo Electrónico *': 'Email *',
    'Nombres Completos': 'Full Name',
    'N° Documento': 'Document No.',
    'Tipo Doc.': 'Doc. Type',
    'Rol del Sistema': 'System Role',
    'ID Sistema': 'System ID',
    '¿Está seguro que desea desactivar al usuario': 'Are you sure you want to deactivate user',
  };

  set(idioma: Idioma): void {
    this.idioma.set(idioma);
    try {
      localStorage.setItem(STORAGE_KEY, idioma);
    } catch { /* almacenamiento no disponible */ }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = idioma;
    }
  }

  /** Traduce un texto (clave en español). Si no hay traducción, devuelve el original. */
  traducir(texto: string): string {
    if (this.idioma() === 'es') { return texto; }
    const clave = (texto ?? '').trim();
    return this.diccionarioEN[clave] ?? texto;
  }

  private leerGuardado(): Idioma {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado === 'en' || guardado === 'es') { return guardado; }
    } catch { /* SSR o almacenamiento bloqueado */ }
    return 'es';
  }
}
