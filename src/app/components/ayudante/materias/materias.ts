import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MateriaDto, MateriaService, RecursoDto, ActividadDto, RegistroAsistenciaDto, AsistenteRegistro } from '../../../services/materia.service';
import { DocenteService, ActividadAyudantiaDto } from '../../../services/docente.service';
import { EstudianteService, BitacoraItemDto } from '../../../services/estudiante.service';

export interface SesionHorarioAyudante {
  id: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  tipo: string;
  aula: string;
  enlaceVirtual?: string;
  temaPrevisto: string;
}

@Component({
  selector: 'app-ayudante-materias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './materias.html',
  styleUrls: ['./materias.css']
})
export class AyudanteMateriasComponent implements OnInit, OnDestroy {
  // Pestañas
  tabActiva: 'catedra' | 'horario' | 'silabo' | 'asistencia' | 'recursos' | 'bitacoras' = 'catedra';

  // Datos de materias
  materias: MateriaDto[] = [];
  materiaSeleccionadaId: number = 101;
  materiaSeleccionada?: MateriaDto;

  // Horario del Ayudante (donde él debe impartir clases/ayudantía)
  horariosAyudantia: SesionHorarioAyudante[] = [
    {
      id: 1,
      dia: 'Lunes',
      horaInicio: '14:00',
      horaFin: '16:00',
      tipo: 'Práctica / Taller Presencial',
      aula: 'Edificio de Aulas B - Aula 204 (Campus Matriz)',
      temaPrevisto: 'Taller de Derivadas Parciales y Modelado Físico'
    },
    {
      id: 2,
      dia: 'Jueves',
      horaInicio: '16:00',
      horaFin: '18:00',
      tipo: 'Tutoría / Refuerzo Virtual',
      aula: 'Sala Virtual Teams / Google Meet',
      enlaceVirtual: 'https://meet.google.com/uteq-ayudantia-calc',
      temaPrevisto: 'Resolución de Dudas y Guía de Taller Grupal'
    }
  ];

  // Sílabo y directrices asignadas por el docente titular
  silaboDirectrices: ActividadAyudantiaDto[] = [];

  // Recursos y Actividades Pedagógicas
  subTabRecursos: 'recursos' | 'actividades' = 'actividades';
  recursosMateria: RecursoDto[] = [];
  actividadesMateria: ActividadDto[] = [];

  // Formulario nuevo recurso
  modalNuevoRecurso = false;
  nuevoRecurso = {
    titulo: '',
    tipo: 'PDF',
    url: 'https://repositorio.uteq.edu.ec/guias/apoyo-ayudantia.pdf',
    descripcion: '',
    esEsencial: true
  };

  // Formulario nueva actividad
  modalNuevaActividad = false;
  nuevaActividad = {
    titulo: '',
    tipo: 'Taller',
    fechaEntrega: '',
    descripcion: '',
    ponderacion: 10
  };

  // Asistencia (optimizada para 20+ estudiantes)
  registrosAsistencia: RegistroAsistenciaDto[] = [];
  sesionAsistenciaSeleccionadaId: number = 1;
  busquedaEstudianteAsistencia: string = '';
  filtroEstadoAsistencia: 'todos' | 'presentes' | 'ausentes' = 'todos';
  
  // Modal para nueva fecha de asistencia
  modalNuevaSesionAsistencia = false;
  nuevaSesion = {
    fecha: new Date().toISOString().split('T')[0],
    tema: 'Taller de Resolución de Problemas Prácticos'
  };

  // Bitácoras
  bitacoras: BitacoraItemDto[] = [];
  modalNuevaBitacora = false;
  nuevaBitacora = {
    actividadesRealizadas: '',
    horasRegistradas: 4,
    evidenciaUrl: 'https://repositorio.uteq.edu.ec/bitacoras/informe-semanal.pdf'
  };

  // Mensajes y estados
  successMessage: string = '';
  errorMessage: string = '';
  Math = Math;
  private subs: Subscription[] = [];

  constructor(
    private materiaService: MateriaService,
    private docenteService: DocenteService,
    private estudianteService: EstudianteService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // 1. Suscribirse a materias
    this.subs.push(
      this.materiaService.materias$.subscribe(list => {
        this.materias = list;
        if (list.length > 0) {
          if (!this.materiaSeleccionadaId || !list.find(m => m.id === this.materiaSeleccionadaId)) {
            this.materiaSeleccionadaId = list[0].id;
          }
          this.seleccionarMateria(this.materiaSeleccionadaId);
        }
      })
    );
    this.materiaService.refreshMaterias().subscribe();

    // 2. Suscribirse a planificaciones/sílabo
    this.subs.push(
      this.docenteService.planificaciones$.subscribe(() => {
        this.cargarSilabo();
      })
    );

    // 3. Suscribirse a bitácoras
    this.subs.push(
      this.estudianteService.bitacoras$.subscribe(list => {
        this.bitacoras = list;
      })
    );

    // 4. Suscribirse a asistencias
    this.subs.push(
      this.materiaService.asistencias$.subscribe(list => {
        this.registrosAsistencia = list.filter(a => Number(a.materiaId) === Number(this.materiaSeleccionadaId));
        if (this.registrosAsistencia.length > 0 && !this.registrosAsistencia.find(r => r.id === this.sesionAsistenciaSeleccionadaId)) {
          this.sesionAsistenciaSeleccionadaId = this.registrosAsistencia[0].id;
        }
      })
    );

    // 5. Query params
    this.subs.push(
      this.route.queryParams.subscribe(params => {
        if (params['tab']) {
          this.tabActiva = params['tab'] as any;
        }
        if (params['materiaId']) {
          const id = Number(params['materiaId']);
          if (id) {
            this.seleccionarMateria(id);
          }
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  // ==================== NAVEGACIÓN Y SELECCIÓN ====================

  seleccionarMateria(id: number) {
    this.materiaSeleccionadaId = Number(id);
    this.materiaSeleccionada = this.materias.find(m => m.id === this.materiaSeleccionadaId) || this.materias[0];

    // Cargar recursos y actividades
    this.recursosMateria = this.materiaService.getRecursosSnapshot(this.materiaSeleccionadaId);
    this.actividadesMateria = this.materiaService.getActividadesSnapshot(this.materiaSeleccionadaId);

    // Cargar asistencias
    const todasAsist: RegistroAsistenciaDto[] = this.materiaService.getAsistenciasSnapshot();
    this.registrosAsistencia = todasAsist.filter((a: RegistroAsistenciaDto) => Number(a.materiaId) === Number(this.materiaSeleccionadaId));
    if (this.registrosAsistencia.length > 0) {
      this.sesionAsistenciaSeleccionadaId = this.registrosAsistencia[0].id;
    }

    // Cargar sílabo
    this.cargarSilabo();
  }

  cambiarTab(tab: 'catedra' | 'horario' | 'silabo' | 'asistencia' | 'recursos' | 'bitacoras') {
    this.tabActiva = tab;
  }

  // ==================== CALIFICACIÓN DIRECTA ====================

  calificarActividad(actividadId: number) {
    // Navegación directa al módulo de calificación con soporte para rol Ayudante
    this.router.navigate(['/ayudante/actividades', actividadId, 'calificar'], {
      queryParams: { materiaId: this.materiaSeleccionadaId }
    });
  }

  // ==================== SÍLABO Y DIRECTRICES ====================

  cargarSilabo() {
    const ayudantiaId = this.materiaSeleccionadaId === 101 ? 1 : 2;
    this.docenteService.getPlanificacionAyudantia(ayudantiaId).subscribe(plan => {
      this.silaboDirectrices = plan;
    });
  }

  toggleSilaboImpartido(actividadId: number) {
    const ayudantiaId = this.materiaSeleccionadaId === 101 ? 1 : 2;
    this.docenteService.toggleActividadCompletada(ayudantiaId, actividadId).subscribe(ok => {
      if (ok) {
        this.mostrarMensajeExito('Estado del tema del sílabo actualizado.');
        this.cargarSilabo();
      }
    });
  }

  // ==================== CONTROL DE ASISTENCIA (20+ ALUMNOS) ====================

  get sesionAsistenciaActual(): RegistroAsistenciaDto | undefined {
    return this.registrosAsistencia.find(r => r.id === this.sesionAsistenciaSeleccionadaId);
  }

  getEstudiantesFiltradosAsistencia(): AsistenteRegistro[] {
    const sesion = this.sesionAsistenciaActual;
    if (!sesion || !sesion.asistentes) return [];

    let list = sesion.asistentes;

    // Filtro estado
    if (this.filtroEstadoAsistencia === 'presentes') {
      list = list.filter(a => a.presente);
    } else if (this.filtroEstadoAsistencia === 'ausentes') {
      list = list.filter(a => !a.presente);
    }

    // Buscador
    if (this.busquedaEstudianteAsistencia.trim()) {
      const q = this.busquedaEstudianteAsistencia.toLowerCase().trim();
      list = list.filter(a => 
        a.nombre.toLowerCase().includes(q) || 
        (a.email && a.email.toLowerCase().includes(q))
      );
    }

    return list;
  }

  contarPresentes(asistentes?: AsistenteRegistro[]): number {
    if (!asistentes) return 0;
    return asistentes.filter(a => a.presente).length;
  }

  toggleAsistenciaEstudiante(estudianteIndex: number) {
    const sesion = this.sesionAsistenciaActual;
    if (!sesion) return;
    this.materiaService.toggleAsistencia(sesion.id, estudianteIndex);
    this.mostrarMensajeExito('Asistencia guardada.');
  }

  marcarTodosAsistencia(presente: boolean) {
    const sesion = this.sesionAsistenciaActual;
    if (!sesion || !sesion.asistentes) return;

    sesion.asistentes.forEach((a, idx) => {
      if (a.presente !== presente) {
        this.materiaService.toggleAsistencia(sesion.id, idx);
      }
    });
    this.mostrarMensajeExito(presente ? 'Todos marcados como Presentes.' : 'Todos marcados como Ausentes.');
  }

  invertirAsistencia() {
    const sesion = this.sesionAsistenciaActual;
    if (!sesion || !sesion.asistentes) return;

    sesion.asistentes.forEach((_, idx) => {
      this.materiaService.toggleAsistencia(sesion.id, idx);
    });
    this.mostrarMensajeExito('Estados de asistencia invertidos.');
  }

  crearNuevaSesionAsistencia() {
    if (!this.nuevaSesion.tema.trim()) {
      this.mostrarMensajeError('Por favor especifica el tema de la sesión.');
      return;
    }

    const estudiantes = this.materiaSeleccionada?.estudiantes || [];
    this.materiaService.addRegistroAsistencia(this.materiaSeleccionadaId, this.nuevaSesion.tema, estudiantes);
    
    // Actualizar lista
    const todas: RegistroAsistenciaDto[] = this.materiaService.getAsistenciasSnapshot();
    this.registrosAsistencia = todas.filter((a: RegistroAsistenciaDto) => Number(a.materiaId) === Number(this.materiaSeleccionadaId));
    if (this.registrosAsistencia.length > 0) {
      this.sesionAsistenciaSeleccionadaId = this.registrosAsistencia[0].id;
    }

    this.modalNuevaSesionAsistencia = false;
    this.mostrarMensajeExito('Nueva sesión de asistencia creada correctamente.');
  }

  // ==================== GESTIÓN DE RECURSOS Y ACTIVIDADES ====================

  guardarRecurso() {
    if (!this.nuevoRecurso.titulo.trim()) {
      this.mostrarMensajeError('Por favor ingresa un título para el recurso.');
      return;
    }

    const recurso: RecursoDto = {
      id: Date.now(),
      materiaId: this.materiaSeleccionadaId,
      titulo: this.nuevoRecurso.titulo,
      tipo: this.nuevoRecurso.tipo,
      url: this.nuevoRecurso.url,
      descripcion: this.nuevoRecurso.descripcion || 'Material de apoyo compartido por el Ayudante de Cátedra.',
      esEsencial: this.nuevoRecurso.esEsencial,
      visto: false,
      creadoPor: 'Ayudante de Cátedra',
      fechaCreacion: new Date().toISOString().split('T')[0]
    };

    this.materiaService.addRecurso(this.materiaSeleccionadaId, recurso);
    this.recursosMateria = this.materiaService.getRecursosSnapshot(this.materiaSeleccionadaId);
    this.modalNuevoRecurso = false;
    this.nuevoRecurso.titulo = '';
    this.nuevoRecurso.descripcion = '';
    this.mostrarMensajeExito('Recurso didáctico agregado con éxito.');
  }

  guardarActividad() {
    if (!this.nuevaActividad.titulo.trim()) {
      this.mostrarMensajeError('Por favor ingresa un título para la actividad.');
      return;
    }

    const actividad: ActividadDto = {
      id: Date.now(),
      materiaId: this.materiaSeleccionadaId,
      titulo: this.nuevaActividad.titulo,
      tipo: this.nuevaActividad.tipo,
      descripcion: this.nuevaActividad.descripcion || 'Actividad práctica para evaluar el progreso formativo.',
      fechaEntrega: this.nuevaActividad.fechaEntrega || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      estado: 'pendiente'
    };

    this.materiaService.addActividad(this.materiaSeleccionadaId, actividad);
    this.actividadesMateria = this.materiaService.getActividadesSnapshot(this.materiaSeleccionadaId);
    this.modalNuevaActividad = false;
    this.nuevaActividad.titulo = '';
    this.nuevaActividad.descripcion = '';
    this.mostrarMensajeExito('Actividad evaluativa creada con éxito.');
  }

  // ==================== BITÁCORAS E INFORMES ====================

  guardarBitacora() {
    if (!this.nuevaBitacora.actividadesRealizadas.trim()) {
      this.mostrarMensajeError('Por favor describe las actividades realizadas durante este periodo.');
      return;
    }

    this.estudianteService.registrarBitacora({
      ayudantiaId: this.materiaSeleccionadaId === 101 ? 1 : 2,
      actividadesRealizadas: this.nuevaBitacora.actividadesRealizadas,
      evidenciaUrl: this.nuevaBitacora.evidenciaUrl
    }).subscribe(() => {
      this.modalNuevaBitacora = false;
      this.nuevaBitacora.actividadesRealizadas = '';
      this.mostrarMensajeExito('Bitácora mensual registrada y enviada al docente titular.');
    });
  }

  // ==================== UTILIDADES ====================

  formatearFecha(fecha?: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  mostrarMensajeExito(msg: string) {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 3500);
  }

  mostrarMensajeError(msg: string) {
    this.errorMessage = msg;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 4500);
  }
}
