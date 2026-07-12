import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RepartidorService, ReporteEntrega } from '../../services/repartidor.service';

@Component({
  selector: 'app-reporte-entrega',
  standalone: true, // ✅ CONVERTIR A STANDALONE
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-entrega.component.html',
  styleUrls: ['./reporte-entrega.component.css']
})
export class ReporteEntregaComponent {
  @Input() pedido: any;
  @Input() repartidor: any;
  @Output() reporteCreado = new EventEmitter<void>();

  mostrarFormulario = false;
  reporte: Partial<ReporteEntrega> = {
    codigoVerificacion: '',
    observaciones: '',
    estado: 'ENTREGADO'
  };
  imagenSeleccionada: File | null = null;

  constructor(private repartidorService: RepartidorService) {}

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  onImagenSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
      // Aquí podrías subir la imagen y obtener la URL
      // Por simplicidad, guardamos el nombre del archivo
      this.reporte.fotoUrl = file.name;
    }
  }

  crearReporte() {
    if (!this.reporte.codigoVerificacion) {
      alert('Por favor ingresa el código de verificación');
      return;
    }

    const reporteCompleto: ReporteEntrega = {
      pedido: { id: this.pedido.id },
      repartidor: { id: this.repartidor.id },
      codigoVerificacion: this.reporte.codigoVerificacion!,
      fotoUrl: this.reporte.fotoUrl,
      observaciones: this.reporte.observaciones,
      estado: 'ENTREGADO'
    };

    this.repartidorService.crearReporteEntrega(reporteCompleto).subscribe({
      next: (response) => {
        alert('✅ Reporte de entrega creado exitosamente');
        this.mostrarFormulario = false;
        this.reporteCreado.emit();
        this.resetFormulario();
      },
      error: (error) => {
        console.error('Error creando reporte:', error);
        alert('❌ Error al crear el reporte: ' + error.error);
      }
    });
  }

  resetFormulario() {
    this.reporte = {
      codigoVerificacion: '',
      observaciones: '',
      estado: 'ENTREGADO'
    };
    this.imagenSeleccionada = null;
  }
}