import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GestionPedidosComponent } from './gestion-pedidos.component';

describe('GestionPedidosComponent', () => {
  let component: GestionPedidosComponent;
  let fixture: ComponentFixture<GestionPedidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPedidosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPedidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
