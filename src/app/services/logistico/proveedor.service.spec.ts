import { TestBed } from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import { ProveedorService } from './proveedor.service';

describe('ProveedorService', () => {
  let service: ProveedorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ProveedorService);
    
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
