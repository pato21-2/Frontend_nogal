import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GestionProductosComponent } from './gestion-productos.component';

describe('GestionProductosComponent', () => {
  let component: GestionProductosComponent;
  let fixture: ComponentFixture<GestionProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionProductosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
