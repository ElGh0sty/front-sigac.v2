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

const CLASES_DEFAULT: ClaseDto[] = [
  {
    id: 1,
    nombre: 'Ingeniería de Software 2026-2',
    materiaId: 101,
    materiaIds: [101, 103],
    docenteId: 1,
    semestre: '2026-2',
    descripcion: 'Grupo académico de Ingeniería de Software y Sistemas.',
    carrera: 'Ingeniería de Software',
    estudianteIds: [1, 2, 3]
  },
  {
    id: 2,
    nombre: 'Ciencias Físicas e Ingeniería 2026-1',
    materiaId: 102,
    materiaIds: [102],
    docenteId: 2,
    semestre: '2026-1',
    descripcion: 'Cohorte de ciencias básicas y física aplicada.',
    carrera: 'Física / Ingeniería',
    estudianteIds: [3, 4]
  },
  {
    id: 3,
    nombre: 'Ciencias de la Computación 2026-2',
    materiaId: 103,
    materiaIds: [103],
    docenteId: 3,
    semestre: '2026-2',
    descripcion: 'Cohorte especializada en Inteligencia Artificial y Algoritmos.',
    carrera: 'Ciencias de la Computación',
    estudianteIds: [1, 4]
  }
];

const SESIONES_DEFAULT: ClaseSesionDto[] = [
  {
    id: 1,
    materiaId: 101,
    claseId: 1,
    docenteId: 1,
    fecha: '2026-08-25',
    horaInicio: '08:00',
    horaFin: '10:00',
    tipoClase: 'Presencial',
    edificioPresencial: 'Edificio Central A',
    aulaPresencial: 'Aula 302',
    pisoPresencial: 'Piso 3'
  },
  {
    id: 2,
    materiaId: 101,
    claseId: 1,
    docenteId: 1,
    fecha: '2026-08-27',
    horaInicio: '10:00',
    horaFin: '12:00',
    tipoClase: 'Virtual',
    linkVirtual: 'https://meet.google.com/abc-defg-hij',
    aplicacionVirtual: 'Google Meet'
  }
];

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

  private get apiUrl() { return `${getApiBase()}/api/clase`; }
  private get sesionApiUrl() { return `${getApiBase()}/api/clasesesion`; }

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

    const nuevaClase: ClaseDto = {
      id: Date.now(),
      nombre: dto.nombre.trim(),
      materiaId: dto.materiaId ? Number(dto.materiaId) : (matIds[0] || 101),
      materiaIds: matIds,
      docenteId: Number(dto.docenteId || 1),
      semestre: dto.semestre || '2026-2',
      descripcion: dto.descripcion?.trim() || '',
      carrera: dto.carrera || 'Ingeniería',
      estudianteIds: dto.estudianteIds || [1, 2]
    };

    const current = this.clasesSubject.value;
    const updated = [nuevaClase, ...current];
    this.clasesSubject.next(updated);
    this.saveStorage(this.STORAGE_CLASES, updated);

    return this.http.post<ClaseDto>(this.apiUrl, dto).pipe(
      tap((backendRes) => {
        if (backendRes && backendRes.id) {
          nuevaClase.id = backendRes.id;
          this.saveStorage(this.STORAGE_CLASES, this.clasesSubject.value);
        }
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

  getEstudiantesFromClase(claseId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${claseId}/estudiantes`).pipe(
      catchError(() => of([]))
    );
  }

  // Sesiones
  createClaseSesion(dto: CreateClaseSesionDto): Observable<ClaseSesionDto> {
    const nuevaSesion: ClaseSesionDto = {
      id: Date.now(),
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
      catchError(() => of({ id: Date.now(), ...dto }))
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
