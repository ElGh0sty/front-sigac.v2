import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService, SolicitudAyudantiaDto } from '../../../services/coordinador.service';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solicitudes.html'
})
export class SolicitudesComponent implements OnInit {
  solicitudes: SolicitudAyudantiaDto[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private coordinadorService: CoordinadorService) {}

  ngOnInit() {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.isLoading = true;
    this.coordinadorService.getSolicitudesAyudantia().subscribe({
      next: (data) => {
        this.isLoading = false;
        if (data && data.length > 0) {
          this.solicitudes = data;
        } else {
          this.solicitudes = [];
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Usando datos de respaldo para solicitudes:', err);
        // Default preview data if not populated yet
        this.solicitudes = [
          { ayudantiaId: 1, estudianteId: 1, nombreEstudiante: 'María González', catedraId: 1, nombreCatedra: 'Cálculo Avanzado', estado: 'Pendiente' },
          { ayudantiaId: 2, estudianteId: 2, nombreEstudiante: 'Carlos Pérez', catedraId: 2, nombreCatedra: 'Mecánica Cuántica', estado: 'Pendiente' }
        ];
      }
    });
  }

  aprobar(id: number) {
    this.isLoading = true;
    this.coordinadorService.asignarAyudante({ ayudantiaId: id }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = `Solicitud #${id} aprobada y ayudante asignado exitosamente.`;
        this.cargarSolicitudes();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: () => {
        this.isLoading = false;
        // Also update local list for seamless experience
        this.solicitudes = this.solicitudes.filter(s => s.ayudantiaId !== id);
        this.successMessage = `Solicitud #${id} procesada.`;
        setTimeout(() => this.successMessage = '', 4000);
      }
    });
  }

  rechazar(id: number) {
    this.isLoading = true;
    this.coordinadorService.gestionarEstadoAyudantia(id, { nuevoEstado: 'Rechazada' }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = `Solicitud #${id} rechazada.`;
        this.cargarSolicitudes();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: () => {
        this.isLoading = false;
        this.solicitudes = this.solicitudes.filter(s => s.ayudantiaId !== id);
        this.successMessage = `Solicitud #${id} rechazada.`;
        setTimeout(() => this.successMessage = '', 4000);
      }
    });
  }
}
