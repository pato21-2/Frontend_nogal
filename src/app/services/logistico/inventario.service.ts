import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { appsettings } from '../../config/appsettings';
import { IngresoInventario } from '../../models/ingreso-inventario';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private http = inject(HttpClient);
  private urlservicio = appsettings.apiurl + "ingreso-inventario";

  constructor() { }

  listarIngresos() {
    return this.http.get<IngresoInventario[]>(this.urlservicio).pipe(
      catchError(error => {
        console.error('Error listando ingresos:', error);
        return throwError(() => error.error?.message || 'Error al cargar ingresos');
      })
    );
  }

  listarIngresosPorProveedor(proveedorId: number) {
    return this.http.get<IngresoInventario[]>(`${this.urlservicio}/proveedor/${proveedorId}`).pipe(
      catchError(error => {
        console.error('Error listando ingresos por proveedor:', error);
        return throwError(() => error.error?.message || 'Error al cargar ingresos del proveedor');
      })
    );
  }

  listarIngresosPorFactura(numeroFactura: string) {
    return this.http.get<IngresoInventario[]>(`${this.urlservicio}/factura/${numeroFactura}`).pipe(
      catchError(error => {
        console.error('Error listando ingresos por factura:', error);
        return throwError(() => error.error?.message || 'Error al buscar factura');
      })
    );
  }

  listarIngresosPendientesPago() {
    return this.http.get<IngresoInventario[]>(`${this.urlservicio}/pendientes-pago`).pipe(
      catchError(error => {
        console.error('Error listando ingresos pendientes:', error);
        return throwError(() => error.error?.message || 'Error al cargar ingresos pendientes');
      })
    );
  }

  listarIngresosPorRangoFechas(fechaInicio: string, fechaFin: string) {
    return this.http.get<IngresoInventario[]>(`${this.urlservicio}/rango-fechas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`).pipe(
      catchError(error => {
        console.error('Error listando ingresos por rango:', error);
        return throwError(() => error.error?.message || 'Error al cargar ingresos por fecha');
      })
    );
  }

  getIngreso(id: number) {
    return this.http.get<IngresoInventario>(`${this.urlservicio}/${id}`).pipe(
      catchError(error => {
        console.error('Error obteniendo ingreso:', error);
        return throwError(() => error.error?.message || 'Error al cargar ingreso');
      })
    );
  }

  crearIngreso(obj: IngresoInventario) {
    return this.http.post<IngresoInventario>(`${this.urlservicio}/crear`, obj) 
    .pipe(
      catchError(error => {
        console.error('Error creando ingreso:', error);
        const errorMessage = error.error?.message || error.error || error.message || 'Error desconocido al registrar ingreso';
        return throwError(() => errorMessage);
      })
    );
  }

  obtenerEstadisticasMensuales(anio: number, mes: number) {
    return this.http.get<number>(`${this.urlservicio}/estadisticas/mensual?anio=${anio}&mes=${mes}`).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas:', error);
        return throwError(() => error.error?.message || 'Error al cargar estadísticas');
      })
    );
  }
  
}