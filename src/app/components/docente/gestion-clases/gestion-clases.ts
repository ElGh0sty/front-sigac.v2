import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ClaseService, ClaseSesionDto } from '../../../services/clase.service';
import { MateriaDto, MateriaService } from '../../../services/materia.service';

interface ClaseCreada {
  id: number;
  materiaId: number;
  nombreMateria: string;
  dias: string[];
  fecha?: string;
  horaInicio: string;
  horaFin: string;
  tipoClase: string;
  linkVirtual?: string;
  aplicacionVirtual?: string;
  edificioPresencial?: string;
  aulaPresencial?: string;
  pisoPresencial?: string;
  estudiantes: { id: number; nombre: string; presente: boolean }[];
}

@Component({
  selector: 'app-gestion-clases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-clases.html'
})
export class GestionClasesComponent implements OnInit, OnDestroy {
  private STORAGE_DOCENTE_CLASES = 'sigac_docente_clases_v2';

  nuevaClase = {
    materiaId: 0,
    claseId: null as number | null,
    docenteId: 1,
    diasSeleccionados: [] as string[],
    fecha: '',
    horaInicio: '08:00',
    horaFin: '10:00',
    tipoClase: 'Virtual' as 'Virtual' | 'Presencial',
    linkVirtual: '',
    aplicacionVirtual: 'Google Meet',
    edificioPresencial: '',
    aulaPresencial: '',
    pisoPresencial: ''
  };

  materias: MateriaDto[] = [];
  clasesCreadas: ClaseCreada[] = [];
  claseAsistenciaId: number | null = null;
  isLoading = false;
  successMessage = '';

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private claseService: ClaseService,
    private materiaService: MateriaService
  ) {}

  ngOnInit() {
    const rawUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    this.nuevaClase.docenteId = rawUserId ? parseInt(rawUserId, 10) : 1;

    this.cargarClasesGuardadas();

    this.subs.push(
      this.materiaService.materias$.subscribe(list => {
        this.materias = list;
        if (list.length > 0 && !this.nuevaClase.materiaId) {
          this.nuevaClase.materiaId = list[0].id;
        }
      })
    );

    this.route.queryParams.subscribe(params => {
      if (params['dias']) {
        this.nuevaClase.diasSeleccionados = params['dias'].split(',');
      }
      if (params['horaInicio'] && params['horaFin']) {
        this.nuevaClase.horaInicio = params['horaInicio'];
        this.nuevaClase.horaFin = params['horaFin'];
      }
    });
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  private cargarClasesGuardadas() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_DOCENTE_CLASES);
        if (stored) {
          this.clasesCreadas = JSON.parse(stored);
          return;
        }
      } catch (e) {
        console.warn('Error reading stored docente clases', e);
      }
    }

    // Default inicial si no hay clases creadas
    this.clasesCreadas = [
      {
        id: 1,
        materiaId: 101,
        nombreMateria: 'Cálculo Avanzado',
        dias: ['Lunes', 'Miércoles'],
        fecha: '2026-08-25',
        horaInicio: '08:00',
        horaFin: '10:00',
        tipoClase: 'Presencial',
        edificioPresencial: 'Edificio de Ingeniería',
        aulaPresencial: 'Aula Magna 302',
        pisoPresencial: 'Piso 3',
        estudiantes: [
          { id: 1, nombre: 'Alejandro García', presente: true },
          { id: 2, nombre: 'María López', presente: true },
          { id: 3, nombre: 'Carlos Ruiz', presente: false }
        ]
      }
    ];
    this.guardarEnStorage();
  }

  private guardarEnStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_DOCENTE_CLASES, JSON.stringify(this.clasesCreadas));
      } catch (e) {
        console.warn('Error saving docente clases', e);
      }
    }
  }

  toggleDia(event: any) {
    const dia = event.target.value;
    if (event.target.checked) {
      if (!this.nuevaClase.diasSeleccionados.includes(dia)) {
        this.nuevaClase.diasSeleccionados.push(dia);
      }
    } else {
      this.nuevaClase.diasSeleccionados = this.nuevaClase.diasSeleccionados.filter(d => d !== dia);
    }
  }

  guardarClase() {
    if (this.nuevaClase.diasSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un día de la semana para la clase.');
      return;
    }

    const materiaObj = this.materiaService.getMateriaById(Number(this.nuevaClase.materiaId));
    const nombreMat = materiaObj?.nombre || 'Materia';

    const fechaSesion = this.nuevaClase.fecha || new Date().toISOString().split('T')[0];

    const estudiantesIniciales = materiaObj?.estudiantes?.map(e => ({
      id: e.id,
      nombre: e.nombre,
      presente: false
    })) || [
      { id: 1, nombre: 'Alejandro García', presente: false },
      { id: 2, nombre: 'María López', presente: false },
      { id: 3, nombre: 'Carlos Ruiz', presente: false }
    ];

    const claseParaAgregar: ClaseCreada = {
      id: Date.now(),
      materiaId: Number(this.nuevaClase.materiaId),
      nombreMateria: nombreMat,
      dias: [...this.nuevaClase.diasSeleccionados],
      fecha: fechaSesion,
      horaInicio: this.nuevaClase.horaInicio || '08:00',
      horaFin: this.nuevaClase.horaFin || '10:00',
      tipoClase: this.nuevaClase.tipoClase,
      linkVirtual: this.nuevaClase.linkVirtual,
      aplicacionVirtual: this.nuevaClase.aplicacionVirtual,
      edificioPresencial: this.nuevaClase.edificioPresencial,
      aulaPresencial: this.nuevaClase.aulaPresencial,
      pisoPresencial: this.nuevaClase.pisoPresencial,
      estudiantes: estudiantesIniciales
    };

    this.clasesCreadas.unshift(claseParaAgregar);
    this.guardarEnStorage();

    this.claseService.createClaseSesion({
      materiaId: Number(this.nuevaClase.materiaId),
      claseId: this.nuevaClase.claseId ? Number(this.nuevaClase.claseId) : undefined,
      docenteId: Number(this.nuevaClase.docenteId) || 1,
      fecha: fechaSesion,
      horaInicio: this.nuevaClase.horaInicio || '08:00',
      horaFin: this.nuevaClase.horaFin || '10:00',
      tipoClase: this.nuevaClase.tipoClase,
      linkVirtual: this.nuevaClase.linkVirtual,
      aplicacionVirtual: this.nuevaClase.aplicacionVirtual,
      edificioPresencial: this.nuevaClase.edificioPresencial,
      aulaPresencial: this.nuevaClase.aulaPresencial,
      pisoPresencial: this.nuevaClase.pisoPresencial
    }).subscribe();

    this.successMessage = `¡Clase de ${nombreMat} configurada exitosamente!`;
    setTimeout(() => this.successMessage = '', 4000);

    // Resetear formulario manteniendo la materia
    this.nuevaClase.diasSeleccionados = [];
    this.nuevaClase.fecha = '';
    this.nuevaClase.linkVirtual = '';
    this.nuevaClase.edificioPresencial = '';
    this.nuevaClase.aulaPresencial = '';
  }

  abrirAsistencia(claseId: number) {
    this.claseAsistenciaId = claseId;
  }

  cerrarAsistencia() {
    this.claseAsistenciaId = null;
  }

  toggleAsistencia(claseId: number, estudianteId: number) {
    const clase = this.clasesCreadas.find(c => c.id === claseId);
    if (clase) {
      const estudiante = clase.estudiantes.find(e => e.id === estudianteId);
      if (estudiante) {
        estudiante.presente = !estudiante.presente;
        this.guardarEnStorage();

        this.claseService.registrarAsistencia(claseId, {
          claseSesionId: claseId,
          estudianteId: estudianteId,
          presente: estudiante.presente
        }).subscribe();
      }
    }
  }

  getClaseById(id: number): ClaseCreada | undefined {
    return this.clasesCreadas.find(c => c.id === id);
  }

  contarPresentes(clase: any): number {
    if (!clase || !clase.estudiantes) return 0;
    return clase.estudiantes.filter((e: any) => e.presente).length;
  }

  contarTotal(clase: any): number {
    if (!clase || !clase.estudiantes) return 0;
    return clase.estudiantes.length;
  }

  calcularPorcentajeAsistencia(estudianteId: number, materiaId: number): string {
    const clasesDeMateria = this.clasesCreadas.filter(c => c.materiaId === materiaId);
    if (clasesDeMateria.length === 0) return '0%';

    let presentes = 0;
    for (const clase of clasesDeMateria) {
      const estudiante = clase.estudiantes.find(e => e.id === estudianteId);
      if (estudiante && estudiante.presente) {
        presentes++;
      }
    }
    return Math.round((presentes / clasesDeMateria.length) * 100) + '%';
  }

  Math = Math;
}
