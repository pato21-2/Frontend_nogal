import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { appsettings } from '../config/appsettings';
import { Producto } from '../models/producto';

export interface ItemCarrito {
  id?: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private http = inject(HttpClient);
  private urlservicio = appsettings.apiurl + "carrito";

  // Carrito en memoria (temporal hasta backend)
  private carritoSubject = new BehaviorSubject<ItemCarrito[]>(this.obtenerCarritoLocal());
  public carrito$ = this.carritoSubject.asObservable();

  // Agregar producto al carrito
  agregarProducto(producto: Producto, cantidad: number = 1): void {
    const carritoActual = [...this.carritoSubject.value];
    const itemExistente = carritoActual.find(item => item.producto.id === producto.id);

    if (itemExistente) {
      // Actualizar cantidad si ya existe
      //itemExistente.cantidad += cantidad;
      //itemExistente.subtotal = itemExistente.precioUnitario * itemExistente.cantidad;
      const index=carritoActual.indexOf(itemExistente);
      carritoActual[index]={
        ...itemExistente,
        cantidad: itemExistente.cantidad + cantidad,
        subtotal: itemExistente.precioUnitario * (itemExistente.cantidad + cantidad)
      }
    } else {
      // Agregar nuevo item
      const nuevoItem: ItemCarrito = {
        producto: producto,
        cantidad: cantidad,
        precioUnitario: producto.precioVenta,
        subtotal: producto.precioVenta * cantidad
      };
      carritoActual.push(nuevoItem);
    }

    this.actualizarCarrito(carritoActual);
  }

  // Eliminar producto del carrito
  eliminarProducto(productoId: number): void {
    const carritoActual = [...this.carritoSubject.value].filter(item => item.producto.id !== productoId);
    this.actualizarCarrito(carritoActual);
  }

  // Actualizar cantidad
  actualizarCantidad(productoId: number, cantidad: number): void {
    const carritoActual = this.carritoSubject.value.map(item => {
      if (item.producto.id === productoId) {
        return{
          ...item,
          cantidad: cantidad,
          subtotal: item.precioUnitario * cantidad
        }
      }
        
      return item;
    });
    this.actualizarCarrito(carritoActual);
  }

  // Limpiar carrito
  limpiarCarrito(): void {
    this.actualizarCarrito([]);
  }

  // Obtener total
  getTotal(): number {
    return this.carritoSubject.value.reduce((total, item) => total + item.subtotal, 0);
  }

  // Obtener cantidad total de items
  getCantidadTotal(): number {
    return this.carritoSubject.value.reduce((total, item) => total + item.cantidad, 0);
  }

  // Verificar stock disponible
  verificarStock(producto: Producto, cantidadRequerida: number): boolean {
    return producto.stock >= cantidadRequerida;
  }

  // Métodos privados
  private actualizarCarrito(carrito: ItemCarrito[]): void {
    this.carritoSubject.next(carrito);
    this.guardarCarritoLocal(carrito);
  }

  private guardarCarritoLocal(carrito: ItemCarrito[]): void {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }

  private obtenerCarritoLocal(): ItemCarrito[] {
    const carrito = localStorage.getItem('carrito');
    return carrito ? JSON.parse(carrito) : [];
  }
}