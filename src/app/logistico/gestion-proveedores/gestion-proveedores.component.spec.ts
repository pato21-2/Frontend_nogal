import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GestionProveedoresComponent } from './gestion-proveedores.component';

describe('GestionProveedoresComponent', () => {
  let component: GestionProveedoresComponent;
  let fixture: ComponentFixture<GestionProveedoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionProveedoresComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionProveedoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
