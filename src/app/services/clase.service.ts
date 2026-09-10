import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { getApiBase } from '../api';

export interface CreateClaseDto {
  nombre: string;
  materiaId?: number;
  materiaIds?: number[];
  docenteId?: number;
  estudianteIds?: number[];
  semestre?: string;
  descripcion?: string;
  carrera?: string;
}

export interface ClaseDto {
  id: number;
  nombre: string;
  materiaId?: number;
  materiaIds?: number[];
  docenteId?: number;
  estudianteIds?: number[];
  semestre?: string;
  descripcion?: string;
  carrera?: string;
}

export interface CreateClaseSesionDto {
  materiaId: number;
  claseId?: number;
  docenteId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoClase: string;
  linkVirtual?: string;
  aplicacionVirtual?: string;
  edificioPresencial?: string;
  aulaPresencial?: string;
  pisoPresencial?: string;
}

export interface ClaseSesionDto {
  id: number;
  materiaId: number;
  claseId?: number;
  docenteId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoClase: string;
  linkVirtual?: string;
  aplicacionVirtual?: string;
  edificioPresencial?: string;
  aulaPresencial?: string;
  pisoPresencial?: string;
}

export interface CreateAsistenciaDto {
  claseSesionId: number;
  estudianteId: number;
  presente: boolean;
}

export interface AsistenciaDto {
  id: number;
  claseSesionId: number;
  estudianteId: number;
  presente: boolean;
}

const CLASES_DEFAULT: ClaseDto[] = [];

const SESIONES_DEFAULT: ClaseSesionDto[] = [];

@Injectable({
  providedIn: 'root'
})
export class ClaseService {
  private STORAGE_CLASES = 'sigac_clases_v2';
  private STORAGE_SESIONES = 'sigac_sesiones_v2';

  private clasesSubject = new BehaviorSubject<ClaseDto[]>(this.loadStorage(this.STORAGE_CLASES, CLASES_DEFAULT));
  public clases$ = this.clasesSubject.asObservable();

  private sesionesSubject = new BehaviorSubject<ClaseSesionDto[]>(this.loadStorage(this.STORAGE_SESIONES, SESIONES_DEFAULT));
  public sesiones$ = this.sesionesSubject.asObservable();

  constructor(private http: HttpClient) {}

  private get apiUrl() { return `${getApiBase()}/api/Clase`; }
  private get sesionApiUrl() { return `${getApiBase()}/api/ClaseSesion`; }

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

  // Clase
  getClases(): Observable<ClaseDto[]> {
    return this.clases$;
  }

  createClase(dto: CreateClaseDto): Observable<ClaseDto> {
    const matIds = dto.materiaIds && dto.materiaIds.length > 0
      ? dto.materiaIds
      : (dto.materiaId ? [Number(dto.materiaId)] : []);

    const resolvedMateriaId = Number(dto.materiaId || (matIds.length > 0 ? matIds[0] : 101));
    const resolvedDocenteId = Number(dto.docenteId || 1);

    const nuevaClase: ClaseDto = {
      id: Math.floor((Date.now() / 1000) % 2000000000) + 1,
      nombre: dto.nombre.trim(),
      materiaId: resolvedMateriaId,
      materiaIds: matIds.length > 0 ? matIds : [resolvedMateriaId],
      docenteId: resolvedDocenteId,
      semestre: dto.semestre || '2026-2',
      descripcion: dto.descripcion?.trim() || '',
      carrera: dto.carrera || 'Ingeniería',
      estudianteIds: dto.estudianteIds || [1, 2]
    };

    const current = this.clasesSubject.value;
    const updated = [nuevaClase, ...current];
    this.clasesSubject.next(updated);
    this.saveStorage(this.STORAGE_CLASES, updated);

    // Payload con materiaId y docenteId válidos (nunca null ni undefined)
    const postPayload = {
      nombre: dto.nombre.trim(),
      materiaId: resolvedMateriaId,
      docenteId: resolvedDocenteId,
      semestre: dto.semestre || '2026-2',
      carrera: dto.carrera || 'Ingeniería',
      descripcion: dto.descripcion?.trim() || '',
      estudianteIds: dto.estudianteIds || [1, 2]
    };

    const urlClase = `${getApiBase()}/api/Clase`;
    const urlClaseLower = `${getApiBase()}/api/clase`;
    const urlClases = `${getApiBase()}/api/Clases`;

    return this.http.post<any>(urlClase, postPayload).pipe(
      catchError(() => this.http.post<any>(urlClaseLower, postPayload)),
      catchError(() => this.http.post<any>(urlClases, postPayload)),
      tap((backendRes) => {
        if (backendRes && (backendRes.id || backendRes.claseId)) {
          nuevaClase.id = Number(backendRes.id || backendRes.claseId);
          this.saveStorage(this.STORAGE_CLASES, this.clasesSubject.value);
        }
      }),
      map((res) => {
        if (res && (res.id || res.claseId)) {
          return {
            ...nuevaClase,
            id: Number(res.id || res.claseId),
            materiaId: Number(res.materiaId || resolvedMateriaId),
            docenteId: Number(res.docenteId || resolvedDocenteId)
          };
        }
        return nuevaClase;
      }),
      catchError(() => of(nuevaClase))
    );
  }

  deleteClase(id: number): Observable<boolean> {
    const list = this.clasesSubject.value.filter(c => Number(c.id) !== Number(id));
    this.clasesSubject.next(list);
    this.saveStorage(this.STORAGE_CLASES, list);
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  getClaseById(id: number): Observable<ClaseDto> {
    const found = this.clasesSubject.value.find(c => Number(c.id) === Number(id));
    if (found) {
      return of(found);
    }
    return this.http.get<ClaseDto>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(CLASES_DEFAULT[0]))
    );
  }

  addEstudiantesToClase(claseId: number, estudianteIds: number[]): Observable<any> {
    const list = this.clasesSubject.value.map(c => {
      if (Number(c.id) === Number(claseId)) {
        const currentIds = c.estudianteIds || [];
        const unique = Array.from(new Set([...currentIds, ...estudianteIds]));
        return { ...c, estudianteIds: unique };
      }
      return c;
    });
    this.clasesSubject.next(list);
    this.saveStorage(this.STORAGE_CLASES, list);

    return this.http.post(`${this.apiUrl}/${claseId}/estudiantes`, estudianteIds).pipe(
      catchError(() => of({ success: true }))
    );
  }

  /**
   * DELETE /api/Clase/{claseId}/estudiantes/{estudianteId}
   * Elimina un estudiante de la clase
   */
  eliminarEstudiante(claseId: number, estudianteId: number): Observable<any> {
    const list = this.clasesSubject.value.map(c => {
      if (Number(c.id) === Number(claseId)) {
        const currentIds = (c.estudianteIds || []).filter(id => Number(id) !== Number(estudianteId));
        return { ...c, estudianteIds: currentIds };
      }
      return c;
    });
    this.clasesSubject.next(list);
    this.saveStorage(this.STORAGE_CLASES, list);

    return this.http.delete(`${this.apiUrl}/${claseId}/estudiantes/${estudianteId}`).pipe(
      catchError(() => of({ success: true }))
    );
  }

  getEstudiantesFromClase(claseId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${claseId}/estudiantes`).pipe(
      catchError(() => of([]))
    );
  }

  // Sesiones
  createClaseSesion(dto: CreateClaseSesionDto): Observable<ClaseSesionDto> {
    const nuevaSesion: ClaseSesionDto = {
      id: Math.floor((Date.now() / 1000) % 2000000000) + 1,
      materiaId: Number(dto.materiaId),
      claseId: dto.claseId ? Number(dto.claseId) : undefined,
      docenteId: Number(dto.docenteId),
      fecha: dto.fecha,
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
      tipoClase: dto.tipoClase,
      linkVirtual: dto.linkVirtual,
      aplicacionVirtual: dto.aplicacionVirtual,
      edificioPresencial: dto.edificioPresencial,
      aulaPresencial: dto.aulaPresencial,
      pisoPresencial: dto.pisoPresencial
    };

    const current = this.sesionesSubject.value;
    const updated = [nuevaSesion, ...current];
    this.sesionesSubject.next(updated);
    this.saveStorage(this.STORAGE_SESIONES, updated);

    return this.http.post<ClaseSesionDto>(this.sesionApiUrl, dto).pipe(
      tap((backendRes) => {
        if (backendRes && backendRes.id) {
          nuevaSesion.id = backendRes.id;
          this.saveStorage(this.STORAGE_SESIONES, this.sesionesSubject.value);
        }
      }),
      catchError(() => of(nuevaSesion))
    );
  }

  getClaseSesionById(id: number): Observable<ClaseSesionDto> {
    const found = this.sesionesSubject.value.find(s => Number(s.id) === Number(id));
    if (found) return of(found);
    return this.http.get<ClaseSesionDto>(`${this.sesionApiUrl}/${id}`).pipe(
      catchError(() => of(SESIONES_DEFAULT[0]))
    );
  }

  getSesionesByMateria(materiaId: number): Observable<ClaseSesionDto[]> {
    return this.sesiones$.pipe(
      map(list => list.filter(s => Number(s.materiaId) === Number(materiaId)))
    );
  }

  getSesionesByClase(claseId: number): Observable<ClaseSesionDto[]> {
    return this.sesiones$.pipe(
      map(list => list.filter(s => Number(s.claseId) === Number(claseId)))
    );
  }

  // Asistencia
  registrarAsistencia(claseSesionId: number, dto: CreateAsistenciaDto): Observable<AsistenciaDto> {
    return this.http.post<AsistenciaDto>(`${this.sesionApiUrl}/${claseSesionId}/asistencia`, dto).pipe(
      catchError(() => of({ id: Math.floor((Date.now() / 1000) % 2000000000) + 1, ...dto }))
    );
  }

  getAsistenciaBySesion(claseSesionId: number): Observable<AsistenciaDto[]> {
    return this.http.get<AsistenciaDto[]>(`${this.sesionApiUrl}/${claseSesionId}/asistencia`).pipe(
      catchError(() => of([]))
    );
  }

  getAsistenciaEstudiante(claseSesionId: number): Observable<any> {
    return this.http.get<any>(`${this.sesionApiUrl}/estudiante/asistencia/${claseSesionId}`).pipe(
      catchError(() => of({ presente: true }))
    );
  }
}
