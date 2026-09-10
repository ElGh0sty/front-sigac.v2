import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ClaseService } from '../../../services/clase.service';
import { MateriaDto, MateriaService, RecursoDto, ActividadDto } from '../../../services/materia.service';
import { DocumentosDescargaService } from '../../../services/documentos-descarga.service';
import { DirectorioService } from '../../../services/directorio.service';
import {
  DocenteService,
  ActividadAyudantiaDto,
  MonitoreoAyudantiaDto,
  HorarioOcupadoAlumnoDto,
  EvaluacionDto
} from '../../../services/docente.service';

export interface ClaseCreada {
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
  estudiantes: { id: number; nombre: string; presente: boolean; correo?: string; username?: string }[];
}

export interface AyudanteCatedraInfo {
  id: number;
  ayudantiaId: number;
  catedraId: number;
  nombre: string;
  correo: string;
  estado: string;
  horasAsignadas: number;
  horasCompletadas: number;
  avatar: string;
}

@Component({
  selector: 'app-gestion-clases',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gestion-clases.html'
})
export class GestionClasesComponent implements OnInit, OnDestroy {
  private STORAGE_DOCENTE_CLASES = 'sigac_docente_clases_v2';

  // Control de pestañas
  tabActiva: 'catedras' | 'horarios' | 'silabo' | 'crear-clase' | 'recursos' = 'catedras';

  // Datos principales
  docenteIdLogueado: number = 1;
  nombreDocente: string = 'Dra. Evelyn Vance';
  materias: MateriaDto[] = [];
  materiaSeleccionadaId: number = 101;

  // Clases programadas
  clasesCreadas: ClaseCreada[] = [];
  claseAsistenciaId: number | null = null;

  // Formulario para crear clase
  nuevaClase = {
    materiaId: 101,
    claseId: 1,
    docenteId: 1,
    diasSeleccionados: ['Lunes'] as string[],
    fecha: '',
    horaInicio: '08:00',
    horaFin: '10:00',
    tipoClase: 'Virtual' as 'Virtual' | 'Presencial',
    linkVirtual: 'https://meet.google.com/abc-defg-hij',
    aplicacionVirtual: 'Google Meet',
    edificioPresencial: 'Edificio de Ingeniería',
    aulaPresencial: 'Aula Magna 302',
    pisoPresencial: 'Piso 3'
  };

  // Detección de conflicto de horarios
  conflictoDetectado: HorarioOcupadoAlumnoDto | null = null;
  horariosOcupadosAlumnos: HorarioOcupadoAlumnoDto[] = [];

  // Ayudantes de cátedra
  ayudantesCatedra: AyudanteCatedraInfo[] = [];

  ayudanteSeleccionado: AyudanteCatedraInfo | null = null;
  monitoreoAyudanteActual: MonitoreoAyudantiaDto | null = null;
  modalBitacorasAbierto: boolean = false;
  tabMonitoreo: 'informes' | 'bitacoras' = 'informes';
  informesAyudanteActual: any[] = [];

  // Sílabo / Planificación para el ayudante
  planificacionSilabo: ActividadAyudantiaDto[] = [];
  nuevaActividadSilabo = {
    semana: 4,
    tema: '',
    descripcion: '',
    directrices: '',
    fechaPlanificada: '',
    recursosSugeridos: ''
  };

  // Recursos Pedagógicos (Opciones del ayudante / docente)
  recursosMateria: RecursoDto[] = [];
  subTabRecursos: 'recursos' | 'actividades' = 'recursos';
  nuevoRecurso = {
    titulo: '',
    tipo: 'PDF',
    esEsencial: true,
    url: 'https://repositorio.uteq.edu.ec/guias/calculo-avanzado.pdf',
    descripcion: '',
    temaNombre: 'Tema 1: Fundamentos y Derivadas Parciales'
  };

  // Actividades Pedagógicas
  actividadesMateria: ActividadDto[] = [];
  nuevaActividad = {
    titulo: '',
    tipo: 'Taller',
    fechaEntrega: '',
    descripcion: '',
    ponderacion: 10
  };

  // Archivos adjuntos seleccionados
  archivoRecurso: { nombre: string; tamanoKb: number; dataUrl: string } | null = null;
  archivoActividad: { nombre: string; tamanoKb: number; dataUrl: string } | null = null;

  // Mensajes y estados
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Notificación de credenciales en pantalla
  credencialesNotificacion = {
    mostrar: false,
    mensaje: '',
    username: '',
    tempPassword: ''
  };
  copiadoCredenciales = false;

  // Modal para agregar estudiante a la clase
  mostrarModalAgregarEstudiante = false;
  nuevoEstudianteClase = {
    nombre: '',
    correo: '',
    cedula: '',
    matricula: ''
  };

  private subs: Subscription[] = [];
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private claseService: ClaseService,
    private materiaService: MateriaService,
    private docenteService: DocenteService,
    private descargaService: DocumentosDescargaService,
    private directorioService: DirectorioService
  ) {}

  ngOnInit() {
    const rawUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (rawUserId) {
      this.docenteIdLogueado = parseInt(rawUserId, 10);
    }
    const rawNombre = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
    if (rawNombre) {
      this.nombreDocente = rawNombre;
    }

    this.cargarClasesGuardadas();

    // Suscripción a Materias
    this.subs.push(
      this.materiaService.materias$.subscribe(list => {
        this.materias = list;
        if (list.length > 0) {
          if (!this.materiaSeleccionadaId) {
            this.materiaSeleccionadaId = list[0].id;
          }
          this.nuevaClase.materiaId = this.materiaSeleccionadaId;
          this.actualizarRecursosYActividades();
        }
      })
    );

    // Suscripción a Ocupaciones de Alumnos
    this.subs.push(
      this.docenteService.ocupaciones$.subscribe(ocupaciones => {
        this.horariosOcupadosAlumnos = ocupaciones;
        this.revisarConflictoHorario();
      })
    );

    // Query params para tab y preselección
    this.subs.push(
      this.route.queryParams.subscribe(params => {
        if (params['tab']) {
          this.tabActiva = params['tab'] as any;
        }
        if (params['materiaId']) {
          this.materiaSeleccionadaId = Number(params['materiaId']);
          this.nuevaClase.materiaId = this.materiaSeleccionadaId;
        }
        if (params['dia']) {
          this.nuevaClase.diasSeleccionados = [params['dia']];
        }
        if (params['horaInicio']) {
          this.nuevaClase.horaInicio = params['horaInicio'];
        }
        if (params['horaFin']) {
          this.nuevaClase.horaFin = params['horaFin'];
        }
        this.revisarConflictoHorario();
      })
    );

    // Cargar ayudante inicial para sílabo si existe
    if (this.ayudantesCatedra.length > 0) {
      this.seleccionarAyudanteParaSilabo(this.ayudantesCatedra[0]);
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  setTab(tab: 'catedras' | 'horarios' | 'silabo' | 'crear-clase' | 'recursos') {
    this.tabActiva = tab;
    if (tab === 'horarios' || tab === 'crear-clase') {
      this.revisarConflictoHorario();
    }
    if (tab === 'recursos') {
      this.actualizarRecursosYActividades();
    }
  }

  cambiarMateriaSeleccionada(materiaId: number) {
    this.materiaSeleccionadaId = Number(materiaId);
    this.nuevaClase.materiaId = this.materiaSeleccionadaId;
    this.actualizarRecursosYActividades();

    // Actualizar ayudante seleccionado si corresponde
    const ayudante = this.ayudantesCatedra.find(a => a.catedraId === this.materiaSeleccionadaId);
    if (ayudante) {
      this.seleccionarAyudanteParaSilabo(ayudante);
    }

    this.revisarConflictoHorario();
  }

  get materiaSeleccionada(): MateriaDto | undefined {
    return this.materias.find(m => m.id === Number(this.materiaSeleccionadaId)) || this.materias[0];
  }

  get ayudantesDeMateriaActual(): AyudanteCatedraInfo[] {
    return this.ayudantesCatedra.filter(a => a.catedraId === Number(this.materiaSeleccionadaId));
  }

  // ==========================================
  // GESTIÓN DE HORARIOS Y CONFLICTOS DE ALUMNOS
  // ==========================================

  revisarConflictoHorario() {
    const dia = this.nuevaClase.diasSeleccionados[0] || 'Lunes';
    const horaInicio = this.nuevaClase.horaInicio || '08:00';
    const horaFin = this.nuevaClase.horaFin || '10:00';

    this.conflictoDetectado = this.docenteService.verificarConflictoHorario(
      this.nuevaClase.claseId || 1,
      dia,
      horaInicio,
      horaFin
    );
  }

  getOcupacionEnCelda(dia: string, horaInicio: string): HorarioOcupadoAlumnoDto | undefined {
    return this.horariosOcupadosAlumnos.find(o =>
      o.dia.toLowerCase() === dia.toLowerCase() && o.horaInicio === horaInicio
    );
  }

  getClaseDocenteEnCelda(dia: string, horaInicio: string): ClaseCreada | undefined {
    return this.clasesCreadas.find(c =>
      c.dias.some(d => d.toLowerCase() === dia.toLowerCase()) && c.horaInicio === horaInicio
    );
  }

  seleccionarSlotHorario(dia: string, horaInicio: string, horaFin: string) {
    // Si la celda está ocupada por alumnos, mostrar advertencia
    const conflicto = this.getOcupacionEnCelda(dia, horaInicio);
    if (conflicto) {
      alert(`⚠️ Los alumnos están ocupados los ${dia}s a las ${horaInicio} con '${conflicto.materiaOcupada}'. No se recomienda programar en este horario.`);
      return;
    }

    this.nuevaClase.diasSeleccionados = [dia];
    this.nuevaClase.horaInicio = horaInicio;
    this.nuevaClase.horaFin = horaFin;
    this.revisarConflictoHorario();
    this.setTab('crear-clase');
  }

  // ==========================================
  // SÍLABO Y GUÍA DIDÁCTICA PARA EL AYUDANTE
  // ==========================================

  seleccionarAyudanteParaSilabo(ayudante: AyudanteCatedraInfo) {
    this.ayudanteSeleccionado = ayudante;
    this.docenteService.getPlanificacionAyudantia(ayudante.ayudantiaId).subscribe(plan => {
      this.planificacionSilabo = plan;
    });
  }

  abrirMonitoreoBitacoras(ayudante: AyudanteCatedraInfo) {
    this.ayudanteSeleccionado = ayudante;
    this.tabMonitoreo = 'informes';
    this.cargarInformesDeAyudante(ayudante);
    this.docenteService.monitorearAyudantia(ayudante.ayudantiaId).subscribe(monitoreo => {
      this.monitoreoAyudanteActual = monitoreo;
      this.modalBitacorasAbierto = true;
    });
  }

  cargarInformesDeAyudante(ayudante: AyudanteCatedraInfo) {
    let todosLosInformes: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sigac_informes_ayudantia_v1');
        if (stored) {
          todosLosInformes = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Error al cargar informes de ayudantía', e);
      }
    }

    if (!Array.isArray(todosLosInformes) || todosLosInformes.length === 0) {
      todosLosInformes = [
        {
          id: 1,
          numeroResolucion: 'RES-FAC-2026-084-AYUD',
          tipoInforme: 'Mensual',
          ayudantiaId: 101,
          catedraNombre: 'Cálculo Avanzado',
          periodo: 'Agosto 2026',
          horasTotales: 24,
          diasPorSemana: 3,
          modalidad: 'Presencial',
          temasImpartidos: 'Ejercicios de integración múltiple, Teorema de Fubini y cambio de variables con Jacobiano.',
          anexos: [
            { id: 'anx-1', nombre: 'Hojas_Asistencia_Firmadas_Agosto.pdf', tamanoKb: 1420, tipo: 'documento_firmado', fechaCarga: '2026-08-31' }
          ],
          estado: 'Aprobado por Docente',
          fechaCreacion: '2026-08-31 16:20'
        },
        {
          id: 2,
          numeroResolucion: 'RES-FAC-2026-084-AYUD',
          tipoInforme: 'Mensual',
          ayudantiaId: 101,
          catedraNombre: 'Cálculo Avanzado',
          periodo: 'Septiembre 2026',
          horasTotales: 28,
          diasPorSemana: 3,
          modalidad: 'Virtual',
          temasImpartidos: 'Campos vectoriales, rotacional, divergencia y resolución de guías de estudio para el examen intermedio.',
          anexos: [
            { id: 'anx-2', nombre: 'Captura_Meet_Sesion_09_02.png', tamanoKb: 840, tipo: 'captura_videollamada', fechaCarga: '2026-09-02' }
          ],
          estado: 'Enviado a Coordinación',
          fechaCreacion: '2026-09-02 18:00'
        }
      ];
    }

    // Filtrar los informes de este ayudante o de la cátedra activa
    this.informesAyudanteActual = todosLosInformes.filter(
      inf => Number(inf.ayudantiaId) === Number(ayudante.ayudantiaId) ||
             Number(inf.ayudantiaId) === Number(ayudante.catedraId) ||
             Number(inf.ayudantiaId) === Number(ayudante.id) ||
             ayudante.nombre.toLowerCase().includes('alejandro')
    );
  }

  aprobarInformeAyudante(inf: any) {
    inf.estado = 'Aprobado por Docente';
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sigac_informes_ayudantia_v1');
        let lista = stored ? JSON.parse(stored) : [];
        const idx = lista.findIndex((item: any) => item.id === inf.id);
        if (idx !== -1) {
          lista[idx].estado = 'Aprobado por Docente';
        } else {
          lista.unshift(inf);
        }
        localStorage.setItem('sigac_informes_ayudantia_v1', JSON.stringify(lista));
      } catch (e) {
        console.warn('Error al actualizar informe', e);
      }
    }
    this.successMessage = `¡Informe "${inf.numeroResolucion}" aprobado exitosamente por el docente responsable!`;
    setTimeout(() => { this.successMessage = ''; }, 4500);
  }

  descargarInformeAyudante(inf: any) {
    const htmlContenido = this.descargaService.construirHtmlInformeAyudantia({
      titulo: `INFORME DE RENDICIÓN DE ACTIVIDADES - ${inf.numeroResolucion}`,
      codigoResolucion: inf.numeroResolucion,
      periodo: inf.periodo,
      materia: inf.catedraNombre || this.materiaSeleccionada?.nombre || 'Cálculo Avanzado',
      ayudante: this.ayudanteSeleccionado?.nombre || 'Alejandro García',
      docente: this.nombreDocente || 'Docente Responsable',
      modalidad: inf.modalidad,
      horas: inf.horasTotales,
      diasPorSemana: inf.diasPorSemana,
      temas: inf.temasImpartidos,
      anexos: inf.anexos,
      estado: inf.estado
    });

    const nombreArchivo = `INFORME_AYUDANTIA_${inf.numeroResolucion.replace(/[\/\s]/g, '_')}_${inf.periodo.replace(/[\/\s]/g, '_')}.html`;
    this.descargaService.descargarArchivo(nombreArchivo, htmlContenido);
  }

  imprimirInformeAyudante(inf: any) {
    const htmlContenido = this.descargaService.construirHtmlInformeAyudantia({
      titulo: `INFORME DE RENDICIÓN DE ACTIVIDADES - ${inf.numeroResolucion}`,
      codigoResolucion: inf.numeroResolucion,
      periodo: inf.periodo,
      materia: inf.catedraNombre || this.materiaSeleccionada?.nombre || 'Cálculo Avanzado',
      ayudante: this.ayudanteSeleccionado?.nombre || 'Alejandro García',
      docente: this.nombreDocente || 'Docente Responsable',
      modalidad: inf.modalidad,
      horas: inf.horasTotales,
      diasPorSemana: inf.diasPorSemana,
      temas: inf.temasImpartidos,
      anexos: inf.anexos,
      estado: inf.estado
    });

    this.descargaService.imprimirDocumentoOficial(htmlContenido, `Informe_Ayudantia_${inf.numeroResolucion}`);
  }

  cerrarMonitoreoBitacoras() {
    this.modalBitacorasAbierto = false;
    this.monitoreoAyudanteActual = null;
  }

  agregarActividadAlSilabo() {
    if (!this.ayudanteSeleccionado) {
      alert('Por favor selecciona un ayudante de cátedra.');
      return;
    }

    if (!this.nuevaActividadSilabo.tema.trim()) {
      alert('Debes indicar el tema que el ayudante debe impartir.');
      return;
    }

    const payload: ActividadAyudantiaDto = {
      id: Date.now(),
      ayudantiaId: this.ayudanteSeleccionado.ayudantiaId,
      semana: this.nuevaActividadSilabo.semana,
      tema: this.nuevaActividadSilabo.tema.trim(),
      descripcion: this.nuevaActividadSilabo.descripcion.trim() || `Guía de enseñanza para la semana ${this.nuevaActividadSilabo.semana}`,
      directrices: this.nuevaActividadSilabo.directrices.trim() || 'Resolver ejercicios y orientar a los alumnos en dudas teóricas.',
      fechaPlanificada: this.nuevaActividadSilabo.fechaPlanificada || new Date().toISOString().split('T')[0],
      recursosSugeridos: this.nuevaActividadSilabo.recursosSugeridos.trim() || 'Guía de ejercicios y presentaciones del curso',
      completada: false
    };

    this.isLoading = true;
    this.docenteService.planificarActividadAyudantia(this.ayudanteSeleccionado.ayudantiaId, payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.planificacionSilabo.unshift(res);
        this.successMessage = `¡Directriz del sílabo asignada exitosamente al ayudante ${this.ayudanteSeleccionado?.nombre}!`;
        setTimeout(() => this.successMessage = '', 4000);

        // Reset
        this.nuevaActividadSilabo.tema = '';
        this.nuevaActividadSilabo.descripcion = '';
        this.nuevaActividadSilabo.directrices = '';
        this.nuevaActividadSilabo.recursosSugeridos = '';
        this.nuevaActividadSilabo.semana++;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleCumplimientoSilabo(actividad: ActividadAyudantiaDto) {
    if (!this.ayudanteSeleccionado) return;
    this.docenteService.toggleActividadPlanificada(this.ayudanteSeleccionado.ayudantiaId, actividad.id).subscribe(() => {
      actividad.completada = !actividad.completada;
    });
  }

  eliminarActividadSilabo(actividadId: number) {
    if (!this.ayudanteSeleccionado) return;
    if (confirm('¿Deseas eliminar este tema del sílabo del ayudante?')) {
      this.docenteService.eliminarActividadPlanificada(this.ayudanteSeleccionado.ayudantiaId, actividadId).subscribe(() => {
        this.planificacionSilabo = this.planificacionSilabo.filter(a => a.id !== actividadId);
      });
    }
  }

  // Navegación a Revisar y Calificar Actividades Formativas
  irARevisarActividades() {
    this.tabActiva = 'recursos';
    this.subTabRecursos = 'actividades';
  }

  // ==========================================
  // CREACIÓN Y PROGRAMACIÓN DE CLASES
  // ==========================================

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

    // Default inicial
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
          { id: 3, nombre: 'Carlos Ruiz', presente: false },
          { id: 4, nombre: 'Ana Torres', presente: true }
        ]
      },
      {
        id: 2,
        materiaId: 102,
        nombreMateria: 'Mecánica Cuántica',
        dias: ['Jueves'],
        fecha: '2026-08-28',
        horaInicio: '10:00',
        horaFin: '12:00',
        tipoClase: 'Virtual',
        linkVirtual: 'https://meet.google.com/qnt-mech-2026',
        aplicacionVirtual: 'Google Meet',
        estudiantes: [
          { id: 1, nombre: 'Alejandro García', presente: true },
          { id: 2, nombre: 'María López', presente: false }
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
    this.revisarConflictoHorario();
  }

  guardarClase() {
    if (this.nuevaClase.diasSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un día de la semana para la clase.');
      return;
    }

    // Verificar si hay choque de horario con alumnos
    this.revisarConflictoHorario();
    if (this.conflictoDetectado) {
      const confirmacion = confirm(
        `⚠️ ADVERTENCIA: Los estudiantes están ocupados en '${this.conflictoDetectado.materiaOcupada}' en este horario.\n¿Estás seguro de que deseas forzar la creación de la clase de todas formas?`
      );
      if (!confirmacion) {
        return;
      }
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

    // Registrar en backend / servicio
    this.claseService.createClaseSesion({
      materiaId: Number(this.nuevaClase.materiaId),
      claseId: this.nuevaClase.claseId ? Number(this.nuevaClase.claseId) : undefined,
      docenteId: this.docenteIdLogueado,
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

    this.successMessage = `¡Clase de ${nombreMat} programada exitosamente!`;
    setTimeout(() => this.successMessage = '', 4000);

    // Resetear formulario manteniendo la materia
    this.nuevaClase.diasSeleccionados = ['Lunes'];
    this.nuevaClase.fecha = '';
    this.nuevaClase.linkVirtual = '';
    this.nuevaClase.edificioPresencial = '';
    this.nuevaClase.aulaPresencial = '';
    this.revisarConflictoHorario();
  }

  // ==========================================
  // ASISTENCIA
  // ==========================================

  busquedaEstudianteAsistencia: string = '';
  filtroEstadoAsistencia: 'todos' | 'presentes' | 'ausentes' = 'todos';

  abrirAsistencia(claseId: number) {
    this.claseAsistenciaId = claseId;
    this.busquedaEstudianteAsistencia = '';
    this.filtroEstadoAsistencia = 'todos';
  }

  cerrarAsistencia() {
    this.claseAsistenciaId = null;
  }

  getEstudiantesFiltradosAsistencia(clase: any): any[] {
    if (!clase || !clase.estudiantes) return [];
    let list = clase.estudiantes;
    if (this.filtroEstadoAsistencia === 'presentes') {
      list = list.filter((e: any) => e.presente);
    } else if (this.filtroEstadoAsistencia === 'ausentes') {
      list = list.filter((e: any) => !e.presente);
    }
    if (this.busquedaEstudianteAsistencia.trim()) {
      const q = this.busquedaEstudianteAsistencia.toLowerCase().trim();
      list = list.filter((e: any) => e.nombre?.toLowerCase().includes(q) || e.correo?.toLowerCase().includes(q));
    }
    return list;
  }

  marcarTodosAsistencia(claseId: number, presente: boolean) {
    const clase = this.clasesCreadas.find(c => c.id === claseId);
    if (!clase || !clase.estudiantes) return;
    clase.estudiantes.forEach(e => {
      e.presente = presente;
      this.claseService.registrarAsistencia(claseId, {
        claseSesionId: claseId,
        estudianteId: e.id,
        presente: presente
      }).subscribe();
    });
    this.guardarEnStorage();
  }

  invertirAsistencia(claseId: number) {
    const clase = this.clasesCreadas.find(c => c.id === claseId);
    if (!clase || !clase.estudiantes) return;
    clase.estudiantes.forEach(e => {
      e.presente = !e.presente;
      this.claseService.registrarAsistencia(claseId, {
        claseSesionId: claseId,
        estudianteId: e.id,
        presente: e.presente
      }).subscribe();
    });
    this.guardarEnStorage();
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

  /**
   * Elimina un estudiante de la clase conectándolo a DELETE /api/Clase/{claseId}/estudiantes/{estudianteId}
   */
  eliminarEstudiante(claseId: number, estudianteId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!confirm('¿Estás seguro de que deseas eliminar este estudiante de la clase?')) {
      return;
    }

    const clase = this.clasesCreadas.find(c => c.id === claseId);
    if (clase && clase.estudiantes) {
      clase.estudiantes = clase.estudiantes.filter(e => e.id !== estudianteId);
      this.guardarEnStorage();
    }

    this.claseService.eliminarEstudiante(claseId, estudianteId).subscribe({
      next: () => {
        this.successMessage = 'Estudiante eliminado de la clase exitosamente.';
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: () => {
        this.successMessage = 'Estudiante eliminado de la clase.';
        setTimeout(() => this.successMessage = '', 4000);
      }
    });
  }

  abrirAgregarEstudianteAClase() {
    this.mostrarModalAgregarEstudiante = true;
  }

  cerrarAgregarEstudianteAClase() {
    this.mostrarModalAgregarEstudiante = false;
    this.nuevoEstudianteClase = {
      nombre: '',
      correo: '',
      cedula: '',
      matricula: ''
    };
  }

  guardarEstudianteEnClase(claseId: number) {
    if (!this.nuevoEstudianteClase.nombre.trim() || !this.nuevoEstudianteClase.correo.trim()) {
      alert('Por favor ingresa el nombre y correo institucional del estudiante.');
      return;
    }

    const nombre = this.nuevoEstudianteClase.nombre.trim();
    const correo = this.nuevoEstudianteClase.correo.trim();
    const username = correo.includes('@') ? correo.split('@')[0] : nombre.toLowerCase().replace(/\s+/g, '.');
    const tempPassword = `Uteq${new Date().getFullYear()}*`;

    const nuevoId = Date.now();
    const clase = this.clasesCreadas.find(c => c.id === claseId);
    if (clase) {
      if (!clase.estudiantes) clase.estudiantes = [];
      clase.estudiantes.push({
        id: nuevoId,
        nombre,
        correo,
        presente: true,
        username
      });
      this.guardarEnStorage();
    }

    // Agregar al Directorio General Institucional
    this.directorioService.agregarEstudiante({
      nombre,
      correo,
      username,
      cedula: this.nuevoEstudianteClase.cedula || `17${Math.floor(10000000 + Math.random() * 90000000)}`,
      matricula: this.nuevoEstudianteClase.matricula || `2024-EST-${Math.floor(100 + Math.random() * 900)}`,
      estado: 'Regular'
    });

    // Emitir la recarga de datos en el servicio del Directorio (cargarDirectorio())
    this.directorioService.cargarDirectorio().subscribe();

    // Notificación de Credenciales en Pantalla
    const notifMsg = `Estudiante registrado. Usuario: ${username} | Clave Temporal: ${tempPassword}`;
    this.credencialesNotificacion = {
      mostrar: true,
      mensaje: notifMsg,
      username,
      tempPassword
    };
    this.successMessage = notifMsg;

    this.cerrarAgregarEstudianteAClase();
  }

  copiarCredenciales() {
    const texto = `Estudiante registrado. Usuario: ${this.credencialesNotificacion.username} | Clave Temporal: ${this.credencialesNotificacion.tempPassword}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(texto);
      this.copiadoCredenciales = true;
      setTimeout(() => this.copiadoCredenciales = false, 3000);
    }
  }

  cerrarCredencialesNotificacion() {
    this.credencialesNotificacion.mostrar = false;
  }

  // ==========================================
  // RECURSOS Y ACTIVIDADES (OPCIONES DEL AYUDANTE)
  // ==========================================

  actualizarRecursosYActividades() {
    this.recursosMateria = this.materiaService.getRecursosSnapshot(this.materiaSeleccionadaId);
    this.actividadesMateria = this.materiaService.getActividadesSnapshot(this.materiaSeleccionadaId);
  }

  onArchivoRecursoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.archivoRecurso = {
        nombre: file.name,
        tamanoKb: Math.round(file.size / 1024),
        dataUrl: reader.result as string
      };
      if (!this.nuevoRecurso.titulo.trim()) {
        this.nuevoRecurso.titulo = file.name.replace(/\.[^/.]+$/, '');
      }
    };
    reader.readAsDataURL(file);
  }

  quitarArchivoRecurso(): void {
    this.archivoRecurso = null;
  }

  onArchivoActividadChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.archivoActividad = {
        nombre: file.name,
        tamanoKb: Math.round(file.size / 1024),
        dataUrl: reader.result as string
      };
      if (!this.nuevaActividad.titulo.trim()) {
        this.nuevaActividad.titulo = file.name.replace(/\.[^/.]+$/, '');
      }
    };
    reader.readAsDataURL(file);
  }

  quitarArchivoActividad(): void {
    this.archivoActividad = null;
  }

  descargarRecursoDocumento(rec: RecursoDto): void {
    if (rec.archivoDataUrl) {
      this.descargaService.descargarArchivo(rec.nombreArchivo || `${rec.titulo}.pdf`, rec.archivoDataUrl);
      return;
    }
    // Generar documento oficial descargable con los datos del recurso
    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${rec.titulo} - UTEQ</title>
<style>body{font-family:sans-serif;padding:30px;line-height:1.6;color:#1e293b;}</style>
</head>
<body>
  <div style="border-bottom:2px solid #047857;padding-bottom:10px;margin-bottom:20px;">
    <h2 style="color:#065f46;margin:0;">Universidad Técnica Estatal de Quevedo (UTEQ)</h2>
    <h4 style="color:#475569;margin:4px 0 0 0;">Material Académico de Cátedra · SIGAC</h4>
  </div>
  <h3 style="color:#0f172a;">${rec.titulo}</h3>
  <p><strong>Tipo:</strong> ${rec.tipo} | <strong>Fecha:</strong> ${rec.fechaCreacion || '2026'} | <strong>Publicado por:</strong> ${rec.creadoPor || 'Docente'}</p>
  <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:15px;border-radius:8px;margin:15px 0;">
    <p>${rec.descripcion || 'Sin descripción detallada.'}</p>
    <p><strong>Enlace oficial:</strong> <a href="${rec.url}">${rec.url}</a></p>
  </div>
  <p style="font-size:11px;color:#64748b;">Descargado desde el repositorio institucional SIGAC - UTEQ.</p>
</body>
</html>`;
    this.descargaService.descargarArchivo(`${rec.titulo.replace(/\s+/g, '_')}_UTEQ.html`, html);
  }

  descargarActividadDocumento(act: ActividadDto): void {
    if (act.archivoDataUrl) {
      this.descargaService.descargarArchivo(act.nombreArchivo || `${act.titulo}.pdf`, act.archivoDataUrl);
      return;
    }
    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${act.titulo} - UTEQ</title>
<style>body{font-family:sans-serif;padding:30px;line-height:1.6;color:#1e293b;}</style>
</head>
<body>
  <div style="border-bottom:2px solid #047857;padding-bottom:10px;margin-bottom:20px;">
    <h2 style="color:#065f46;margin:0;">Universidad Técnica Estatal de Quevedo (UTEQ)</h2>
    <h4 style="color:#475569;margin:4px 0 0 0;">Guía de Actividad Pedagógica y Taller · SIGAC</h4>
  </div>
  <h3 style="color:#0f172a;">${act.titulo}</h3>
  <p><strong>Tipo:</strong> ${act.tipo} | <strong>Fecha Límite de Entrega:</strong> ${act.fechaEntrega}</p>
  <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:15px;border-radius:8px;margin:15px 0;">
    <h4>Instrucciones y Rúbrica:</h4>
    <p>${act.descripcion || 'Realizar la actividad y subir el entregable conforme a las directrices de la cátedra.'}</p>
  </div>
  <p style="font-size:11px;color:#64748b;">Documento de evaluación formativa emitido por la Carrera de Ingeniería de Software - UTEQ.</p>
</body>
</html>`;
    this.descargaService.descargarArchivo(`${act.titulo.replace(/\s+/g, '_')}_Guia_UTEQ.html`, html);
  }

  crearRecursoPedagogico() {
    if (!this.nuevoRecurso.titulo.trim()) {
      alert('Ingresa el título del recurso pedagógico.');
      return;
    }

    this.isLoading = true;
    this.materiaService.addRecurso(this.materiaSeleccionadaId, {
      titulo: this.nuevoRecurso.titulo.trim(),
      materiaId: this.materiaSeleccionadaId,
      url: this.nuevoRecurso.url.trim() || 'https://repositorio.uteq.edu.ec/material.pdf',
      tipo: this.nuevoRecurso.tipo,
      esEsencial: this.nuevoRecurso.esEsencial,
      descripcion: this.nuevoRecurso.descripcion.trim(),
      temaNombre: this.nuevoRecurso.temaNombre,
      nombreArchivo: this.archivoRecurso?.nombre,
      archivoDataUrl: this.archivoRecurso?.dataUrl,
      tamanoArchivoKb: this.archivoRecurso?.tamanoKb
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.actualizarRecursosYActividades();
        this.successMessage = '¡Recurso pedagógico publicado exitosamente con su archivo adjunto para los alumnos y el ayudante!';
        setTimeout(() => this.successMessage = '', 4000);
        this.nuevoRecurso.titulo = '';
        this.nuevoRecurso.descripcion = '';
        this.archivoRecurso = null;
      },
      error: () => {
        this.isLoading = false;
        this.actualizarRecursosYActividades();
      }
    });
  }

  crearActividadPedagogica() {
    if (!this.nuevaActividad.titulo.trim()) {
      alert('Ingresa el título de la actividad o taller.');
      return;
    }

    this.isLoading = true;
    this.materiaService.addActividad(this.materiaSeleccionadaId, {
      titulo: this.nuevaActividad.titulo.trim(),
      descripcion: this.nuevaActividad.descripcion.trim() || 'Actividad asignada por el docente titular.',
      fechaEntrega: this.nuevaActividad.fechaEntrega || '2026-09-30',
      tipo: this.nuevaActividad.tipo,
      materiaId: this.materiaSeleccionadaId,
      nombreArchivo: this.archivoActividad?.nombre,
      archivoDataUrl: this.archivoActividad?.dataUrl,
      tamanoArchivoKb: this.archivoActividad?.tamanoKb
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.actualizarRecursosYActividades();
        this.successMessage = '¡Actividad creada exitosamente con sus documentos adjuntos! Los alumnos ya pueden consultar la guía.';
        setTimeout(() => this.successMessage = '', 4000);
        this.nuevaActividad.titulo = '';
        this.nuevaActividad.descripcion = '';
        this.archivoActividad = null;
      },
      error: () => {
        this.isLoading = false;
        this.actualizarRecursosYActividades();
      }
    });
  }

  toggleRecursoEsencial(recursoId: number) {
    this.materiaService.toggleRecursoEsencial(recursoId);
    this.actualizarRecursosYActividades();
  }

  eliminarRecurso(recursoId: number) {
    if (confirm('¿Deseas eliminar este recurso?')) {
      this.materiaService.deleteRecurso(recursoId);
      this.actualizarRecursosYActividades();
    }
  }
}
