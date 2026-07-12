import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VentasEvolucionComponent } from './ventas-evolucion.component';

describe('VentasEvolucionComponent', () => {
  let component: VentasEvolucionComponent;
  let fixture: ComponentFixture<VentasEvolucionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasEvolucionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentasEvolucionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
