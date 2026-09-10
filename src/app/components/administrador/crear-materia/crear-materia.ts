import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MateriaService } from '../../../services/materia.service';
import { ClaseDto, ClaseService } from '../../../services/clase.service';
import { AdminDocenteService } from '../../../services/admin-docente.service';

@Component({
  selector: 'app-crear-materia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-materia.html'
})
export class CrearMateriaComponent implements OnInit, OnDestroy {
  clases: ClaseDto[] = [];
  private sub?: Subscription;
  private subDocentes?: Subscription;

  docentes: { id: number; nombre: string; correo?: string }[] = [];

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
    docenteResponsableId: 102,
    creditos: 4
  };

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private materiaService: MateriaService,
    private claseService: ClaseService,
    private adminDocenteService: AdminDocenteService
  ) {}

  ngOnInit() {
    this.subDocentes = this.adminDocenteService.getDocentes().subscribe(list => {
      this.docentes = list.map(d => ({
        id: d.id,
        nombre: `${d.nombre} ${d.apellido}`.trim() || d.username,
        correo: d.correo
      }));
      // Si el docente preconfigurado docente@uteq.edu.ec existe, preseleccionarlo con su ID
      const docenteOficial = this.docentes.find(d => (d.correo || '').toLowerCase() === 'docente@uteq.edu.ec');
      if (docenteOficial) {
        this.nuevaMateria.docenteResponsableId = docenteOficial.id;
      } else if (this.docentes.length > 0 && !this.nuevaMateria.docenteResponsableId) {
        this.nuevaMateria.docenteResponsableId = this.docentes[0].id;
      }
    });

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
    this.subDocentes?.unsubscribe();
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

    const selectedDocenteId = Number(this.nuevaMateria.docenteResponsableId) || 102;
    let resolvedClaseId: number | undefined;
    let resolvedClaseNombre = '';

    if (this.nuevaMateria.claseSeleccionada === 'otra') {
      resolvedClaseNombre = this.nuevaMateria.otraClaseNombre.trim();
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

    // 1. Enviar el POST a /api/Materia incluyendo { "nombre": "...", "codigo": "...", "docenteId": <id_del_docente_seleccionado> }
    this.materiaService.createMateria({
      nombre: this.nuevaMateria.nombre.trim(),
      codigo: this.nuevaMateria.codigo.trim().toUpperCase(),
      docenteId: selectedDocenteId,
      docenteResponsableId: selectedDocenteId,
      descripcion: this.nuevaMateria.descripcion?.trim() || '',
      creditos: Number(this.nuevaMateria.creditos) || 4,
      claseId: resolvedClaseId,
      claseNombre: resolvedClaseNombre,
      semestre: this.nuevaMateria.semestre,
      grupo: this.nuevaMateria.grupo
    }).subscribe({
      next: (creada) => {
        // Extraer materiaId y docenteId devueltos por el backend (no valores nulos)
        const returnedMateriaId = Number(creada.id || (creada as any).materiaId);
        const returnedDocenteId = Number((creada as any).docenteId || creada.docenteResponsableId || selectedDocenteId);

        // 2. Si se solicitó crear una nueva cohorte/clase, crearla enviando materiaId y docenteId devueltos
        if (this.nuevaMateria.claseSeleccionada === 'otra' && resolvedClaseNombre) {
          this.claseService.createClase({
            nombre: resolvedClaseNombre,
            semestre: this.nuevaMateria.semestre,
            materiaId: returnedMateriaId,
            materiaIds: [returnedMateriaId],
            docenteId: returnedDocenteId,
            carrera: 'Ingeniería',
            descripcion: `Cohorte creada junto con la materia ${creada.nombre}`
          }).subscribe({
            next: (claseCreada) => {
              creada.claseId = claseCreada.id;
              creada.claseNombre = claseCreada.nombre;
              this.finalizarGuardadoExitoso(creada.nombre, resolvedClaseNombre);
            },
            error: () => {
              this.finalizarGuardadoExitoso(creada.nombre, resolvedClaseNombre);
            }
          });
        } else {
          this.finalizarGuardadoExitoso(creada.nombre, resolvedClaseNombre);
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Hubo un error al guardar la materia en el backend. Verifica la conexión.';
      }
    });
  }

  private finalizarGuardadoExitoso(materiaNombre: string, claseNombre: string) {
    this.isLoading = false;
    this.successMessage = `¡Materia "${materiaNombre}" registrada y asignada a "${claseNombre || 'la cohorte'}" exitosamente!`;
    setTimeout(() => {
      this.router.navigate(['/admin/materias']);
    }, 1200);
  }
}

