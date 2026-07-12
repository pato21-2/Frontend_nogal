export interface Proveedor {
    id?: number;
    nombre: string;
    ruc?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    contacto?: string;
    materialEspecialidad: string;
    activo: boolean;
}