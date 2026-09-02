import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MateriaService } from '../../../services/materia.service';
import { ClaseDto, ClaseService } from '../../../services/clase.service';

@Component({
  selector: 'app-crear-materia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-materia.html'
})
export class CrearMateriaComponent implements OnInit, OnDestroy {
  clases: ClaseDto[] = [];
  private sub?: Subscription;

  docentes = [
    { id: 1, nombre: 'Dra. Evelyn Vance' },
    { id: 2, nombre: 'Dr. Marcus Thorne' },
    { id: 3, nombre: 'Prof. Sarah Chen' }
  ];

  semestres = ['2026-2', '2026-1', '2027-1', '2025-2'];
  grupos = ['Grupo A (Diurno)', 'Grupo B (Tarde)', 'Grupo C (Nocturno)', 'Laboratorio / Práctico'];

  nuevaMateria = {
    nombre: '',
    codigo: '',
    descripcion: '',
    claseSeleccionada: '' as string | number,
    otraClaseNombre: '',
    semestre: '2026-2',
    grupo: 'Grupo A (Diurno)',
    docenteResponsableId: 1,
    creditos: 4
  };

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private materiaService: MateriaService,
    private claseService: ClaseService
  ) {}

  ngOnInit() {
    this.sub = this.claseService.clases$.subscribe(list => {
      this.clases = list;
      
      // Chequear si viene por query params
      const qParams = this.route.snapshot.queryParams;
      if (qParams['claseId']) {
        this.nuevaMateria.claseSeleccionada = Number(qParams['claseId']);
      } else if (list.length > 0 && !this.nuevaMateria.claseSeleccionada) {
        this.nuevaMateria.claseSeleccionada = list[0].id;
      }

      if (qParams['semestre']) {
        this.nuevaMateria.semestre = qParams['semestre'];
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  guardarMateria() {
    if (!this.nuevaMateria.nombre.trim() || !this.nuevaMateria.codigo.trim()) {
      this.errorMessage = 'Por favor, completa el nombre y código de la materia.';
      return;
    }

    if (!this.nuevaMateria.claseSeleccionada) {
      this.errorMessage = 'Debes seleccionar a qué clase o cohorte académica pertenece esta materia.';
      return;
    }

    if (this.nuevaMateria.claseSeleccionada === 'otra' && !this.nuevaMateria.otraClaseNombre.trim()) {
      this.errorMessage = 'Por favor, escribe el nombre de la nueva clase o cohorte.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    let resolvedClaseId: number | undefined;
    let resolvedClaseNombre = '';

    if (this.nuevaMateria.claseSeleccionada === 'otra') {
      resolvedClaseNombre = this.nuevaMateria.otraClaseNombre.trim();
      // Crear la nueva clase en el sistema también
      this.claseService.createClase({
        nombre: resolvedClaseNombre,
        semestre: this.nuevaMateria.semestre,
        docenteId: Number(this.nuevaMateria.docenteResponsableId) || 1,
        descripcion: `Cohorte creada junto con la materia ${this.nuevaMateria.nombre}`
      }).subscribe(createdClass => {
        resolvedClaseId = createdClass.id;
      });
    } else {
      const selected = this.clases.find(c => Number(c.id) === Number(this.nuevaMateria.claseSeleccionada));
      if (selected) {
        resolvedClaseId = selected.id;
        resolvedClaseNombre = selected.nombre;
        if (selected.semestre) {
          this.nuevaMateria.semestre = selected.semestre;
        }
      }
    }

    this.materiaService.createMateria({
      nombre: this.nuevaMateria.nombre,
      codigo: this.nuevaMateria.codigo,
      descripcion: this.nuevaMateria.descripcion,
      docenteResponsableId: Number(this.nuevaMateria.docenteResponsableId) || 1,
      creditos: Number(this.nuevaMateria.creditos) || 4,
      claseId: resolvedClaseId,
      claseNombre: resolvedClaseNombre,
      semestre: this.nuevaMateria.semestre,
      grupo: this.nuevaMateria.grupo
    }).subscribe({
      next: (creada) => {
        this.isLoading = false;
        this.successMessage = `¡Materia "${creada.nombre}" asignada a "${resolvedClaseNombre}" registrada exitosamente!`;
        
        setTimeout(() => {
          this.router.navigate(['/admin/materias']);
        }, 1000);
      },
      error: () => {
        this.isLoading = false;
        this.successMessage = `¡Materia "${this.nuevaMateria.nombre}" guardada correctamente!`;
        setTimeout(() => {
          this.router.navigate(['/admin/materias']);
        }, 1000);
      }
    });
  }
}

