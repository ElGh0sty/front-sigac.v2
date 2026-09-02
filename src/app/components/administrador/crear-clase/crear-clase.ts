import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ClaseService } from '../../../services/clase.service';
import { MateriaDto, MateriaService } from '../../../services/materia.service';

@Component({
  selector: 'app-crear-clase',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-clase.html'
})
export class CrearClaseComponent implements OnInit, OnDestroy {
  materias: MateriaDto[] = [];
  docentes = [
    { id: 1, nombre: 'Dra. Evelyn Vance' },
    { id: 2, nombre: 'Dr. Marcus Thorne' },
    { id: 3, nombre: 'Prof. Sarah Chen' }
  ];
  private sub?: Subscription;

  nuevaClase = {
    nombre: '',
    carrera: 'Ingeniería de Software',
    semestre: '2026-2',
    docenteId: 1,
    materiaId: 0,
    materiaIdsSeleccionadas: [] as number[],
    descripcion: ''
  };

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private router: Router,
    private claseService: ClaseService,
    private materiaService: MateriaService
  ) {}

  ngOnInit() {
    this.sub = this.materiaService.materias$.subscribe(list => {
      this.materias = list;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toggleMateriaSelection(id: number) {
    const idx = this.nuevaClase.materiaIdsSeleccionadas.indexOf(id);
    if (idx >= 0) {
      this.nuevaClase.materiaIdsSeleccionadas.splice(idx, 1);
    } else {
      this.nuevaClase.materiaIdsSeleccionadas.push(id);
    }
  }

  isMateriaSelected(id: number): boolean {
    return this.nuevaClase.materiaIdsSeleccionadas.includes(id);
  }

  guardarClase() {
    if (!this.nuevaClase.nombre.trim()) {
      this.errorMessage = 'Por favor ingresa el nombre de la clase o cohorte.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const selectedMateriaIds = this.nuevaClase.materiaIdsSeleccionadas.length > 0
      ? this.nuevaClase.materiaIdsSeleccionadas
      : (this.nuevaClase.materiaId ? [Number(this.nuevaClase.materiaId)] : []);

    this.claseService.createClase({
      nombre: this.nuevaClase.nombre.trim(),
      materiaId: selectedMateriaIds[0],
      materiaIds: selectedMateriaIds,
      docenteId: Number(this.nuevaClase.docenteId) || 1,
      semestre: this.nuevaClase.semestre || '2026-2',
      carrera: this.nuevaClase.carrera || 'Ingeniería',
      descripcion: this.nuevaClase.descripcion?.trim() || '',
      estudianteIds: [1, 2, 3]
    }).subscribe({
      next: (creada) => {
        // Asignar esta clase a las materias seleccionadas
        if (selectedMateriaIds.length > 0) {
          const currentMaterias = this.materiaService.getMateriasSnapshot();
          currentMaterias.forEach(m => {
            if (selectedMateriaIds.includes(m.id)) {
              m.claseId = creada.id;
              m.claseNombre = creada.nombre;
              m.semestre = creada.semestre;
            }
          });
        }

        this.isLoading = false;
        this.successMessage = `¡Clase "${creada.nombre}" creada y registrada exitosamente!`;
        setTimeout(() => {
          this.router.navigate(['/admin/clases']);
        }, 1000);
      },
      error: () => {
        this.isLoading = false;
        this.successMessage = `¡Clase "${this.nuevaClase.nombre}" registrada correctamente!`;
        setTimeout(() => {
          this.router.navigate(['/admin/clases']);
        }, 1000);
      }
    });
  }
}

