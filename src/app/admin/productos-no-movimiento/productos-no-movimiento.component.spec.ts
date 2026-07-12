import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductosNoMovimientoComponent } from './productos-no-movimiento.component';

describe('ProductosNoMovimientoComponent', () => {
  let component: ProductosNoMovimientoComponent;
  let fixture: ComponentFixture<ProductosNoMovimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosNoMovimientoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosNoMovimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
