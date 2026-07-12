import { Producto } from './producto';

export interface DetalleIngreso {
    id?: number;
    producto: Producto;
    cantidad: number;
    precioCompra: number;
    subtotal: number;
}