import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MateriaService, MateriaDto, RecursoDto, ActividadDto, RegistroAsistenciaDto } from '../../../services/materia.service';

@Component({
  selector: 'app-materia-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './materia-detalle.html'
})
export class MateriaDetalleComponent implements OnInit, OnDestroy {
  materiaId: number = 0;
  indiceTemaActual: number = 0;
  tabActual: 'recursos' | 'actividades' | 'asistencia' = 'recursos';

  rol: string = 'Estudiante';
  esAyudante: boolean = false;
  esDocente: boolean = false;
  esAdmin: boolean = false;
  canEdit: boolean = false;

  materia: MateriaDto = {
    id: 101,
    nombre: 'Cálculo Avanzado',
    codigo: 'MAT-301',
    descripcion: 'Derivadas parciales e integrales múltiples.',
    docente: 'Dra. Evelyn Vance',
    creditos: 4,
    semana: 8,
    totalSemanas: 16,
    estudiantes: []
  };

  temas: string[] = ['Tema 1: Fundamentos y Conceptos Iniciales'];
  recursosDeMateria: RecursoDto[] = [];
  actividadesDeMateria: ActividadDto[] = [];
  registrosAsistencia: RegistroAsistenciaDto[] = [];

  showAddRecurso = false;
  showAddActividad = false;
  showAddClase = false;
  showAddTema = false;

  newTemaNombre = '';
  newClaseTema = '';

  nuevoRecurso = {
    nombre: '',
    tipo: 'PDF',
    esencial: false,
    url: 'https://ejemplo.edu/recurso.pdf',
    descripcion: '',
    temaNombre: ''
  };

  nuevaActividad = {
    nombre: '',
    tipo: 'Taller',
    fechaEntrega: '',
    descripcion: ''
  };

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private materiaService: MateriaService
  ) {}

  ngOnInit() {
    this.detectarRol();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.materiaId = Number(params['id']);
      } else {
        this.materiaId = 101;
      }
      this.cargarDatosMateria();
    });

    // Suscribirse a cambios en recursos
    this.subs.push(
      this.materiaService.recursos$.subscribe(allRecursos => {
        this.recursosDeMateria = allRecursos.filter(r => Number(r.materiaId) === Number(this.materiaId));
      })
    );

    // Suscribirse a cambios en actividades
    this.subs.push(
      this.materiaService.actividades$.subscribe(allActs => {
        this.actividadesDeMateria = allActs.filter(a => Number(a.materiaId) === Number(this.materiaId));
      })
    );

    // Suscribirse a cambios en asistencia
    this.subs.push(
      this.materiaService.asistencias$.subscribe(allAsist => {
        this.registrosAsistencia = allAsist.filter(a => Number(a.materiaId) === Number(this.materiaId));
      })
    );

    // Suscribirse a materias para sincronizar datos del banner
    this.subs.push(
      this.materiaService.materias$.subscribe(() => {
        const found = this.materiaService.getMateriaById(this.materiaId);
        if (found) {
          this.materia = found;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  detectarRol() {
    if (typeof window !== 'undefined') {
      this.rol = localStorage.getItem('rol') || 'Estudiante';
      this.esAyudante = this.rol === 'Ayudante';
      this.esDocente = this.rol === 'Docente';
      this.esAdmin = this.rol === 'Administrador' || this.rol === 'Admin';
      this.canEdit = this.esAyudante || this.esDocente || this.esAdmin;
    }
  }

  cargarDatosMateria() {
    const found = this.materiaService.getMateriaById(this.materiaId);
    if (found) {
      this.materia = found;
    } else {
      this.materia = {
        id: this.materiaId,
        nombre: `Materia #${this.materiaId}`,
        codigo: `MAT-${this.materiaId}`,
        docente: 'Docente Asignado',
        creditos: 4,
        semana: 1,
        totalSemanas: 16,
        estudiantes: []
      };
    }

    this.temas = this.materiaService.getTemasByMateria(this.materiaId);
    if (this.indiceTemaActual >= this.temas.length) {
      this.indiceTemaActual = 0;
    }
    this.nuevoRecurso.temaNombre = this.temas[this.indiceTemaActual] || 'Tema 1: Fundamentos';

    // Cargar listas iniciales
    this.recursosDeMateria = this.materiaService.getRecursosSnapshot().filter(r => Number(r.materiaId) === Number(this.materiaId));
  }

  get temaActualNombre(): string {
    return this.temas[this.indiceTemaActual] || 'Tema Principal';
  }

  get recursosDelTemaActual(): RecursoDto[] {
    const temaActual = this.temaActualNombre;
    return this.recursosDeMateria.filter(r => !r.temaNombre || r.temaNombre === temaActual);
  }

  irAlTemaAnterior() {
    if (this.indiceTemaActual > 0) {
      this.indiceTemaActual--;
      this.nuevoRecurso.temaNombre = this.temaActualNombre;
    }
  }

  irAlTemaSiguiente() {
    if (this.indiceTemaActual < this.temas.length - 1) {
      this.indiceTemaActual++;
      this.nuevoRecurso.temaNombre = this.temaActualNombre;
    }
  }

  seleccionarTema(index: number) {
    this.indiceTemaActual = index;
    this.nuevoRecurso.temaNombre = this.temaActualNombre;
  }

  agregarNuevoTema() {
    if (!this.newTemaNombre.trim()) return;
    this.temas = this.materiaService.addTemaToMateria(this.materiaId, this.newTemaNombre);
    this.indiceTemaActual = this.temas.length - 1;
    this.nuevoRecurso.temaNombre = this.temaActualNombre;
    this.newTemaNombre = '';
    this.showAddTema = false;
  }

  toggleVisto(id: number) {
    this.materiaService.marcarRecursoComoVisto(id).subscribe();
  }

  toggleEsencial(id: number) {
    this.materiaService.toggleRecursoEsencial(id);
  }

  eliminarRecurso(id: number) {
    if (confirm('¿Estás seguro de eliminar este recurso educativo?')) {
      this.materiaService.deleteRecurso(id);
    }
  }

  agregarRecurso() {
    if (!this.nuevoRecurso.nombre.trim()) return;

    this.materiaService.addRecurso(this.materiaId, {
      titulo: this.nuevoRecurso.nombre,
      descripcion: this.nuevoRecurso.descripcion || `Recurso de ${this.nuevoRecurso.tipo}`,
      url: this.nuevoRecurso.url || 'https://ejemplo.edu/recurso.pdf',
      tipo: this.nuevoRecurso.tipo,
      esEsencial: this.nuevoRecurso.esencial,
      materiaId: this.materiaId,
      temaNombre: this.nuevoRecurso.temaNombre || this.temaActualNombre
    }).subscribe(() => {
      this.nuevoRecurso = {
        nombre: '',
        tipo: 'PDF',
        esencial: false,
        url: 'https://ejemplo.edu/recurso.pdf',
        descripcion: '',
        temaNombre: this.temaActualNombre
      };
      this.showAddRecurso = false;
    });
  }

  agregarActividad() {
    if (!this.nuevaActividad.nombre.trim() || !this.nuevaActividad.fechaEntrega) return;

    this.materiaService.addActividad(this.materiaId, {
      titulo: this.nuevaActividad.nombre,
      descripcion: this.nuevaActividad.descripcion || 'Sin descripción',
      fechaEntrega: this.nuevaActividad.fechaEntrega,
      tipo: this.nuevaActividad.tipo,
      materiaId: this.materiaId
    }).subscribe(() => {
      this.nuevaActividad = { nombre: '', tipo: 'Taller', fechaEntrega: '', descripcion: '' };
      this.showAddActividad = false;
    });
  }

  marcarActividadEntregada(actividadId: number) {
    this.materiaService.updateActividadEstado(actividadId, 'entregada');
  }

  calificarActividad(actividadId: number) {
    const notaPrompt = prompt('Introduce la calificación numérica para el estudiante (ej. 4.8):', '5.0');
    if (notaPrompt !== null) {
      const notaNum = parseFloat(notaPrompt);
      if (!isNaN(notaNum)) {
        this.materiaService.updateActividadEstado(actividadId, 'calificada', notaNum);
      }
    }
  }

  eliminarActividad(actividadId: number) {
    if (confirm('¿Deseas eliminar esta actividad del curso?')) {
      this.materiaService.deleteActividad(actividadId);
    }
  }

  agregarClase() {
    if (!this.newClaseTema.trim()) return;
    this.materiaService.addRegistroAsistencia(this.materiaId, this.newClaseTema, this.materia.estudiantes);
    this.newClaseTema = '';
    this.showAddClase = false;
  }

  toggleAsistencia(registroId: number, estudianteIndex: number) {
    this.materiaService.toggleAsistencia(registroId, estudianteIndex);
  }

  contarPresentes(asistentes: any[]): number {
    if (!asistentes) return 0;
    return asistentes.filter(a => a.presente).length;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
