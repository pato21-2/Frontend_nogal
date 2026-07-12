export interface Tarjeta {
    id?: number;
    usuarioId: number;
    numeroEnmascarado: string;
    tipo: string; // VISA, MASTERCARD, etc.
    nombreTitular: string;
    mesExpiracion: number;
    anioExpiracion: number;
    predeterminada: boolean;
    fechaCreacion?: string;
    fechaActualizacion?: string;
}