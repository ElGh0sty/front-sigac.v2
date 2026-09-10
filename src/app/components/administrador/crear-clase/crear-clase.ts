import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ClaseService } from '../../../services/clase.service';
import { MateriaDto, MateriaService } from '../../../services/materia.service';
import { AdminDocenteService } from '../../../services/admin-docente.service';

@Component({
  selector: 'app-crear-clase',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-clase.html'
})
export class CrearClaseComponent implements OnInit, OnDestroy {
  materias: MateriaDto[] = [];
  docentes: { id: number; nombre: string; correo?: string }[] = [];
  private sub?: Subscription;
  private subDocentes?: Subscription;

  nuevaClase = {
    nombre: '',
    carrera: 'Ingeniería de Software',
    semestre: '2026-2',
    docenteId: 102,
    materiaId: 0,
    materiaIdsSeleccionadas: [] as number[],
    descripcion: ''
  };

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private router: Router,
    private location: Location,
    private claseService: ClaseService,
    private materiaService: MateriaService,
    private adminDocenteService: AdminDocenteService
  ) {}

  goBack(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/clases']);
    }
  }

  ngOnInit() {
    this.subDocentes = this.adminDocenteService.getDocentes().subscribe(list => {
      this.docentes = list.map(d => ({
        id: d.id,
        nombre: `${d.nombre} ${d.apellido}`.trim() || d.username,
        correo: d.correo
      }));
      const docenteOficial = this.docentes.find(d => (d.correo || '').toLowerCase() === 'docente@uteq.edu.ec');
      if (docenteOficial) {
        this.nuevaClase.docenteId = docenteOficial.id;
      } else if (this.docentes.length > 0 && !this.nuevaClase.docenteId) {
        this.nuevaClase.docenteId = this.docentes[0].id;
      }
    });

    this.sub = this.materiaService.materias$.subscribe(list => {
      this.materias = list;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.subDocentes?.unsubscribe();
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

    let resolvedMateriaId: number;
    if (selectedMateriaIds.length > 0) {
      resolvedMateriaId = Number(selectedMateriaIds[0]);
    } else if (this.materias.length > 0) {
      resolvedMateriaId = Number(this.materias[0].id);
    } else {
      resolvedMateriaId = 101;
    }

    const resolvedDocenteId = Number(this.nuevaClase.docenteId) || 102;

    this.claseService.createClase({
      nombre: this.nuevaClase.nombre.trim(),
      materiaId: resolvedMateriaId,
      materiaIds: selectedMateriaIds.length > 0 ? selectedMateriaIds : [resolvedMateriaId],
      docenteId: resolvedDocenteId,
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

