export interface FacturaDetalle {
  producto: {
    nombre: string;
  };
  cantidad: number;
  subtotal: number;
}

export interface Factura {
  numero: string;
  fechaEmision: string;
  total: number;
  detalles: FacturaDetalle[];
}