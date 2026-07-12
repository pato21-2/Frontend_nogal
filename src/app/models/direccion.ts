export interface Direccion {
    id?: number;
    usuario?: {
        id: number;
    };
    nombreDireccion: string;
    nombreReceptor: string;
    apellidosReceptor: string;
    direccion: string;
    numero: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    dptoOficinaCasa?: string;
    telefono: string;
    esPrincipal: boolean;
    activa?: boolean;
    fechaCreacion?: Date;
    fechaActualizacion?: Date;
}