import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MateriaDto, MateriaService, EstudianteMateria } from '../../../services/materia.service';

export interface ComunicadoAula {
  id: number;
  fecha: string;
  asunto: string;
  mensaje: string;
  destinatarios: string;
  prioridad: 'normal' | 'urgente';
}

@Component({
  selector: 'app-gestion-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gestion-estudiantes.html'
})
export class GestionEstudiantesComponent implements OnInit, OnDestroy {
  rol = localStorage.getItem('rol') || 'Docente';
  docenteIdLogueado = 1;

  materias: MateriaDto[] = [];
  materiaSeleccionadaId: number = 0;
  materiaSeleccionada: MateriaDto | null = null;
  estudiantes: EstudianteMateria[] = [];

  private sub?: Subscription;

  // Pestaña principal activa
  tabActiva: 'nomina' | 'matriculacion' | 'comunicados' = 'nomina';

  // Filtros y búsqueda
  busqueda: string = '';
  filtroEstado: 'todos' | 'Destacado' | 'Regular' | 'En Riesgo' = 'todos';
  orden: 'nombre-asc' | 'nombre-desc' | 'nota-desc' | 'nota-asc' | 'asistencia-desc' | 'asistencia-asc' = 'nombre-asc';
  vistaModo: 'tabla' | 'tarjetas' = 'tabla';

  // Modales
  modalDetalleEstudiante: boolean = false;
  estudianteDetalle: EstudianteMateria | null = null;
  nuevaObservacionTexto: string = '';

  modalAlertaEstudiante: boolean = false;
  estudianteAlerta: EstudianteMateria | null = null;
  mensajeAlerta: string = '';

  // Matriculación
  subTabMatricula: 'individual' | 'masiva' | 'directorio' = 'individual';
  nuevoEstudiante: Partial<EstudianteMateria> = {
    nombre: '',
    correo: '',
    cedula: '',
    matricula: '',
    carrera: 'Ingeniería de Software',
    telefono: '',
    nota: 4.5,
    asistencia: 100,
    estado: 'Regular'
  };

  // Carga masiva por texto
  textoCargaMasiva: string = '';
  estudiantesParseados: Partial<EstudianteMateria>[] = [];

  // Directorio General Institucional
  directorioGeneral: EstudianteMateria[] = [
    { id: 101, nombre: 'Julián Cárdenas', correo: 'j.cardenas@uni.edu', cedula: '1729384101', matricula: '2024-IS-101', carrera: 'Ingeniería de Software', nota: 4.4, asistencia: 92, estado: 'Regular' },
    { id: 102, nombre: 'Camila Villacís', correo: 'c.villacis@uni.edu', cedula: '1729384102', matricula: '2024-IS-102', carrera: 'Ingeniería de Software', nota: 4.7, asistencia: 96, estado: 'Destacado' },
    { id: 103, nombre: 'Felipe Zambrano', correo: 'f.zambrano@uni.edu', cedula: '1729384103', matricula: '2024-IS-103', carrera: 'Ingeniería de Software', nota: 3.8, asistencia: 78, estado: 'En Riesgo' },
    { id: 104, nombre: 'Daniela Montes', correo: 'd.montes@uni.edu', cedula: '1729384104', matricula: '2024-IS-104', carrera: 'Ingeniería de Software', nota: 4.6, asistencia: 90, estado: 'Regular' },
    { id: 105, nombre: 'Martín Barahona', correo: 'm.barahona@uni.edu', cedula: '1729384105', matricula: '2024-IS-105', carrera: 'Ingeniería de Software', nota: 4.1, asistencia: 85, estado: 'Regular' }
  ];

  // Herramienta: Comunicados de Aula
  comunicadoDestinatarios: 'todos' | 'en-riesgo' | 'destacados' = 'todos';
  comunicadoAsunto: string = '';
  comunicadoMensaje: string = '';
  comunicadoPrioridad: 'normal' | 'urgente' = 'normal';
  historialComunicados: ComunicadoAula[] = [
    {
      id: 1,
      fecha: '28 Ago 2026',
      asunto: 'Publicación de Rúbrica para Taller #4',
      mensaje: 'Estimados estudiantes, se ha publicado en recursos el archivo guía con los criterios de evaluación.',
      destinatarios: 'Todo el Curso (24 alumnos)',
      prioridad: 'normal'
    },
    {
      id: 2,
      fecha: '02 Sep 2026',
      asunto: 'Convocatoria a Tutoría Extraordinaria',
      mensaje: 'Se convoca a los estudiantes con pendientes en integrales múltiples a sesión de refuerzo el jueves 16h00.',
      destinatarios: 'Alumnos en Seguimiento Académico (3 alumnos)',
      prioridad: 'urgente'
    }
  ];

  // Notificaciones visuales
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

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
      if (list.length > 0) {
        if (!this.materiaSeleccionadaId) {
          this.seleccionarMateria(list[0].id);
        } else {
          this.seleccionarMateria(this.materiaSeleccionadaId);
        }
      }
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        const idParam = +params['id'];
        if (idParam) {
          this.seleccionarMateria(idParam);
        }
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  seleccionarMateria(materiaId: number) {
    this.materiaSeleccionadaId = Number(materiaId);
    const mat = this.materias.find(m => Number(m.id) === this.materiaSeleccionadaId);
    if (mat) {
      this.materiaSeleccionada = mat;
      this.estudiantes = mat.estudiantes ? [...mat.estudiantes] : [];
    } else {
      this.materiaSeleccionada = null;
      this.estudiantes = [];
    }
  }

  // ==================== MÉTRICAS DEL AULA ====================
  get totalEstudiantes(): number {
    return this.estudiantes.length;
  }

  get promedioGeneral(): number {
    if (this.estudiantes.length === 0) return 0;
    const suma = this.estudiantes.reduce((acc, e) => acc + (e.nota ?? 0), 0);
    return Math.round((suma / this.estudiantes.length) * 10) / 10;
  }

  get asistenciaPromedio(): number {
    if (this.estudiantes.length === 0) return 0;
    const suma = this.estudiantes.reduce((acc, e) => acc + (e.asistencia ?? 0), 0);
    return Math.round(suma / this.estudiantes.length);
  }

  get enRiesgoCount(): number {
    return this.estudiantes.filter(e => e.estado === 'En Riesgo' || (e.nota !== undefined && e.nota < 4.0) || (e.asistencia !== undefined && e.asistencia < 80)).length;
  }

  get destacadosCount(): number {
    return this.estudiantes.filter(e => e.estado === 'Destacado' || (e.nota !== undefined && e.nota >= 4.7)).length;
  }

  get tasaEntregasPromedio(): number {
    if (this.estudiantes.length === 0) return 0;
    const suma = this.estudiantes.reduce((acc, e) => {
      const entregadas = e.tareasEntregadas ?? 5;
      const total = e.totalTareas ?? 6;
      return acc + (total > 0 ? (entregadas / total) * 100 : 100);
    }, 0);
    return Math.round(suma / this.estudiantes.length);
  }

  // ==================== LISTADO FILTRADO Y ORDENADO ====================
  get estudiantesFiltrados(): EstudianteMateria[] {
    let list = [...this.estudiantes];

    // Filtro por texto
    if (this.busqueda.trim()) {
      const q = this.busqueda.trim().toLowerCase();
      list = list.filter(e =>
        e.nombre.toLowerCase().includes(q) ||
        (e.correo && e.correo.toLowerCase().includes(q)) ||
        (e.cedula && e.cedula.includes(q)) ||
        (e.matricula && e.matricula.toLowerCase().includes(q)) ||
        (e.carrera && e.carrera.toLowerCase().includes(q))
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      if (this.filtroEstado === 'En Riesgo') {
        list = list.filter(e => e.estado === 'En Riesgo' || (e.nota !== undefined && e.nota < 4.0) || (e.asistencia !== undefined && e.asistencia < 80));
      } else if (this.filtroEstado === 'Destacado') {
        list = list.filter(e => e.estado === 'Destacado' || (e.nota !== undefined && e.nota >= 4.7));
      } else {
        list = list.filter(e => e.estado === 'Regular');
      }
    }

    // Ordenamiento
    list.sort((a, b) => {
      switch (this.orden) {
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre);
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre);
        case 'nota-desc':
          return (b.nota ?? 0) - (a.nota ?? 0);
        case 'nota-asc':
          return (a.nota ?? 0) - (b.nota ?? 0);
        case 'asistencia-desc':
          return (b.asistencia ?? 0) - (a.asistencia ?? 0);
        case 'asistencia-asc':
          return (a.asistencia ?? 0) - (b.asistencia ?? 0);
        default:
          return 0;
      }
    });

    return list;
  }

  // ==================== EXPEDIENTE / FICHA DEL ESTUDIANTE ====================
  abrirFichaEstudiante(estudiante: EstudianteMateria) {
    this.estudianteDetalle = { ...estudiante };
    this.nuevaObservacionTexto = '';
    this.modalDetalleEstudiante = true;
  }

  cerrarFichaEstudiante() {
    this.modalDetalleEstudiante = false;
    this.estudianteDetalle = null;
  }

  agregarObservacion() {
    if (!this.nuevaObservacionTexto.trim() || !this.estudianteDetalle || !this.materiaSeleccionadaId) return;

    this.materiaService.agregarObservacionEstudiante(
      this.materiaSeleccionadaId,
      this.estudianteDetalle.id,
      this.nuevaObservacionTexto
    );

    const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    if (!this.estudianteDetalle.observaciones) {
      this.estudianteDetalle.observaciones = [];
    }
    this.estudianteDetalle.observaciones.unshift(`[${fecha}] ${this.nuevaObservacionTexto.trim()}`);
    this.nuevaObservacionTexto = '';

    this.mostrarExito('Observación pedagógica registrada con éxito en el expediente del alumno.');
  }

  // ==================== ALERTA PEDAGÓGICA INDIVIDUAL ====================
  abrirAlertaEstudiante(estudiante: EstudianteMateria, event?: Event) {
    event?.stopPropagation();
    this.estudianteAlerta = estudiante;
    this.mensajeAlerta = `Estimado(a) ${estudiante.nombre}, te contactamos desde la cátedra ${this.materiaSeleccionada?.nombre} para coordinar un plan de tutoría y recuperación académica preventiva.`;
    this.modalAlertaEstudiante = true;
  }

  cerrarAlertaEstudiante() {
    this.modalAlertaEstudiante = false;
    this.estudianteAlerta = null;
    this.mensajeAlerta = '';
  }

  enviarAlertaPedagogica() {
    if (!this.estudianteAlerta) return;
    this.mostrarExito(`Alerta pedagógica enviada a ${this.estudianteAlerta.nombre} y notificada al ayudante de cátedra.`);
    this.cerrarAlertaEstudiante();
  }

  // ==================== MATRICULACIÓN DE ESTUDIANTES ====================
  registrarEstudianteIndividual() {
    if (!this.nuevoEstudiante.nombre?.trim() || !this.nuevoEstudiante.correo?.trim()) {
      this.errorMessage = 'Por favor ingresa nombre y correo institucional.';
      return;
    }
    if (!this.materiaSeleccionadaId) {
      this.errorMessage = 'Selecciona una materia primero.';
      return;
    }

    this.materiaService.agregarEstudianteDirecto(this.materiaSeleccionadaId, this.nuevoEstudiante);
    this.mostrarExito(`¡Estudiante ${this.nuevoEstudiante.nombre} matriculado exitosamente en la cátedra!`);

    // Resetear formulario
    this.nuevoEstudiante = {
      nombre: '',
      correo: '',
      cedula: '',
      matricula: '',
      carrera: this.materiaSeleccionada?.claseNombre?.includes('Física') ? 'Ciencias Físicas' : 'Ingeniería de Software',
      telefono: '',
      nota: 4.5,
      asistencia: 100,
      estado: 'Regular'
    };
    this.tabActiva = 'nomina';
  }

  procesarTextoMasivo() {
    if (!this.textoCargaMasiva.trim()) {
      this.estudiantesParseados = [];
      return;
    }

    const lineas = this.textoCargaMasiva.split('\n');
    const parseados: Partial<EstudianteMateria>[] = [];

    lineas.forEach((linea, idx) => {
      const limpia = linea.trim();
      if (!limpia) return;

      // Soporta formatos separados por coma, tabulador o punto y coma
      const partes = limpia.split(/[,;\t]/).map(p => p.trim());
      if (partes.length >= 2) {
        parseados.push({
          id: Date.now() + idx,
          nombre: partes[0],
          correo: partes[1],
          cedula: partes[2] || `17${Math.floor(10000000 + Math.random() * 90000000)}`,
          matricula: partes[3] || `2024-MAS-${100 + idx}`,
          carrera: this.materiaSeleccionada?.claseNombre || 'Ingeniería',
          nota: 4.5,
          asistencia: 100,
          estado: 'Regular'
        });
      } else if (limpia.includes('@')) {
        // Solo un correo pegado
        const nombreSugerido = limpia.split('@')[0].replace('.', ' ');
        parseados.push({
          id: Date.now() + idx,
          nombre: nombreSugerido.charAt(0).toUpperCase() + nombreSugerido.slice(1),
          correo: limpia,
          cedula: `17${Math.floor(10000000 + Math.random() * 90000000)}`,
          matricula: `2024-MAS-${100 + idx}`,
          carrera: this.materiaSeleccionada?.claseNombre || 'Ingeniería',
          nota: 4.5,
          asistencia: 100,
          estado: 'Regular'
        });
      }
    });

    this.estudiantesParseados = parseados;
  }

  confirmarCargaMasiva() {
    if (!this.materiaSeleccionadaId || this.estudiantesParseados.length === 0) return;

    this.estudiantesParseados.forEach(est => {
      this.materiaService.agregarEstudianteDirecto(this.materiaSeleccionadaId, est);
    });

    this.mostrarExito(`¡Se han incorporado ${this.estudiantesParseados.length} estudiantes al aula exitosamente!`);
    this.textoCargaMasiva = '';
    this.estudiantesParseados = [];
    this.tabActiva = 'nomina';
  }

  matricularDelDirectorio(estudianteDir: EstudianteMateria) {
    if (!this.materiaSeleccionadaId) return;

    const yaExiste = this.estudiantes.some(e => e.id === estudianteDir.id || e.correo === estudianteDir.correo);
    if (yaExiste) {
      this.errorMessage = `${estudianteDir.nombre} ya se encuentra matriculado en esta cátedra.`;
      return;
    }

    this.materiaService.agregarEstudianteDirecto(this.materiaSeleccionadaId, estudianteDir);
    this.mostrarExito(`Estudiante ${estudianteDir.nombre} añadido al aula.`);
  }

  // ==================== COMUNICADOS DE AULA ====================
  enviarComunicado() {
    if (!this.comunicadoAsunto.trim() || !this.comunicadoMensaje.trim()) {
      this.errorMessage = 'Por favor escribe el asunto y el mensaje del comunicado.';
      return;
    }

    let destinatarioLabel = 'Todo el Curso';
    if (this.comunicadoDestinatarios === 'en-riesgo') {
      destinatarioLabel = `Estudiantes en Riesgo (${this.enRiesgoCount} alumnos)`;
    } else if (this.comunicadoDestinatarios === 'destacados') {
      destinatarioLabel = `Estudiantes Destacados (${this.destacadosCount} alumnos)`;
    } else {
      destinatarioLabel = `Todo el Curso (${this.estudiantes.length} alumnos)`;
    }

    const nuevoComunicado: ComunicadoAula = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      asunto: this.comunicadoAsunto.trim(),
      mensaje: this.comunicadoMensaje.trim(),
      destinatarios: destinatarioLabel,
      prioridad: this.comunicadoPrioridad
    };

    this.historialComunicados.unshift(nuevoComunicado);
    this.comunicadoAsunto = '';
    this.comunicadoMensaje = '';
    this.mostrarExito(`¡Comunicado enviado a ${destinatarioLabel} y notificado por correo!`);
  }

  // ==================== EXPORTACIÓN Y REPORTES ====================
  exportarCSV() {
    if (this.estudiantes.length === 0) {
      this.errorMessage = 'No hay estudiantes para exportar.';
      return;
    }

    const headers = ['ID', 'Nombre', 'Correo', 'Cedula', 'Matricula', 'Carrera', 'Nota_Promedio', 'Asistencia_Pct', 'Estado', 'Tareas_Entregadas'];
    const rows = this.estudiantes.map(e => [
      e.id,
      `"${e.nombre}"`,
      `"${e.correo || ''}"`,
      `"${e.cedula || ''}"`,
      `"${e.matricula || ''}"`,
      `"${e.carrera || ''}"`,
      e.nota ?? 0,
      `${e.asistencia ?? 0}%`,
      `"${e.estado || 'Regular'}"`,
      `"${e.tareasEntregadas || 0}/${e.totalTareas || 6}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const codMateria = this.materiaSeleccionada?.codigo || 'MATERIA';
    link.setAttribute('download', `Nomina_Estudiantes_${codMateria}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.mostrarExito('Archivo CSV de nómina y calificaciones generado exitosamente.');
  }

  imprimirActa() {
    window.print();
  }

  // Helpers
  private mostrarExito(msg: string) {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => {
      if (this.successMessage === msg) {
        this.successMessage = '';
      }
    }, 4500);
  }

  getIniciales(nombre: string): string {
    if (!nombre) return 'ES';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
}
