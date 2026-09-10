import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { getApiBase } from '../api';

export interface EstudianteMateria {
  id: number;
  estudianteId?: number;
  nombre: string;
  apellido?: string;
  correo?: string;
  username?: string;
  nota?: number;
  asistencia?: number;
  matricula?: string;
  cedula?: string;
  carrera?: string;
  estado?: 'Regular' | 'En Riesgo' | 'Destacado' | 'Retirado' | 'Justificado' | string;
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
  docenteId?: number;
  docenteResponsableId?: number;
  descripcion?: string;
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

const ESTUDIANTES_CALCULO_24: EstudianteMateria[] = [];

const MATERIAS_DEFAULT: MateriaDto[] = [];

const RECURSOS_DEFAULT: RecursoDto[] = [];

const ACTIVIDADES_DEFAULT: ActividadDto[] = [];

const ASISTENCIAS_DEFAULT: RegistroAsistenciaDto[] = [];

@Injectable({
  providedIn: 'root'
})
export class MateriaService {
  private STORAGE_MATERIAS = 'sigac_materias_v2';
  private STORAGE_MATERIAS_ESTUDIANTE = 'sigac_estudiante_materias_real';
  private STORAGE_RECURSOS = 'sigac_recursos_v2';
  private STORAGE_ACTIVIDADES = 'sigac_actividades_v2';
  private STORAGE_ASISTENCIAS = 'sigac_asistencias_v2';
  private STORAGE_TEMAS = 'sigac_temas_v2';

  private materiasSubject = new BehaviorSubject<MateriaDto[]>(this.getInitialMaterias());
  public materias$ = this.materiasSubject.asObservable();

  private recursosSubject = new BehaviorSubject<RecursoDto[]>(this.loadStorage(this.STORAGE_RECURSOS, RECURSOS_DEFAULT));
  public recursos$ = this.recursosSubject.asObservable();

  private actividadesSubject = new BehaviorSubject<ActividadDto[]>(this.loadStorage(this.STORAGE_ACTIVIDADES, ACTIVIDADES_DEFAULT));
  public actividades$ = this.actividadesSubject.asObservable();

  private asistenciasSubject = new BehaviorSubject<RegistroAsistenciaDto[]>(this.loadStorage(this.STORAGE_ASISTENCIAS, ASISTENCIAS_DEFAULT));
  public asistencias$ = this.asistenciasSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getInitialMaterias(): MateriaDto[] {
    if (typeof window !== 'undefined') {
      const rol = localStorage.getItem('rol');
      if (rol === 'Estudiante') {
        const stored = localStorage.getItem(this.STORAGE_MATERIAS_ESTUDIANTE);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            return [];
          }
        }
        return [];
      }
    }
    return this.loadStorage(this.STORAGE_MATERIAS, MATERIAS_DEFAULT);
  }

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
  /**
   * Obtiene única y exclusivamente las materias reales devueltas por la API
   * para el estudiante logueado (sin materias de relleno ni fallbacks con materias falsas).
   */
  refreshMaterias(): Observable<MateriaDto[]> {
    const rol = typeof window !== 'undefined' ? (localStorage.getItem('rol') || 'Estudiante') : 'Estudiante';
    const userId = typeof window !== 'undefined' ? (Number(localStorage.getItem('userId')) || 1) : 1;
    const estudianteId = typeof window !== 'undefined' ? (Number(localStorage.getItem('estudianteId')) || userId) : userId;
    const correoUsuario = typeof window !== 'undefined' ? (localStorage.getItem('correo') || '').toLowerCase().trim() : '';

    if (rol === 'Docente') {
      const urlDocenteClases = `${getApiBase()}/api/Docente/clases`;
      const urlClaseDocente = `${getApiBase()}/api/Clase/docente/${userId}`;
      const urlClaseDocenteLower = `${getApiBase()}/api/clase/docente/${userId}`;

      return this.http.get<any>(urlDocenteClases).pipe(
        catchError(() => this.http.get<any>(urlClaseDocente)),
        catchError(() => this.http.get<any>(urlClaseDocenteLower)),
        tap((res) => {
          let clasesBackend: any[] = [];
          if (Array.isArray(res)) {
            clasesBackend = res;
          } else if (res && Array.isArray((res as any).clases)) {
            clasesBackend = (res as any).clases;
          } else if (res && Array.isArray((res as any).materias)) {
            clasesBackend = (res as any).materias;
          }

          if (clasesBackend.length > 0) {
            const mapped = clasesBackend.map((item: any, idx: number) => this.mapToMateriaDto(item, idx));
            const existing = this.materiasSubject.value;
            const newMap = new Map<number, MateriaDto>();
            existing.forEach(m => newMap.set(m.id, m));
            mapped.forEach(m => newMap.set(m.id, m));
            const merged = Array.from(newMap.values());
            this.materiasSubject.next(merged);
            this.saveStorage(this.STORAGE_MATERIAS, merged);
          }
        }),
        map(() => this.materiasSubject.value),
        catchError(() => of(this.materiasSubject.value))
      );
    }

    if (rol === 'Administrador') {
      const urlMateria = `${getApiBase()}/api/Materia`;
      const urlMateriaLower = `${getApiBase()}/api/materia`;
      const urlMaterias = `${getApiBase()}/api/Materias`;

      return this.http.get<any>(urlMateria).pipe(
        catchError(() => this.http.get<any>(urlMateriaLower)),
        catchError(() => this.http.get<any>(urlMaterias)),
        tap((res) => {
          let mats: any[] = [];
          if (Array.isArray(res)) {
            mats = res;
          } else if (res && Array.isArray((res as any).materias)) {
            mats = (res as any).materias;
          }

          if (mats.length > 0) {
            const mapped = mats.map((item: any, idx: number) => this.mapToMateriaDto(item, idx));
            const existing = this.materiasSubject.value;
            const mapById = new Map<number, MateriaDto>();
            existing.forEach(m => mapById.set(m.id, m));
            mapped.forEach(m => mapById.set(m.id, m));
            const merged = Array.from(mapById.values());
            this.materiasSubject.next(merged);
            this.saveStorage(this.STORAGE_MATERIAS, merged);
          }
        }),
        map(() => this.materiasSubject.value),
        catchError(() => of(this.materiasSubject.value))
      );
    }

    if (rol !== 'Estudiante' && rol !== 'Ayudante') {
      return of(this.materiasSubject.value);
    }

    const endpointMisMaterias = `${getApiBase()}/api/Estudiante/mis-materias`;

    return this.http.get<any>(endpointMisMaterias).pipe(
      tap((res) => {
        let materiasBackend: any[] = [];
        if (Array.isArray(res)) {
          materiasBackend = res;
        } else if (res && Array.isArray(res.materias)) {
          materiasBackend = res.materias;
        } else if (res && Array.isArray(res.clases)) {
          materiasBackend = res.clases;
        }

        // Mapear única y exclusivamente las materias reales de la API sin arrays estáticos de relleno
        const mapped = materiasBackend.map((item: any, idx: number) => this.mapToMateriaDto(item, idx));
        this.materiasSubject.next(mapped);
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_MATERIAS_ESTUDIANTE, JSON.stringify(mapped));
        }
      }),
      map(() => this.materiasSubject.value),
      catchError(() => {
        // En caso de que el backend esté offline o dé 503, obtener únicamente las clases reales del sistema donde el estudiante figure inscrito
        const materiasReales = this.obtenerClasesRealesEstudiante(estudianteId, correoUsuario);
        this.materiasSubject.next(materiasReales);
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_MATERIAS_ESTUDIANTE, JSON.stringify(materiasReales));
        }
        return of(materiasReales);
      })
    );
  }

  getMateriasEstudiante(): Observable<MateriaDto[]> {
    return this.refreshMaterias();
  }

  /**
   * Busca clases reales registradas en la aplicación donde el estudiante figure efectivamente matriculado.
   * Si no está inscrito en ninguna, retorna array vacío ([]), sin materias falsas de relleno.
   */
  private obtenerClasesRealesEstudiante(estudianteId: number, correoUsuario: string): MateriaDto[] {
    if (typeof window === 'undefined') return [];
    const clasesEncontradas: MateriaDto[] = [];

    // 1. Revisar materias activas con lista de estudiantes
    try {
      const storedMaterias = localStorage.getItem(this.STORAGE_MATERIAS);
      if (storedMaterias) {
        const mats: MateriaDto[] = JSON.parse(storedMaterias);
        if (Array.isArray(mats)) {
          mats.forEach(m => {
            const isInscrito = m.estudiantes?.some(e => 
              (correoUsuario && e.correo && e.correo.toLowerCase() === correoUsuario) ||
              (Number(e.id) === estudianteId) ||
              (Number(e.estudianteId) === estudianteId)
            );
            if (isInscrito && !clasesEncontradas.some(c => c.id === m.id)) {
              clasesEncontradas.push(m);
            }
          });
        }
      }
    } catch {}

    // 2. Revisar clases de claseService
    try {
      const storedClases = localStorage.getItem('sigac_clases_v2');
      if (storedClases) {
        const clases = JSON.parse(storedClases);
        if (Array.isArray(clases)) {
          clases.forEach((c: any, idx: number) => {
            const matchId = Array.isArray(c.estudianteIds) && c.estudianteIds.includes(estudianteId);
            const matchCorreo = Array.isArray(c.estudiantes) && c.estudiantes.some((e: any) => 
              correoUsuario && e.correo && e.correo.toLowerCase() === correoUsuario
            );
            if ((matchId || matchCorreo) && !clasesEncontradas.some(m => m.id === c.id || m.claseId === c.id)) {
              clasesEncontradas.push(this.mapToMateriaDto(c, idx));
            }
          });
        }
      }
    } catch {}

    return clasesEncontradas;
  }

  createMateria(dto: CreateMateriaDto): Observable<MateriaDto> {
    const docenteMap: Record<number, string> = {
      1: 'Dra. Evelyn Vance',
      2: 'Dr. Marcus Thorne',
      3: 'Prof. Sarah Chen',
      102: 'Docente Titular'
    };

    const docId = Number(dto.docenteId || dto.docenteResponsableId || 1);
    const newId = Date.now();
    const nuevaMateria: MateriaDto = {
      id: newId,
      nombre: dto.nombre.trim(),
      codigo: dto.codigo.trim().toUpperCase(),
      descripcion: dto.descripcion?.trim() || 'Sin descripción detallada.',
      docente: docenteMap[docId] || 'Docente Titular',
      docenteResponsableId: docId,
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

    // Payload explícito con { nombre, codigo, docenteId }
    const postPayload = {
      nombre: dto.nombre.trim(),
      codigo: dto.codigo.trim().toUpperCase(),
      docenteId: docId,
      descripcion: dto.descripcion?.trim() || '',
      creditos: Number(dto.creditos) || 4,
      semestre: dto.semestre || '2026-2',
      grupo: dto.grupo || 'Grupo A'
    };

    const urlMateria = `${getApiBase()}/api/Materia`;
    const urlMateriaLower = `${getApiBase()}/api/materia`;
    const urlMaterias = `${getApiBase()}/api/Materias`;

    return this.http.post<any>(urlMateria, postPayload).pipe(
      catchError(() => this.http.post<any>(urlMateriaLower, postPayload)),
      catchError(() => this.http.post<any>(urlMaterias, postPayload)),
      tap((backendRes) => {
        if (backendRes && (backendRes.id || backendRes.materiaId)) {
          const idDevuelto = Number(backendRes.id || backendRes.materiaId);
          nuevaMateria.id = idDevuelto;
          if (backendRes.docenteId) {
            nuevaMateria.docenteResponsableId = Number(backendRes.docenteId);
          }
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

  syncMaterias(nuevas: MateriaDto[]): void {
    const current = this.materiasSubject.value;
    const mapById = new Map<number, MateriaDto>();
    current.forEach(m => mapById.set(m.id, m));
    nuevas.forEach(m => mapById.set(m.id, m));
    const merged = Array.from(mapById.values());
    this.materiasSubject.next(merged);
    this.saveStorage(this.STORAGE_MATERIAS, merged);
  }

  // ==================== TEMAS ====================

  getTemasByMateria(materiaId: number): string[] {
    const key = `${this.STORAGE_TEMAS}_${materiaId}`;
    const stored = this.loadStorage<string[]>(key, []);
    return stored || [];
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
    const stored = this.loadStorage<string[]>(key, []);
    if (!stored || stored.length === 0) {
      this.saveStorage(key, []);
    }
  }

  // ==================== RECURSOS ====================

  getRecursosByMateria(materiaId: number): Observable<RecursoDto[]> {
    return this.http.get<any>(`${this.apiUrl}/${materiaId}/recursos`).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.recursos || []);
        const mapped: RecursoDto[] = list.map((r: any) => ({
          id: Number(r.id),
          materiaId: Number(r.materiaId || materiaId),
          temaId: r.temaId,
          temaNombre: r.temaNombre,
          titulo: r.titulo,
          descripcion: r.descripcion,
          url: r.url,
          tipo: r.tipo || 'PDF',
          esEsencial: !!r.esEsencial,
          visto: !!r.visto,
          creadoPor: r.creadoPor,
          fechaCreacion: r.fechaCreacion,
          nombreArchivo: r.nombreArchivo,
          archivoDataUrl: r.archivoDataUrl,
          tamanoArchivoKb: r.tamanoArchivoKb
        }));
        const currentOther = this.recursosSubject.value.filter(r => Number(r.materiaId) !== Number(materiaId));
        const combined = [...mapped, ...currentOther];
        this.recursosSubject.next(combined);
        this.saveStorage(this.STORAGE_RECURSOS, combined);
        return mapped;
      }),
      catchError(() => {
        return this.recursos$.pipe(
          map(recursos => recursos.filter(r => Number(r.materiaId) === Number(materiaId)))
        );
      })
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
    return this.http.get<any>(`${this.apiUrl}/${materiaId}/actividades`).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.actividades || []);
        const mapped: ActividadDto[] = list.map((a: any) => ({
          id: Number(a.id),
          materiaId: Number(a.materiaId || materiaId),
          titulo: a.titulo,
          descripcion: a.descripcion,
          fechaEntrega: a.fechaEntrega,
          tipo: a.tipo || 'Taller',
          estado: a.estado || 'pendiente',
          nota: a.nota !== undefined ? Number(a.nota) : undefined,
          entregadoEl: a.entregadoEl,
          nombreArchivo: a.nombreArchivo,
          archivoDataUrl: a.archivoDataUrl,
          tamanoArchivoKb: a.tamanoArchivoKb
        }));
        const currentOther = this.actividadesSubject.value.filter(a => Number(a.materiaId) !== Number(materiaId));
        const combined = [...mapped, ...currentOther];
        this.actividadesSubject.next(combined);
        this.saveStorage(this.STORAGE_ACTIVIDADES, combined);
        return mapped;
      }),
      catchError(() => {
        return this.actividades$.pipe(
          map(acts => acts.filter(a => Number(a.materiaId) === Number(materiaId)))
        );
      })
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
    const listaEstudiantes = estudiantes || materia?.estudiantes || [];

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

  eliminarEstudianteDeMateria(materiaOrClaseId: number, estudianteId: number): void {
    const materias = this.materiasSubject.value.map(m => {
      if (Number(m.id) === Number(materiaOrClaseId) || Number(m.claseId) === Number(materiaOrClaseId)) {
        const list = (m.estudiantes || []).filter(e => Number(e.id) !== Number(estudianteId) && Number((e as any).estudianteId) !== Number(estudianteId));
        return { ...m, estudiantes: list };
      }
      return m;
    });
    this.materiasSubject.next(materias);
    this.saveStorage(this.STORAGE_MATERIAS, materias);
  }

  /**
   * DELETE /api/Clase/{claseId}/estudiantes/{estudianteId}
   * Elimina un estudiante de la clase/materia
   */
  eliminarEstudiante(claseId: number, estudianteId: number): Observable<any> {
    this.eliminarEstudianteDeMateria(claseId, estudianteId);
    return this.http.delete(`${getApiBase()}/api/Clase/${claseId}/estudiantes/${estudianteId}`).pipe(
      catchError(() => of({ success: true }))
    );
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
