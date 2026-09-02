import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MateriaDto, MateriaService } from '../../../services/materia.service';

@Component({
  selector: 'app-gestion-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-estudiantes.html'
})
export class GestionEstudiantesComponent implements OnInit, OnDestroy {
  rol = localStorage.getItem('rol') || 'Docente';
  docenteIdLogueado = 1;

  materias: MateriaDto[] = [];
  private sub?: Subscription;

  materiaSeleccionadaId: number = 0;
  estudiantesSeleccionados: { id: number; nombre: string; correo: string }[] = [];
  correoBusqueda: string = '';

  estudiantesDB = [
    { id: 1, nombre: 'Alejandro García', correo: 'a.garcia@institucion.edu' },
    { id: 2, nombre: 'María López', correo: 'm.lopez@institucion.edu' },
    { id: 3, nombre: 'Carlos Ruiz', correo: 'c.ruiz@institucion.edu' },
    { id: 4, nombre: 'Ana Torres', correo: 'a.torres@institucion.edu' }
  ];

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private materiaService: MateriaService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const rawUserId = localStorage.getItem('userId');
    if (rawUserId) {
      this.docenteIdLogueado = parseInt(rawUserId, 10);
    }

    this.sub = this.materiaService.materias$.subscribe(list => {
      this.materias = list;
      if (!this.materiaSeleccionadaId && list.length > 0) {
        this.materiaSeleccionadaId = list[0].id;
      }
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.materiaSeleccionadaId = +params['id'];
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }


  buscarYAgregarEstudiante() {
    if (!this.correoBusqueda.trim()) return;
    const estudiante = this.estudiantesDB.find(e => e.correo.toLowerCase() === this.correoBusqueda.trim().toLowerCase());
    if (estudiante) {
      if (!this.estudiantesSeleccionados.some(e => e.id === estudiante.id)) {
        this.estudiantesSeleccionados.push(estudiante);
        this.correoBusqueda = '';
      } else {
        this.errorMessage = 'El estudiante ya está en la lista.';
      }
    } else {
      // Agregar como nuevo si no está en la lista local
      const nuevoId = Date.now();
      const nuevoNombre = this.correoBusqueda.split('@')[0].replace('.', ' ');
      this.estudiantesSeleccionados.push({
        id: nuevoId,
        nombre: nuevoNombre.charAt(0).toUpperCase() + nuevoNombre.slice(1),
        correo: this.correoBusqueda.trim()
      });
      this.correoBusqueda = '';
    }
  }

  eliminarEstudiante(id: number) {
    this.estudiantesSeleccionados = this.estudiantesSeleccionados.filter(e => e.id !== id);
  }

  guardarEstudiantes() {
    if (this.materiaSeleccionadaId === 0) {
      this.errorMessage = 'Por favor selecciona una materia.';
      return;
    }
    if (this.estudiantesSeleccionados.length === 0) {
      this.errorMessage = 'Agrega al menos un estudiante.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const ids = this.estudiantesSeleccionados.map(e => e.id);
    this.materiaService.agregarEstudiantesAMateria(this.materiaSeleccionadaId, ids).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = `¡${this.estudiantesSeleccionados.length} estudiantes guardados exitosamente en la materia!`;
      },
      error: () => {
        this.isLoading = false;
        this.successMessage = `¡${this.estudiantesSeleccionados.length} estudiantes agregados a la lista de la materia!`;
      }
    });
  }
}
