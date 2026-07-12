import { Proveedor } from './proveedor';
import { DetalleIngreso } from './detalle-ingreso';

export interface IngresoInventario {
    id?: number;
    proveedor: Proveedor;
    numeroFactura: string;
    fechaEmision: string;
    fechaIngreso: string;
    metodoPago: string;
    diasCredito?: number;
    fechaPago?: string;
    subtotal: number;
    igv: number;
    total: number;
    detalles: DetalleIngreso[];
}