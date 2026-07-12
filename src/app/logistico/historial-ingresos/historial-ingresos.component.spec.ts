import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HistorialIngresosComponent } from './historial-ingresos.component';

describe('HistorialIngresosComponent', () => {
  let component: HistorialIngresosComponent;
  let fixture: ComponentFixture<HistorialIngresosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialIngresosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialIngresosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
