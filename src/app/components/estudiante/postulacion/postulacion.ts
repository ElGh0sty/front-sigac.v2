import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EstudianteService, HistorialAyudantiaDto } from '../../../services/estudiante.service';
import { MateriaService } from '../../../services/materia.service';

@Component({
  selector: 'app-postulacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './postulacion.html'
})
export class PostulacionComponent implements OnInit, OnDestroy {
  catedras: { id: number; nombre: string }[] = [];
  private sub?: Subscription;

  postulacion = {
    catedraId: 0
  };

  historial: HistorialAyudantiaDto[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private estudianteService: EstudianteService,
    private materiaService: MateriaService
  ) {}

  ngOnInit() {
    this.sub = this.materiaService.materias$.subscribe(list => {
      this.catedras = list.map(m => ({ id: m.id, nombre: `${m.nombre} (${m.codigo})` }));
    });
    this.cargarHistorial();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }


  cargarHistorial() {
    this.estudianteService.getHistorialAyudantias().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.historial = data;
        }
      },
      error: (err) => {
        console.warn('Historial no disponible aún:', err);
      }
    });
  }

  enviarPostulacion() {
    if (!this.postulacion.catedraId || this.postulacion.catedraId === 0) {
      this.errorMessage = 'Por favor selecciona una cátedra.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.estudianteService.postularAyudantia({ catedraId: Number(this.postulacion.catedraId) }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = '¡Postulación enviada con éxito!';
        this.postulacion.catedraId = 0;
        this.cargarHistorial();
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al enviar postulación (' + (err.status || 'Red') + ').';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }
}
