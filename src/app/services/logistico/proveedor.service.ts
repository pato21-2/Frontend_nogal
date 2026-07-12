import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { appsettings } from '../../config/appsettings';
import { Proveedor } from '../../models/proveedor';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private http = inject(HttpClient);
  private urlservicio = appsettings.apiurl + "proveedor";

  constructor() { }

  listarProveedores() {
    return this.http.get<Proveedor[]>(this.urlservicio);
  }

  listarTodosProveedores() {
    return this.http.get<Proveedor[]>(`${this.urlservicio}/todos`);
  }

  listarProveedoresPorMaterial(material: string) {
    return this.http.get<Proveedor[]>(`${this.urlservicio}/material/${material}`);
  }

  buscarProveedores(nombre: string) {
    return this.http.get<Proveedor[]>(`${this.urlservicio}/nombre/${nombre}`);
  }

  getProveedor(id: number) {
    return this.http.get<Proveedor>(`${this.urlservicio}/${id}`);
  }

  crearProveedor(obj: Proveedor) {
    return this.http.post<Proveedor>(`${this.urlservicio}/crear`, obj);
  }

  actualizarProveedor(id: number, obj: Proveedor) {
    return this.http.put<Proveedor>(`${this.urlservicio}/${id}`, obj);
  }

  eliminarProveedor(id: number) {
    return this.http.delete<String>(`${this.urlservicio}/${id}`);
  }
}