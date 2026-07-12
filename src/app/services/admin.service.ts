import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appsettings } from '../config/appsettings';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private urlservicio = appsettings.apiurl;

  constructor() { }

  // Obtener todos los usuarios
  obtenerTodosUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlservicio}usuario/todos`);
  }

  // Obtener estadísticas de usuarios
  obtenerEstadisticasUsuarios(): Observable<any> {
    return this.http.get<any>(`${this.urlservicio}usuario/estadisticas`);
  }

  // Obtener tendencia de ventas
  obtenerTendenciaVentas(): Observable<any> {
    return this.http.get<any>(`${this.urlservicio}pedido/estadisticas/tendencia-ventas`);
  }

  // Obtener productos más vendidos
  obtenerProductosMasVendidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlservicio}pedido/estadisticas/productos-mas-vendidos`);
  }



  // Obtener top clientes
  obtenerClientesTop(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlservicio}pedido/estadisticas/clientes-top`);
  }

  // Obtener evolución de ventas por período
  obtenerEvolucionVentas(periodo: string = '30dias'): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlservicio}pedido/estadisticas/evolucion-ventas/${periodo}`);
  }

   // Obtener productos sin movimiento
  obtenerProductosSinMovimiento(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlservicio}producto/sin-movimiento`);
  }

  // Obtener productos con bajo movimiento (opcional)
  obtenerProductosBajoMovimiento(): Observable<any[]> {
    return this.http.get<any[]>(`${this.urlservicio}producto/bajo-movimiento`);
  }

}