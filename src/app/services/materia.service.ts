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
}

export interface CreateActividadDto {
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  tipo: string;
  materiaId: number;
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
    estudiantes: [
      { id: 1, nombre: 'Alejandro García', correo: 'a.garcia@uni.edu', nota: 4.8, asistencia: 94 },
      { id: 2, nombre: 'María López', correo: 'm.lopez@uni.edu', nota: 4.5, asistencia: 88 }
    ]
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
    estudiantes: [
      { id: 3, nombre: 'Carlos Ruiz', correo: 'c.ruiz@uni.edu', nota: 4.9, asistencia: 97 }
    ]
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
    estudiantes: [
      { id: 1, nombre: 'Alejandro García', correo: 'a.garcia@uni.edu', nota: 4.9, asistencia: 98 },
      { id: 4, nombre: 'Valentina Soto', correo: 'v.soto@uni.edu', nota: 4.7, asistencia: 92 }
    ]
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
    asistentes: [
      { id: 1, nombre: 'Alejandro García', email: 'a.garcia@uni.edu', presente: true },
      { id: 2, nombre: 'María López', email: 'm.lopez@uni.edu', presente: true },
      { id: 3, nombre: 'Carlos Ruiz', email: 'c.ruiz@uni.edu', presente: false }
    ]
  },
  {
    id: 2,
    materiaId: 101,
    fecha: '2026-08-18',
    tema: 'Introducción al Cálculo Multivariable',
    asistentes: [
      { id: 1, nombre: 'Alejandro García', email: 'a.garcia@uni.edu', presente: true },
      { id: 2, nombre: 'María López', email: 'm.lopez@uni.edu', presente: false },
      { id: 3, nombre: 'Carlos Ruiz', email: 'c.ruiz@uni.edu', presente: true }
    ]
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

  constructor(private http: HttpClient) {
    this.refreshMaterias();
  }

  private get apiUrl() { return `${getApiBase()}/api/materia`; }

  private loadStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
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

  getMateriaById(id: number): MateriaDto | undefined {
    const list = this.materiasSubject.value;
    return list.find(m => Number(m.id) === Number(id));
  }

  refreshMaterias(): Observable<MateriaDto[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const current = this.materiasSubject.value;
          const mapped: MateriaDto[] = data.map((item, idx) => ({
            id: item.id || item.materiaId || (idx + 200),
            nombre: item.nombre || item.nombreMateria || 'Materia',
            codigo: item.codigo || item.codigoMateria || `MAT-${item.id || idx}`,
            descripcion: item.descripcion || '',
            docente: item.docente || item.nombreDocente || (item.docenteResponsableId ? `Docente #${item.docenteResponsableId}` : 'Docente Asignado'),
            docenteResponsableId: item.docenteResponsableId || 1,
            creditos: item.creditos || 4,
            semana: item.semana || 1,
            totalSemanas: item.totalSemanas || 16,
            ayudantes: item.ayudantes || [],
            estudiantes: item.estudiantes || []
          }));

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
      catchError(() => of(this.materiasSubject.value))
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

    const nuevoRecurso: RecursoDto = {
      id: Date.now(),
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
      fechaCreacion: new Date().toISOString().split('T')[0]
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
    const list = this.recursosSubject.value.map(r => {
      if (Number(r.id) === Number(recursoId)) {
        return { ...r, visto: !r.visto };
      }
      return r;
    });
    this.recursosSubject.next(list);
    this.saveStorage(this.STORAGE_RECURSOS, list);

    return this.http.post(`${this.apiUrl}/recursos/marcar-visto`, { recursoId } as MarkRecursoAsSeenDto).pipe(
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
      estado: 'pendiente'
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

  getRecursosSnapshot(): RecursoDto[] {
    return this.recursosSubject.value;
  }

  // ==================== ASIGNACIÓN DE ESTUDIANTES ====================

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
              nota: 4.5,
              asistencia: 100
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
}
