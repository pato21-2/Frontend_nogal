import { TestBed } from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import { InventarioService } from './inventario.service';

describe('InventarioService', () => {
  let service: InventarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(InventarioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
