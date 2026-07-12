/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PanelLogisticoComponent } from './panel-logistico.component';
import { provideRouter } from '@angular/router'; // Angular 15+ recomendado
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ProductoService } from '../../services/logistico/producto.service';
import { InventarioService } from '../../services/logistico/inventario.service';

describe('PanelLogisticoComponent', () => {
  let component: PanelLogisticoComponent;
  let fixture: ComponentFixture<PanelLogisticoComponent>;

  // Mocks para evitar llamadas reales al servidor de Comercial el Nogal
  const productoServiceMock = {
    listarProductos: () => of([]),
    listarProductosStockBajo: () => of([])
  };

  const inventarioServiceMock = {
    obtenerEstadisticasMensuales: () => of(0),
    listarIngresosPendientesPago: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelLogisticoComponent], // Al ser standalone va aquí
      providers: [
        provideRouter([]), // Proveer enrutamiento vacío para el test
        provideHttpClient(),
        provideHttpClientTesting(),
        // Inyectamos los mocks en lugar de los servicios reales
        { provide: ProductoService, useValue: productoServiceMock },
        { provide: InventarioService, useValue: inventarioServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelLogisticoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});