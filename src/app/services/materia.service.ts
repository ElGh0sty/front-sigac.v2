import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { getApiBase } from '../api';

export interface EstudianteMateria {
  id: number;
  nombre: string;
  correo?: string;
  nota?: number;
  asistencia?: number;
  matricula?: string;
  cedula?: string;
  carrera?: string;
  estado?: 'Regular' | 'En Riesgo' | 'Destacado' | 'Retirado' | 'Justificado';
  telefono?: string;
  observaciones?: string[];
  tareasEntregadas?: number;
  totalTareas?: number;
}

export interface MateriaDto {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  docente?: string;
  docenteResponsableId?: number;
  creditos?: number;
  semana?: number;
  totalSemanas?: number;
  claseId?: number;
  claseNombre?: string;
  semestre?: string;
  grupo?: string;
  ayudantes?: string[];
  estudiantes?: EstudianteMateria[];
  actividades?: any[];
}

export interface CreateMateriaDto {
  nombre: string;
  codigo: string;
  descripcion?: string;
  docenteResponsableId?: number;
  creditos?: number;
  claseId?: number;
  claseNombre?: string;
  semestre?: string;
  grupo?: string;
}

export interface TemaMateriaDto {
  id: number;
  materiaId: number;
  nombre: string;
}

export interface RecursoDto {
  id: number;
  materiaId: number;
  temaId?: number;
  temaNombre?: string;
  titulo: string;
  descripcion?: string;
  url: string;
  tipo: string; // 'PDF' | 'Video' | 'Enlace' | 'Simulador' | 'Documento'
  esEsencial: boolean;
  visto: boolean;
  creadoPor?: string;
  fechaCreacion?: string;
  nombreArchivo?: string;
  archivoDataUrl?: string;
  tamanoArchivoKb?: number;
}

export interface CreateRecursoDto {
  titulo: string;
  descripcion?: string;
  url: string;
  esEsencial: boolean;
  materiaId: number;
  temaId?: number;
  temaNombre?: string;
  tipo?: string;
  nombreArchivo?: string;
  archivoDataUrl?: string;
  tamanoArchivoKb?: number;
}

export interface RecursoConEstadoDto extends RecursoDto {}

export interface MarkRecursoAsSeenDto {
  recursoId: number;
}

export interface ActividadDto {
  id: number;
  materiaId: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  tipo: string; // 'Taller' | 'Tarea' | 'Quiz' | 'Proyecto' | 'Examen'
  estado: string; // 'pendiente' | 'entregada' | 'calificada'
  nota?: number;
  entregadoEl?: string;
  nombreArchivo?: string;
  archivoDataUrl?: string;
  tamanoArchivoKb?: number;
}

export interface CreateActividadDto {
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  tipo: string;
  materiaId: number;
  nombreArchivo?: string;
  archivoDataUrl?: string;
  tamanoArchivoKb?: number;
}

export interface AsistenteRegistro {
  id?: number;
  nombre: string;
  email: string;
  presente: boolean;
}

export interface RegistroAsistenciaDto {
  id: number;
  materiaId: number;
  fecha: string;
  tema: string;
  asistentes: AsistenteRegistro[];
}

const ESTUDIANTES_CALCULO_24: EstudianteMateria[] = [
  { id: 1, nombre: 'Alejandro García', correo: 'a.garcia@uni.edu', cedula: '1729384011', matricula: '2024-IS-001', carrera: 'Ingeniería de Software', nota: 4.8, asistencia: 94, estado: 'Destacado', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Excelente participación en foros y talleres prácticos.', 'Propuesta destacada en el taller de derivadas parciales.'] },
  { id: 2, nombre: 'María López', correo: 'm.lopez@uni.edu', cedula: '1729384012', matricula: '2024-IS-002', carrera: 'Ingeniería de Software', nota: 4.5, asistencia: 88, estado: 'Regular', tareasEntregadas: 5, totalTareas: 6, observaciones: ['Buen desempeño analítico.', 'Entregó taller #3 con un día de retraso justificado.'] },
  { id: 3, nombre: 'Carlos Ruiz', correo: 'c.ruiz@uni.edu', cedula: '1729384013', matricula: '2024-IS-003', carrera: 'Ingeniería de Software', nota: 4.9, asistencia: 96, estado: 'Destacado', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Líder de grupo en proyectos de aula.', 'Postulado con éxito a ayudantía de docencia.'] },
  { id: 4, nombre: 'Valentina Soto', correo: 'v.soto@uni.edu', cedula: '1729384014', matricula: '2024-IS-004', carrera: 'Ingeniería de Software', nota: 4.6, asistencia: 92, estado: 'Regular', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Participa constantemente en discusiones de cálculo vectorial.'] },
  { id: 5, nombre: 'Mateo Fernández', correo: 'm.fernandez@uni.edu', cedula: '1729384015', matricula: '2024-IS-005', carrera: 'Ingeniería de Software', nota: 4.2, asistencia: 85, estado: 'Regular', tareasEntregadas: 5, totalTareas: 6, observaciones: ['Rendimiento constante en pruebas cortas.'] },
  { id: 6, nombre: 'Sofía Castro', correo: 's.castro@uni.edu', cedula: '1729384016', matricula: '2024-IS-006', carrera: 'Ingeniería de Software', nota: 4.7, asistencia: 90, estado: 'Destacado', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Excelente entrega de laboratorios en GeoGebra.'] },
  { id: 7, nombre: 'Lucas Morales', correo: 'l.morales@uni.edu', cedula: '1729384017', matricula: '2024-IS-007', carrera: 'Ingeniería de Software', nota: 3.6, asistencia: 72, estado: 'En Riesgo', tareasEntregadas: 3, totalTareas: 6, observaciones: ['Alerta Temprana: Registro de 3 inasistencias no justificadas.', 'Se citó a tutoría académica con el ayudante.'] },
  { id: 8, nombre: 'Isabella Ortiz', correo: 'i.ortiz@uni.edu', cedula: '1729384018', matricula: '2024-IS-008', carrera: 'Ingeniería de Software', nota: 5.0, asistencia: 100, estado: 'Destacado', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Nota perfecta y 100% de asistencia.', 'Puntaje máximo en examen parcial.'] },
  { id: 9, nombre: 'Gabriel Ramos', correo: 'g.ramos@uni.edu', cedula: '1729384019', matricula: '2024-IS-009', carrera: 'Ingeniería de Software', nota: 4.1, asistencia: 84, estado: 'Regular', tareasEntregadas: 5, totalTareas: 6, observaciones: ['Mejoró notablemente en el módulo de integrales triples.'] },
  { id: 10, nombre: 'Camila Vargas', correo: 'c.vargas@uni.edu', cedula: '1729384020', matricula: '2024-IS-010', carrera: 'Ingeniería de Software', nota: 4.4, asistencia: 89, estado: 'Regular', tareasEntregadas: 5, totalTareas: 6, observaciones: ['Colabora activamente en mesas redondas de resolución de dudas.'] },
  { id: 11, nombre: 'Daniel Silva', correo: 'd.silva@uni.edu', cedula: '1729384021', matricula: '2024-IS-011', carrera: 'Ingeniería de Software', nota: 4.3, asistencia: 86, estado: 'Regular', tareasEntregadas: 5, totalTareas: 6, observaciones: ['Buen manejo de algoritmos de aproximación numérica.'] },
  { id: 12, nombre: 'Valeria Herrera', correo: 'v.herrera@uni.edu', cedula: '1729384022', matricula: '2024-IS-012', carrera: 'Ingeniería de Software', nota: 4.8, asistencia: 95, estado: 'Destacado', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Dominio notable de teoremas de Green y Stokes.'] },
  { id: 13, nombre: 'Sebastián Mendoza', correo: 's.mendoza@uni.edu', cedula: '1729384023', matricula: '2024-IS-013', carrera: 'Ingeniería de Software', nota: 4.0, asistencia: 82, estado: 'Regular', tareasEntregadas: 4, totalTareas: 6, observaciones: ['Debe reforzar temas de convergencia de series.'] },
  { id: 14, nombre: 'Lucía Guerrero', correo: 'l.guerrero@uni.edu', cedula: '1729384024', matricula: '2024-IS-014', carrera: 'Ingeniería de Software', nota: 4.6, asistencia: 91, estado: 'Regular', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Puntual y con alto compromiso en entrega de tareas.'] },
  { id: 15, nombre: 'Diego Navarro', correo: 'd.navarro@uni.edu', cedula: '1729384025', matricula: '2024-IS-015', carrera: 'Ingeniería de Software', nota: 3.4, asistencia: 68, estado: 'En Riesgo', tareasEntregadas: 2, totalTareas: 6, observaciones: ['Alerta Académica: Asistencia por debajo del 70%. Riesgo de pérdida por inasistencia.', 'Pendiente reunión de asesoría docente.'] },
  { id: 16, nombre: 'Mariana Paredes', correo: 'm.paredes@uni.edu', cedula: '1729384026', matricula: '2024-IS-016', carrera: 'Ingeniería de Software', nota: 4.7, asistencia: 93, estado: 'Destacado', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Participa con frecuencia aclarando dudas a sus compañeros.'] },
  { id: 17, nombre: 'Javier Romero', correo: 'j.romero@uni.edu', cedula: '1729384027', matricula: '2024-IS-017', carrera: 'Ingeniería de Software', nota: 4.5, asistencia: 88, estado: 'Regular', tareasEntregadas: 5, totalTareas: 6, observaciones: ['Cumple con todos los estándares del sílabo.'] },
  { id: 18, nombre: 'Andrea Medina', correo: 'a.medina@uni.edu', cedula: '1729384028', matricula: '2024-IS-018', carrera: 'Ingeniería de Software', nota: 4.9, asistencia: 97, estado: 'Destacado', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Excelente redacción técnica en informes de laboratorio.'] },
  { id: 19, nombre: 'Nicolás Benítez', correo: 'n.benitez@uni.edu', cedula: '1729384029', matricula: '2024-IS-019', carrera: 'Ingeniería de Software', nota: 4.2, asistencia: 85, estado: 'Regular', tareasEntregadas: 5, totalTareas: 6, observaciones: ['Buen desenvolvimiento en trabajo en parejas.'] },
  { id: 20, nombre: 'Paula Rivas', correo: 'p.rivas@uni.edu', cedula: '1729384030', matricula: '2024-IS-020', carrera: 'Ingeniería de Software', nota: 4.6, asistencia: 92, estado: 'Regular', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Activa en el uso de los recursos digitales de la plataforma.'] },
  { id: 21, nombre: 'Fernando Delgado', correo: 'f.delgado@uni.edu', cedula: '1729384031', matricula: '2024-IS-021', carrera: 'Ingeniería de Software', nota: 3.5, asistencia: 74, estado: 'En Riesgo', tareasEntregadas: 3, totalTareas: 6, observaciones: ['Alerta Temprana: Nota acumulada baja en talleres prácticos.', 'Se solicitó plan de recuperación académica.'] },
  { id: 22, nombre: 'Daniela Cruz', correo: 'd.cruz@uni.edu', cedula: '1729384032', matricula: '2024-IS-022', carrera: 'Ingeniería de Software', nota: 4.8, asistencia: 94, estado: 'Destacado', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Capacidad analítica sobresaliente en exámenes sorpresa.'] },
  { id: 23, nombre: 'Esteban Peña', correo: 'e.pena@uni.edu', cedula: '1729384033', matricula: '2024-IS-023', carrera: 'Ingeniería de Software', nota: 4.0, asistencia: 81, estado: 'Regular', tareasEntregadas: 4, totalTareas: 6, observaciones: ['Se reincorporó tras justificación de salud debidamente validada.'] },
  { id: 24, nombre: 'Natalia Salazar', correo: 'n.salazar@uni.edu', cedula: '1729384034', matricula: '2024-IS-024', carrera: 'Ingeniería de Software', nota: 4.7, asistencia: 90, estado: 'Destacado', tareasEntregadas: 6, totalTareas: 6, observaciones: ['Compromiso sobresaliente en la resolución de problemas en pizarra.'] }
];

const MATERIAS_DEFAULT: MateriaDto[] = [
  {
    id: 101,
    nombre: 'Cálculo Avanzado',
    codigo: 'MAT-301',
    descripcion: 'Derivadas parciales, integrales múltiples y ecuaciones diferenciales aplicadas a ingeniería.',
    docente: 'Dra. Evelyn Vance',
    docenteResponsableId: 1,
    creditos: 4,
    semana: 8,
    totalSemanas: 16,
    claseId: 1,
    claseNombre: 'Ingeniería de Software 2026-2',
    semestre: '2026-2',
    grupo: 'Grupo A (Diurno)',
    ayudantes: ['Ana López', 'Carlos Ruiz'],
    estudiantes: ESTUDIANTES_CALCULO_24
  },
  {
    id: 102,
    nombre: 'Mecánica Cuántica',
    codigo: 'FIS-401',
    descripcion: 'Principios fundamentales de la física cuántica, dualidad onda-partícula y función de onda.',
    docente: 'Dr. Marcus Thorne',
    docenteResponsableId: 2,
    creditos: 4,
    semana: 6,
    totalSemanas: 16,
    claseId: 2,
    claseNombre: 'Ciencias Físicas e Ingeniería 2026-1',
    semestre: '2026-1',
    grupo: 'Grupo Teórico',
    ayudantes: ['Sebastián Gómez'],
    estudiantes: ESTUDIANTES_CALCULO_24.slice(0, 18).map(e => ({
      ...e,
      carrera: 'Ciencias Físicas e Ingeniería',
      matricula: e.matricula?.replace('IS', 'FIS')
    }))
  },
  {
    id: 103,
    nombre: 'Redes Neuronales e IA',
    codigo: 'CMP-501',
    descripcion: 'Modelos de aprendizaje profundo, arquitecturas convolucionales y transformers.',
    docente: 'Prof. Sarah Chen',
    docenteResponsableId: 3,
    creditos: 4,
    semana: 10,
    totalSemanas: 16,
    claseId: 1,
    claseNombre: 'Ingeniería de Software 2026-2',
    semestre: '2026-2',
    grupo: 'Laboratorio Avanzado',
    ayudantes: ['Elena Torres'],
    estudiantes: ESTUDIANTES_CALCULO_24.slice(0, 20).map(e => ({
      ...e,
      carrera: 'Inteligencia Artificial y Computación',
      matricula: e.matricula?.replace('IS', 'IA')
    }))
  }
];

const RECURSOS_DEFAULT: RecursoDto[] = [
  {
    id: 1,
    materiaId: 101,
    temaNombre: 'Tema 1: Introducción al Cálculo',
    titulo: 'Guía de Estudio - Tema 1',
    descripcion: 'Guía conceptual de funciones multivariables y límites.',
    url: 'https://ejemplo.edu/recursos/guia1.pdf',
    tipo: 'PDF',
    esEsencial: true,
    visto: false,
    creadoPor: 'Dra. Evelyn Vance',
    fechaCreacion: '2026-08-10'
  },
  {
    id: 2,
    materiaId: 101,
    temaNombre: 'Tema 1: Introducción al Cálculo',
    titulo: 'Video Explicativo - Derivadas Direccionales',
    descripcion: 'Explicación geométrica de gradiente y plano tangente.',
    url: 'https://youtu.be/ejemplo-derivadas',
    tipo: 'Video',
    esEsencial: false,
    visto: false,
    creadoPor: 'Ana López (Ayudante)',
    fechaCreacion: '2026-08-12'
  },
  {
    id: 3,
    materiaId: 101,
    temaNombre: 'Tema 1: Introducción al Cálculo',
    titulo: 'Simulador 3D de Integrales Múltiples',
    descripcion: 'Herramienta interactiva para visualizar superficies en 3D.',
    url: 'https://geogebra.org/3d',
    tipo: 'Enlace',
    esEsencial: true,
    visto: false,
    creadoPor: 'Dra. Evelyn Vance',
    fechaCreacion: '2026-08-14'
  },
  {
    id: 4,
    materiaId: 101,
    temaNombre: 'Tema 2: Integrales Múltiples',
    titulo: 'Ejercicios Resueltos de Integrales Dobles',
    descripcion: 'Colección de 20 ejercicios resueltos paso a paso.',
    url: 'https://ejemplo.edu/recursos/ejercicios.pdf',
    tipo: 'PDF',
    esEsencial: false,
    visto: false,
    creadoPor: 'Carlos Ruiz (Ayudante)',
    fechaCreacion: '2026-08-18'
  },
  {
    id: 5,
    materiaId: 102,
    temaNombre: 'Tema 1: Postulados de la Cuántica',
    titulo: 'Apuntes de Mecánica Cuántica',
    descripcion: 'Ecuación de Schrödinger independiente del tiempo.',
    url: 'https://ejemplo.edu/recursos/cuantica.pdf',
    tipo: 'PDF',
    esEsencial: true,
    visto: false,
    creadoPor: 'Dr. Marcus Thorne',
    fechaCreacion: '2026-08-15'
  }
];

const ACTIVIDADES_DEFAULT: ActividadDto[] = [
  {
    id: 1,
    materiaId: 101,
    titulo: 'Taller 1: Derivadas Parciales y Gradiente',
    descripcion: 'Resolver los ejercicios 1 al 15 de la guía práctica en formato PDF.',
    fechaEntrega: '2026-09-05',
    tipo: 'Taller',
    estado: 'pendiente'
  },
  {
    id: 2,
    materiaId: 101,
    titulo: 'Quiz 1: Conceptos Fundamentales',
    descripcion: 'Evaluación rápida de 5 preguntas sobre límites y continuidad multivariable.',
    fechaEntrega: '2026-08-28',
    tipo: 'Quiz',
    estado: 'calificada',
    nota: 4.8
  },
  {
    id: 3,
    materiaId: 101,
    titulo: 'Proyecto Integrador - Fase 1',
    descripcion: 'Modelado y optimización con multiplicadores de Lagrange.',
    fechaEntrega: '2026-09-20',
    tipo: 'Proyecto',
    estado: 'pendiente'
  },
  {
    id: 4,
    materiaId: 102,
    titulo: 'Taller de Pozos de Potencial',
    descripcion: 'Cálculo de niveles de energía en pozos cuánticos infinitos.',
    fechaEntrega: '2026-09-12',
    tipo: 'Taller',
    estado: 'pendiente'
  }
];

const ASISTENCIAS_DEFAULT: RegistroAsistenciaDto[] = [
  {
    id: 1,
    materiaId: 101,
    fecha: '2026-08-25',
    tema: 'Derivadas Parciales y Regla de la Cadena',
    asistentes: ESTUDIANTES_CALCULO_24.map((e, idx) => ({
      id: e.id,
      nombre: e.nombre,
      email: e.correo || 'estudiante@uni.edu',
      presente: idx !== 2 && idx !== 6 // 22 presentes, 2 ausentes
    }))
  },
  {
    id: 2,
    materiaId: 101,
    fecha: '2026-08-18',
    tema: 'Introducción al Cálculo Multivariable',
    asistentes: ESTUDIANTES_CALCULO_24.map((e, idx) => ({
      id: e.id,
      nombre: e.nombre,
      email: e.correo || 'estudiante@uni.edu',
      presente: idx !== 1 && idx !== 14 // 22 presentes, 2 ausentes
    }))
  }
];

@Injectable({
  providedIn: 'root'
})
export class MateriaService {
  private STORAGE_MATERIAS = 'sigac_materias_v2';
  private STORAGE_RECURSOS = 'sigac_recursos_v2';
  private STORAGE_ACTIVIDADES = 'sigac_actividades_v2';
  private STORAGE_ASISTENCIAS = 'sigac_asistencias_v2';
  private STORAGE_TEMAS = 'sigac_temas_v2';

  private materiasSubject = new BehaviorSubject<MateriaDto[]>(this.loadStorage(this.STORAGE_MATERIAS, MATERIAS_DEFAULT));
  public materias$ = this.materiasSubject.asObservable();

  private recursosSubject = new BehaviorSubject<RecursoDto[]>(this.loadStorage(this.STORAGE_RECURSOS, RECURSOS_DEFAULT));
  public recursos$ = this.recursosSubject.asObservable();

  private actividadesSubject = new BehaviorSubject<ActividadDto[]>(this.loadStorage(this.STORAGE_ACTIVIDADES, ACTIVIDADES_DEFAULT));
  public actividades$ = this.actividadesSubject.asObservable();

  private asistenciasSubject = new BehaviorSubject<RegistroAsistenciaDto[]>(this.loadStorage(this.STORAGE_ASISTENCIAS, ASISTENCIAS_DEFAULT));
  public asistencias$ = this.asistenciasSubject.asObservable();

  constructor(private http: HttpClient) {}

  private get apiUrl() { return `${getApiBase()}/api/Materia`; }

  private mapToMateriaDto(item: any, idx: number): MateriaDto {
    return {
      id: Number(item.id || item.materiaId || item.catedraId || item.asignaturaId || (idx + 101)),
      nombre: item.nombre || item.nombreMateria || item.nombreCatedra || item.nombreAsignatura || item.materia || `Asignatura ${idx + 1}`,
      codigo: item.codigo || item.codigoMateria || item.codigoAsignatura || item.sigla || `MAT-${101 + idx}`,
      descripcion: item.descripcion || item.descripcionMateria || item.detalle || 'Asignatura inscrita en el periodo académico activo.',
      docente: item.docente || item.nombreDocente || item.docenteCatedra || item.profesor || 'Docente Titular',
      docenteResponsableId: item.docenteResponsableId || item.docenteId || 1,
      creditos: Number(item.creditos || item.creditosMateria || 4),
      semana: Number(item.semana || item.semanaActual || 8),
      totalSemanas: Number(item.totalSemanas || 16),
      claseId: item.claseId ? Number(item.claseId) : undefined,
      claseNombre: item.claseNombre || item.nombreClase || undefined,
      semestre: item.semestre || item.semestreCatedra || item.periodo || '2026-2',
      grupo: item.grupo || item.paralelo || 'Grupo A (Diurno)',
      ayudantes: Array.isArray(item.ayudantes) ? item.ayudantes : [],
      estudiantes: Array.isArray(item.estudiantes) ? item.estudiantes : []
    };
  }

  private loadStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (key === this.STORAGE_RECURSOS) {
            return (parsed as any[]).map(r => ({
              ...r,
              id: (Number(r.id) > 2147483647) ? (Number(r.id) % 2000000000) + 1 : Number(r.id)
            })) as unknown as T;
          }
          return parsed as unknown as T;
        }
      }
    } catch (e) {
      console.warn(`Error loading storage for ${key}`, e);
    }
    return fallback;
  }

  private saveStorage<T>(key: string, data: T) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn(`Error saving storage for ${key}`, e);
      }
    }
  }

  // ==================== MATERIAS ====================

  getMaterias(): Observable<MateriaDto[]> {
    return this.materias$;
  }

  getMateriasSnapshot(): MateriaDto[] {
    return this.materiasSubject.value;
  }

  getAsistenciasSnapshot(): RegistroAsistenciaDto[] {
    return this.asistenciasSubject.value;
  }

  getMateriaById(id: number): MateriaDto | undefined {
    const list = this.materiasSubject.value;
    return list.find(m => Number(m.id) === Number(id));
  }

  /**
   * Refresca las asignaturas inscritas del estudiante.
   * Utiliza las rutas oficiales del backend en .NET (EstudianteController):
   * 1. GET /api/Estudiante/mis-materias (cátedras del estudiante autenticado)
   * 2. Fallback: GET /api/Estudiante/{id}/validacion-malla
   * 3. Fallback seguro en memoria/localStorage (MATERIAS_DEFAULT) para evitar errores 404.
   */
  refreshMaterias(): Observable<MateriaDto[]> {
    const rol = typeof window !== 'undefined' ? (localStorage.getItem('rol') || 'Estudiante') : 'Estudiante';
    const userId = typeof window !== 'undefined' ? (Number(localStorage.getItem('userId')) || 1) : 1;

    // Si es docente o administrador, Swagger no cuenta con GET /api/materia;
    // retornar el snapshot local/almacenado para evitar errores 404 en consola.
    if (rol !== 'Estudiante' && rol !== 'Ayudante') {
      return of(this.materiasSubject.value);
    }

    const endpointMisMaterias = `${getApiBase()}/api/Estudiante/mis-materias`;

    return this.http.get<any>(endpointMisMaterias).pipe(
      tap((res) => {
        const materiasBackend = Array.isArray(res) ? res : (res?.materias || []);
        if (materiasBackend.length > 0) {
          const mapped = materiasBackend.map((item: any, idx: number) => this.mapToMateriaDto(item, idx));
          const current = this.materiasSubject.value;
          const merged = [...mapped];
          current.forEach(c => {
            if (!merged.some(m => Number(m.id) === Number(c.id) || (m.nombre.toLowerCase() === c.nombre.toLowerCase()))) {
              merged.push(c);
            }
          });
          this.materiasSubject.next(merged);
          this.saveStorage(this.STORAGE_MATERIAS, merged);
        }
      }),
      map(() => this.materiasSubject.value),
      catchError(() => {
        // En caso de que mis-materias no tenga registros previos o falle, usar las materias del store local
        return of(this.materiasSubject.value);
      })
    );
  }

  createMateria(dto: CreateMateriaDto): Observable<MateriaDto> {
    const docenteMap: Record<number, string> = {
      1: 'Dra. Evelyn Vance',
      2: 'Dr. Marcus Thorne',
      3: 'Prof. Sarah Chen'
    };

    const newId = Date.now();
    const nuevaMateria: MateriaDto = {
      id: newId,
      nombre: dto.nombre.trim(),
      codigo: dto.codigo.trim().toUpperCase(),
      descripcion: dto.descripcion?.trim() || 'Sin descripción detallada.',
      docente: docenteMap[dto.docenteResponsableId || 1] || 'Docente Responsable',
      docenteResponsableId: dto.docenteResponsableId || 1,
      creditos: dto.creditos || 4,
      semana: 1,
      totalSemanas: 16,
      claseId: dto.claseId ? Number(dto.claseId) : undefined,
      claseNombre: dto.claseNombre || 'Ingeniería de Software 2026-2',
      semestre: dto.semestre || '2026-2',
      grupo: dto.grupo || 'Grupo A',
      ayudantes: [],
      estudiantes: [
        { id: 1, nombre: 'Alejandro García', correo: 'a.garcia@uni.edu', nota: 4.8, asistencia: 100 },
        { id: 2, nombre: 'María López', correo: 'm.lopez@uni.edu', nota: 4.6, asistencia: 95 }
      ]
    };

    const currentList = this.materiasSubject.value;
    const updated = [nuevaMateria, ...currentList];
    this.materiasSubject.next(updated);
    this.saveStorage(this.STORAGE_MATERIAS, updated);

    // Inicializar temas por defecto para la nueva materia
    this.ensureDefaultTemasAndContent(nuevaMateria.id, nuevaMateria.nombre);

    return this.http.post<any>(this.apiUrl, dto).pipe(
      tap((backendRes) => {
        if (backendRes && (backendRes.id || backendRes.materiaId)) {
          nuevaMateria.id = backendRes.id || backendRes.materiaId;
          this.saveStorage(this.STORAGE_MATERIAS, this.materiasSubject.value);
        }
      }),
      catchError(() => of(nuevaMateria))
    );
  }

  deleteMateria(id: number): Observable<boolean> {
    const updated = this.materiasSubject.value.filter(m => Number(m.id) !== Number(id));
    this.materiasSubject.next(updated);
    this.saveStorage(this.STORAGE_MATERIAS, updated);

    // Limpiar recursos asociados
    const recs = this.recursosSubject.value.filter(r => Number(r.materiaId) !== Number(id));
    this.recursosSubject.next(recs);
    this.saveStorage(this.STORAGE_RECURSOS, recs);

    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  // ==================== TEMAS ====================

  getTemasByMateria(materiaId: number): string[] {
    const key = `${this.STORAGE_TEMAS}_${materiaId}`;
    const stored = this.loadStorage<string[]>(key, []);
    if (stored && stored.length > 0) {
      return stored;
    }
    // Temas por defecto si no existen
    const defaultTemas = [
      'Tema 1: Fundamentos y Conceptos Iniciales',
      'Tema 2: Desarrollo y Aplicaciones Prácticas'
    ];
    this.saveStorage(key, defaultTemas);
    return defaultTemas;
  }

  addTemaToMateria(materiaId: number, nombreTema: string): string[] {
    const key = `${this.STORAGE_TEMAS}_${materiaId}`;
    const actuales = this.getTemasByMateria(materiaId);
    const updated = [...actuales, nombreTema.trim()];
    this.saveStorage(key, updated);
    return updated;
  }

  private ensureDefaultTemasAndContent(materiaId: number, nombreMateria: string) {
    const key = `${this.STORAGE_TEMAS}_${materiaId}`;
    const defaultTemas = [
      `Tema 1: Introducción a ${nombreMateria}`,
      `Tema 2: Metodologías y Técnicas Avanzadas`
    ];
    this.saveStorage(key, defaultTemas);

    // Agregar recurso inicial de bienvenida
    const recursoInicial: RecursoDto = {
      id: Date.now(),
      materiaId: materiaId,
      temaNombre: defaultTemas[0],
      titulo: `Programa y Sílabo - ${nombreMateria}`,
      descripcion: `Plan de estudios y cronograma general de la materia ${nombreMateria}.`,
      url: 'https://ejemplo.edu/silabo.pdf',
      tipo: 'PDF',
      esEsencial: true,
      visto: false,
      creadoPor: 'Docente Responsable',
      fechaCreacion: new Date().toISOString().split('T')[0]
    };
    const recs = [recursoInicial, ...this.recursosSubject.value];
    this.recursosSubject.next(recs);
    this.saveStorage(this.STORAGE_RECURSOS, recs);

    // Agregar actividad inicial
    const actInicial: ActividadDto = {
      id: Date.now() + 1,
      materiaId: materiaId,
      titulo: `Actividad Diagnóstica - ${nombreMateria}`,
      descripcion: 'Cuestionario de conocimientos previos y expectativas del curso.',
      fechaEntrega: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      tipo: 'Taller',
      estado: 'pendiente'
    };
    const acts = [actInicial, ...this.actividadesSubject.value];
    this.actividadesSubject.next(acts);
    this.saveStorage(this.STORAGE_ACTIVIDADES, acts);
  }

  // ==================== RECURSOS ====================

  getRecursosByMateria(materiaId: number): Observable<RecursoDto[]> {
    return this.recursos$.pipe(
      map(recursos => recursos.filter(r => Number(r.materiaId) === Number(materiaId)))
    );
  }

  getRecursosConEstado(materiaId: number): Observable<RecursoConEstadoDto[]> {
    return this.getRecursosByMateria(materiaId);
  }

  addRecurso(materiaId: number, dto: CreateRecursoDto): Observable<RecursoDto> {
    const rolActual = typeof window !== 'undefined' ? (localStorage.getItem('rol') || 'Docente') : 'Docente';
    const nombreUsuario = typeof window !== 'undefined' ? (localStorage.getItem('nombre') || rolActual) : rolActual;

    let tipoCalculado = dto.tipo || 'Enlace';
    if (dto.url) {
      const urlLower = dto.url.toLowerCase();
      if (urlLower.endsWith('.pdf')) tipoCalculado = 'PDF';
      else if (urlLower.includes('youtu') || urlLower.includes('vimeo') || urlLower.endsWith('.mp4')) tipoCalculado = 'Video';
      else if (urlLower.includes('geogebra') || urlLower.includes('sim') || urlLower.includes('lab')) tipoCalculado = 'Simulador';
    }

    const safeGeneratedId = Math.floor((Date.now() / 1000) % 2000000000) + Math.floor(Math.random() * 1000) + 1;
    const nuevoRecurso: RecursoDto = {
      id: safeGeneratedId,
      materiaId: Number(materiaId),
      temaId: dto.temaId,
      temaNombre: dto.temaNombre || 'Tema 1: Fundamentos y Conceptos Iniciales',
      titulo: dto.titulo.trim(),
      descripcion: dto.descripcion?.trim() || `Recurso de tipo ${tipoCalculado}`,
      url: dto.url?.trim() || 'https://ejemplo.edu/recurso.pdf',
      tipo: tipoCalculado,
      esEsencial: !!dto.esEsencial,
      visto: false,
      creadoPor: `${nombreUsuario} (${rolActual})`,
      fechaCreacion: new Date().toISOString().split('T')[0],
      nombreArchivo: dto.nombreArchivo,
      archivoDataUrl: dto.archivoDataUrl,
      tamanoArchivoKb: dto.tamanoArchivoKb
    };

    const currentRecursos = this.recursosSubject.value;
    const updated = [nuevoRecurso, ...currentRecursos];
    this.recursosSubject.next(updated);
    this.saveStorage(this.STORAGE_RECURSOS, updated);

    // Intentar backend
    return this.http.post<RecursoDto>(`${this.apiUrl}/${materiaId}/recursos`, dto).pipe(
      tap(backendRes => {
        if (backendRes && backendRes.id) {
          nuevoRecurso.id = backendRes.id;
          this.saveStorage(this.STORAGE_RECURSOS, this.recursosSubject.value);
        }
      }),
      catchError(() => of(nuevoRecurso))
    );
  }

  marcarRecursoComoVisto(recursoId: number): Observable<any> {
    const safeRecursoId = Math.floor(Math.abs(Number(recursoId)) % 2147483647) || 1;
    const list = this.recursosSubject.value.map(r => {
      if (Number(r.id) === Number(recursoId)) {
        return { ...r, visto: !r.visto };
      }
      return r;
    });
    this.recursosSubject.next(list);
    this.saveStorage(this.STORAGE_RECURSOS, list);

    const payload: MarkRecursoAsSeenDto = {
      recursoId: safeRecursoId
    };

    return this.http.post(`${this.apiUrl}/recursos/marcar-visto`, payload).pipe(
      catchError(() => of({ success: true }))
    );
  }

  toggleRecursoEsencial(recursoId: number): void {
    const list = this.recursosSubject.value.map(r => {
      if (Number(r.id) === Number(recursoId)) {
        return { ...r, esEsencial: !r.esEsencial };
      }
      return r;
    });
    this.recursosSubject.next(list);
    this.saveStorage(this.STORAGE_RECURSOS, list);
  }

  deleteRecurso(recursoId: number): void {
    const list = this.recursosSubject.value.filter(r => Number(r.id) !== Number(recursoId));
    this.recursosSubject.next(list);
    this.saveStorage(this.STORAGE_RECURSOS, list);
  }

  // ==================== ACTIVIDADES ====================

  getActividadesSnapshot(materiaId?: number): ActividadDto[] {
    if (materiaId !== undefined) {
      return this.actividadesSubject.value.filter(a => Number(a.materiaId) === Number(materiaId));
    }
    return this.actividadesSubject.value;
  }

  getActividadesByMateria(materiaId: number): Observable<ActividadDto[]> {
    return this.actividades$.pipe(
      map(acts => acts.filter(a => Number(a.materiaId) === Number(materiaId)))
    );
  }

  addActividad(materiaId: number, dto: CreateActividadDto): Observable<ActividadDto> {
    const nuevaActividad: ActividadDto = {
      id: Date.now(),
      materiaId: Number(materiaId),
      titulo: dto.titulo.trim(),
      descripcion: dto.descripcion?.trim() || 'Sin descripción',
      fechaEntrega: dto.fechaEntrega || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      tipo: dto.tipo || 'Taller',
      estado: 'pendiente',
      nombreArchivo: dto.nombreArchivo,
      archivoDataUrl: dto.archivoDataUrl,
      tamanoArchivoKb: dto.tamanoArchivoKb
    };

    const current = this.actividadesSubject.value;
    const updated = [nuevaActividad, ...current];
    this.actividadesSubject.next(updated);
    this.saveStorage(this.STORAGE_ACTIVIDADES, updated);

    return this.http.post<ActividadDto>(`${this.apiUrl}/${materiaId}/actividades`, dto).pipe(
      tap(backendRes => {
        if (backendRes && backendRes.id) {
          nuevaActividad.id = backendRes.id;
          this.saveStorage(this.STORAGE_ACTIVIDADES, this.actividadesSubject.value);
        }
      }),
      catchError(() => of(nuevaActividad))
    );
  }

  updateActividadEstado(actividadId: number, nuevoEstado: string, nota?: number): void {
    const list = this.actividadesSubject.value.map(a => {
      if (Number(a.id) === Number(actividadId)) {
        return {
          ...a,
          estado: nuevoEstado,
          nota: nota !== undefined ? nota : a.nota,
          entregadoEl: nuevoEstado === 'entregada' ? new Date().toISOString() : a.entregadoEl
        };
      }
      return a;
    });
    this.actividadesSubject.next(list);
    this.saveStorage(this.STORAGE_ACTIVIDADES, list);
  }

  deleteActividad(actividadId: number): void {
    const list = this.actividadesSubject.value.filter(a => Number(a.id) !== Number(actividadId));
    this.actividadesSubject.next(list);
    this.saveStorage(this.STORAGE_ACTIVIDADES, list);
  }

  // ==================== ASISTENCIA Y CLASES ====================

  getAsistenciasByMateria(materiaId: number): Observable<RegistroAsistenciaDto[]> {
    return this.asistencias$.pipe(
      map(regs => regs.filter(reg => Number(reg.materiaId) === Number(materiaId)))
    );
  }

  addRegistroAsistencia(materiaId: number, tema: string, estudiantes?: EstudianteMateria[]): RegistroAsistenciaDto {
    const materia = this.getMateriaById(materiaId);
    const listaEstudiantes = estudiantes || materia?.estudiantes || [
      { id: 1, nombre: 'Alejandro García', correo: 'a.garcia@uni.edu' },
      { id: 2, nombre: 'María López', correo: 'm.lopez@uni.edu' },
      { id: 3, nombre: 'Carlos Ruiz', correo: 'c.ruiz@uni.edu' }
    ];

    const nuevoRegistro: RegistroAsistenciaDto = {
      id: Date.now(),
      materiaId: Number(materiaId),
      fecha: new Date().toISOString().split('T')[0],
      tema: tema.trim(),
      asistentes: listaEstudiantes.map(e => ({
        id: e.id,
        nombre: e.nombre,
        email: e.correo || `${e.nombre.toLowerCase().replace(/\s+/g, '.')}@uni.edu`,
        presente: false
      }))
    };

    const current = this.asistenciasSubject.value;
    const updated = [nuevoRegistro, ...current];
    this.asistenciasSubject.next(updated);
    this.saveStorage(this.STORAGE_ASISTENCIAS, updated);
    return nuevoRegistro;
  }

  toggleAsistencia(registroId: number, estudianteIndex: number): void {
    const list = this.asistenciasSubject.value.map(reg => {
      if (Number(reg.id) === Number(registroId)) {
        const asistentesCopy = [...reg.asistentes];
        if (asistentesCopy[estudianteIndex]) {
          asistentesCopy[estudianteIndex] = {
            ...asistentesCopy[estudianteIndex],
            presente: !asistentesCopy[estudianteIndex].presente
          };
        }
        return { ...reg, asistentes: asistentesCopy };
      }
      return reg;
    });
    this.asistenciasSubject.next(list);
    this.saveStorage(this.STORAGE_ASISTENCIAS, list);
  }

  getRecursosSnapshot(materiaId?: number): RecursoDto[] {
    if (materiaId !== undefined) {
      return this.recursosSubject.value.filter(r => Number(r.materiaId) === Number(materiaId));
    }
    return this.recursosSubject.value;
  }

  // ==================== ASIGNACIÓN Y GESTIÓN INTEGRAL DE ESTUDIANTES ====================

  agregarEstudiantesAMateria(materiaId: number, estudiantes: ({ id: number; nombre?: string; correo?: string } | number)[]): Observable<any> {
    const materias = this.materiasSubject.value.map(m => {
      if (Number(m.id) === Number(materiaId)) {
        const actualList = m.estudiantes || [];
        const combined = [...actualList];
        estudiantes.forEach(est => {
          const id = typeof est === 'number' ? est : est.id;
          const nombre = typeof est === 'object' && est.nombre ? est.nombre : `Estudiante #${id}`;
          const correo = typeof est === 'object' && est.correo ? est.correo : `estudiante${id}@uni.edu`;
          if (!combined.some(e => Number(e.id) === Number(id) || e.correo === correo)) {
            combined.push({
              id: id,
              nombre: nombre,
              correo: correo,
              cedula: `17${Math.floor(10000000 + Math.random() * 90000000)}`,
              matricula: `2024-MAT-${String(id).slice(-3)}`,
              carrera: 'Ingeniería de Software',
              nota: 4.5,
              asistencia: 100,
              estado: 'Regular',
              tareasEntregadas: 5,
              totalTareas: 6,
              observaciones: ['Matriculado oficialmente en la cátedra.']
            });
          }
        });
        return { ...m, estudiantes: combined };
      }
      return m;
    });

    this.materiasSubject.next(materias);
    this.saveStorage(this.STORAGE_MATERIAS, materias);

    const estudianteIds = estudiantes.map(e => typeof e === 'number' ? e : e.id);
    return this.http.post(`${this.apiUrl}/${materiaId}/estudiantes`, { estudianteIds }).pipe(
      catchError(() => of({ success: true }))
    );
  }

  agregarEstudianteDirecto(materiaId: number, estudiante: Partial<EstudianteMateria>): void {
    const materias = this.materiasSubject.value.map(m => {
      if (Number(m.id) === Number(materiaId)) {
        const list = m.estudiantes || [];
        const nuevoId = estudiante.id || Date.now();
        const nuevo: EstudianteMateria = {
          id: nuevoId,
          nombre: estudiante.nombre || 'Nuevo Estudiante',
          correo: estudiante.correo || `estudiante_${nuevoId}@uni.edu`,
          cedula: estudiante.cedula || `17${Math.floor(10000000 + Math.random() * 90000000)}`,
          matricula: estudiante.matricula || `2024-ALUM-${String(nuevoId).slice(-4)}`,
          carrera: estudiante.carrera || 'Ingeniería de Software',
          nota: estudiante.nota !== undefined ? estudiante.nota : 4.2,
          asistencia: estudiante.asistencia !== undefined ? estudiante.asistencia : 90,
          estado: estudiante.estado || 'Regular',
          telefono: estudiante.telefono || '+593 99 123 4567',
          tareasEntregadas: estudiante.tareasEntregadas || 5,
          totalTareas: 6,
          observaciones: estudiante.observaciones || ['Incorporado al aula por el docente responsable.']
        };
        return { ...m, estudiantes: [nuevo, ...list] };
      }
      return m;
    });
    this.materiasSubject.next(materias);
    this.saveStorage(this.STORAGE_MATERIAS, materias);
  }

  actualizarEstudianteEnMateria(materiaId: number, estudianteActualizado: EstudianteMateria): void {
    const materias = this.materiasSubject.value.map(m => {
      if (Number(m.id) === Number(materiaId)) {
        const list = (m.estudiantes || []).map(e =>
          Number(e.id) === Number(estudianteActualizado.id) ? { ...e, ...estudianteActualizado } : e
        );
        return { ...m, estudiantes: list };
      }
      return m;
    });
    this.materiasSubject.next(materias);
    this.saveStorage(this.STORAGE_MATERIAS, materias);
  }

  eliminarEstudianteDeMateria(materiaId: number, estudianteId: number): void {
    const materias = this.materiasSubject.value.map(m => {
      if (Number(m.id) === Number(materiaId)) {
        const list = (m.estudiantes || []).filter(e => Number(e.id) !== Number(estudianteId));
        return { ...m, estudiantes: list };
      }
      return m;
    });
    this.materiasSubject.next(materias);
    this.saveStorage(this.STORAGE_MATERIAS, materias);
  }

  agregarObservacionEstudiante(materiaId: number, estudianteId: number, observacion: string): void {
    if (!observacion?.trim()) return;
    const materias = this.materiasSubject.value.map(m => {
      if (Number(m.id) === Number(materiaId)) {
        const list = (m.estudiantes || []).map(e => {
          if (Number(e.id) === Number(estudianteId)) {
            const obs = e.observaciones ? [...e.observaciones] : [];
            const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            obs.unshift(`[${fecha}] ${observacion.trim()}`);
            return { ...e, observaciones: obs };
          }
          return e;
        });
        return { ...m, estudiantes: list };
      }
      return m;
    });
    this.materiasSubject.next(materias);
    this.saveStorage(this.STORAGE_MATERIAS, materias);
  }
}
