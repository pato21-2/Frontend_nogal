import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { appsettings } from '../../config/appsettings';
import { Producto } from '../../models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private urlservicio = appsettings.apiurl + "producto";

  constructor() { }

  listarProductos() {
    return this.http.get<Producto[]>(this.urlservicio);
  }

  listarTodosProductos() {
    return this.http.get<Producto[]>(`${this.urlservicio}/todos`);
  }

  listarProductosPorProveedor(proveedorId: number) {
    return this.http.get<Producto[]>(`${this.urlservicio}/proveedor/${proveedorId}`);
  }

  listarProductosPorCategoria(categoriaId: number) {
    return this.http.get<Producto[]>(`${this.urlservicio}/categoria/${categoriaId}`);
  }

  listarProductosStockBajo() {
    return this.http.get<Producto[]>(`${this.urlservicio}/stock-bajo`);
  }

  listarProductosOfertas() {
    return this.http.get<Producto[]>(`${this.urlservicio}/ofertas`);
  }

  listarProductosEconomicos() {
    return this.http.get<Producto[]>(`${this.urlservicio}/economicos`);
  }

  buscarProductos(nombre: string) {
    return this.http.get<Producto[]>(`${this.urlservicio}/nombre/${nombre}`);
  }

  getProducto(id: number) {
    return this.http.get<Producto>(`${this.urlservicio}/${id}`);
  }

  crearProducto(obj: Producto) {
    return this.http.post<Producto>(`${this.urlservicio}/crear`, obj);
  }

  actualizarProducto(id: number, obj: Producto) {
    return this.http.put<Producto>(`${this.urlservicio}/${id}`, obj);
  }

  eliminarProducto(id: number) {
    return this.http.delete<String>(`${this.urlservicio}/${id}`);
  }

  actualizarStock(id: number, cantidad: number) {
    return this.http.put<String>(`${this.urlservicio}/${id}/stock/${cantidad}`, {});
  }
}