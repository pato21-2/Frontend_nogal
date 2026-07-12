import { Usuario } from './usuario';
import { Direccion } from './direccion';
import { Tarjeta } from './tarjeta';
import { Producto } from './producto';

export interface DetallePedido {
    id?: number;
    producto: Producto;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export interface Pedido {
    id?: number;
    usuario: Usuario;
    numeroPedido?: string;
    fechaPedido?: string;
    subtotal: number;
    igv: number;
    envio: number;
    total: number;
    estado?: string;
    direccion: Direccion;
    tarjeta: Tarjeta;
    metodoPago: string;
    notas?: string;
    detalles: DetallePedido[];
    codigoVerificacion?: string;

}