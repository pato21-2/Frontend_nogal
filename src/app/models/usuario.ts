export type RolUsuario = 'admin' | 'logistico' | 'repartidor' | 'cliente';
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO';

export interface Usuario {
  id?: number;                  // Se genera en BD, debe ser opcional
  codigoUsuario?: string;       // Se genera en BD, debe ser opcional
  username: string;
  password?: string;            // Opcional para las vistas
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  tipoDocumento: string;
  numeroDocumento: string;
  rol?: RolUsuario | string;    // Opcional al registrar
  estado?: EstadoUsuario;       // Opcional
  fechaRegistro?: string;       // Generado automáticamente
  ultimoAcceso?: string;        // Generado automáticamente
}