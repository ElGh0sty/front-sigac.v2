import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService, SolicitudAyudantiaDto } from '../../../services/coordinador.service';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seguimiento.html'
})
export class SeguimientoComponent implements OnInit {
  ayudantias: SolicitudAyudantiaDto[] = [];
  isLoading = false;

  constructor(private coordinadorService: CoordinadorService) {}

  ngOnInit() {
    this.cargarSeguimiento();
  }

  cargarSeguimiento() {
    this.isLoading = true;
    this.coordinadorService.getSeguimientoAyudantias().subscribe({
      next: (data) => {
        this.isLoading = false;
        if (data && data.length > 0) {
          this.ayudantias = data;
        } else {
          this.ayudantias = [
            { ayudantiaId: 1, estudianteId: 1, nombreEstudiante: 'Ana López', catedraId: 1, nombreCatedra: 'Cálculo Avanzado', estado: 'Activa' },
            { ayudantiaId: 2, estudianteId: 2, nombreEstudiante: 'Luis Martínez', catedraId: 2, nombreCatedra: 'Mecánica Cuántica', estado: 'Activa' }
          ];
        }
      },
      error: () => {
        this.isLoading = false;
        this.ayudantias = [
          { ayudantiaId: 1, estudianteId: 1, nombreEstudiante: 'Ana López', catedraId: 1, nombreCatedra: 'Cálculo Avanzado', estado: 'Activa' },
          { ayudantiaId: 2, estudianteId: 2, nombreEstudiante: 'Luis Martínez', catedraId: 2, nombreCatedra: 'Mecánica Cuántica', estado: 'Activa' }
        ];
      }
    });
  }
}
