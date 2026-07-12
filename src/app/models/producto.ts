import { Proveedor } from './proveedor';
import { Categoria } from './categoria';

export interface Producto {
    id?: number;
    nombre: string;
    proveedor: Proveedor;
    categoria: Categoria;
    descripcion?: string;
    material?: string;
    dimensiones?: string;
    color?: string;
    caracteristicas?: string;
    precioCompra: number;
    precioVenta: number;
    stock: number;
    imagenUrl?: string;
    activo: boolean;
}