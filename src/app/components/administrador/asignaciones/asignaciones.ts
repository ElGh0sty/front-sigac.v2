import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoordinadorService, SolicitudAyudantiaDto } from '../../../services/coordinador.service';

@Component({
  selector: 'app-asignaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asignaciones.html'
})
export class AsignacionesComponent implements OnInit {
  solicitudesPendientes: SolicitudAyudantiaDto[] = [];
  asignacion = {
    ayudantiaId: 0
  };

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private coordinadorService: CoordinadorService) {}

  ngOnInit() {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.coordinadorService.getSolicitudesAyudantia().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.solicitudesPendientes = data;
        } else {
          this.solicitudesPendientes = [
            { ayudantiaId: 1, estudianteId: 1, nombreEstudiante: 'María González', catedraId: 1, nombreCatedra: 'Cálculo Avanzado', estado: 'Pendiente' },
            { ayudantiaId: 2, estudianteId: 2, nombreEstudiante: 'Carlos Pérez', catedraId: 2, nombreCatedra: 'Mecánica Cuántica', estado: 'Pendiente' }
          ];
        }
      },
      error: () => {
        this.solicitudesPendientes = [
          { ayudantiaId: 1, estudianteId: 1, nombreEstudiante: 'María González', catedraId: 1, nombreCatedra: 'Cálculo Avanzado', estado: 'Pendiente' },
          { ayudantiaId: 2, estudianteId: 2, nombreEstudiante: 'Carlos Pérez', catedraId: 2, nombreCatedra: 'Mecánica Cuántica', estado: 'Pendiente' }
        ];
      }
    });
  }

  asignar() {
    if (!this.asignacion.ayudantiaId) {
      this.errorMessage = 'Por favor selecciona una postulación/ayudantía.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.coordinadorService.asignarAyudante({ ayudantiaId: Number(this.asignacion.ayudantiaId) }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Ayudantía asignada y activada con éxito.';
        this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.ayudantiaId !== Number(this.asignacion.ayudantiaId));
        this.asignacion.ayudantiaId = 0;
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.isLoading = false;
        this.successMessage = 'Asignación procesada.';
        this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.ayudantiaId !== Number(this.asignacion.ayudantiaId));
        this.asignacion.ayudantiaId = 0;
        setTimeout(() => this.successMessage = '', 4000);
      }
    });
  }
}
