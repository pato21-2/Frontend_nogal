import { TestBed } from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing'; 

import { PedidoLogisticoService } from './pedido-logistico.service';

describe('PedidoLogisticoService', () => {
  let service: PedidoLogisticoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PedidoLogisticoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
