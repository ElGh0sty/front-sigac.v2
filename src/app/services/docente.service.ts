import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { getApiBase } from '../api';

export interface EvaluacionDto {
  id?: number;
  nombre: string;
  catedraId: number;
  esDiagnostica: boolean;
  adaptadaConIA: boolean;
  descripcionIA: string;
}

export interface CronogramaActividadDto {
  id: number;
  catedraId: number;
  descripcion: string;
  fechaPrevista: string;
  fechaReal?: string;
}

export interface ActividadAyudantiaDto {
  id: number;
  ayudantiaId: number;
  descripcion: string;
  fechaPlanificada: string;
  completada: boolean;
  tema?: string;
  semana?: number;
  directrices?: string;
  recursosSugeridos?: string;
}

export interface MonitoreoAyudantiaDto {
  ayudantiaId: number;
  nombreAyudante: string;
  nombreCatedra?: string;
  planificacion: ActividadAyudantiaDto[];
  bitacoras: BitacoraDto[];
}

export interface BitacoraDto {
  id: number;
  fecha: string;
  actividadesRealizadas: string;
  evidenciaUrl: string;
}

export interface HorarioOcupadoAlumnoDto {
  id?: number;
  claseId: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  materiaOcupada: string;
  tipo: string;
  carrera?: string;
}

const PLANIFICACIONES_DEFAULT: Record<number, ActividadAyudantiaDto[]> = {};

const OCUPACIONES_DEFAULT: HorarioOcupadoAlumnoDto[] = [];

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private STORAGE_PLANIFICACION = 'sigac_docente_planificaciones_v2';
  private STORAGE_OCUPACIONES = 'sigac_docente_ocupaciones_alumnos_v2';

  private planificacionesSubject = new BehaviorSubject<Record<number, ActividadAyudantiaDto[]>>(
    this.loadStorage(this.STORAGE_PLANIFICACION, PLANIFICACIONES_DEFAULT)
  );
  public planificaciones$ = this.planificacionesSubject.asObservable();

  private ocupacionesSubject = new BehaviorSubject<HorarioOcupadoAlumnoDto[]>(
    this.loadStorage(this.STORAGE_OCUPACIONES, OCUPACIONES_DEFAULT)
  );
  public ocupaciones$ = this.ocupacionesSubject.asObservable();

  constructor(private http: HttpClient) {}

  private get apiUrl() { return `${getApiBase()}/api/Docente`; }

  /**
   * GET /api/Docente/clases o GET /api/Clase/docente/{id}
   * Consume la API para obtener las clases y materias asignadas al docente.
   */
  cargarClasesDocente(docenteId?: number): Observable<any[]> {
    const docId = docenteId || 102;
    const urlDocenteClases = `${this.apiUrl}/clases`;
    const urlClaseDocente = `${getApiBase()}/api/Clase/docente/${docId}`;
    const urlClaseDocenteLower = `${getApiBase()}/api/clase/docente/${docId}`;

    return this.http.get<any[]>(urlDocenteClases).pipe(
      catchError(() => this.http.get<any[]>(urlClaseDocente)),
      catchError(() => this.http.get<any[]>(urlClaseDocenteLower)),
      catchError(() => of([]))
    );
  }

  private loadStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (e) {
      console.warn(`Error reading ${key}`, e);
    }
    return fallback;
  }

  private saveStorage<T>(key: string, data: T) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn(`Error saving ${key}`, e);
      }
    }
  }

  registrarEvaluacionDiagnostica(catedraId: number, dto: EvaluacionDto): Observable<EvaluacionDto> {
    return this.http.post<EvaluacionDto>(`${this.apiUrl}/catedras/${catedraId}/evaluacion-diagnostica`, dto).pipe(
      catchError(() => of({ id: Math.floor((Date.now() / 1000) % 2000000000) + 1, ...dto }))
    );
  }

  reprogramarCronograma(catedraId: number, dto: CronogramaActividadDto): Observable<CronogramaActividadDto> {
    return this.http.put<CronogramaActividadDto>(`${this.apiUrl}/catedras/${catedraId}/cronograma`, dto).pipe(
      catchError(() => of(dto))
    );
  }

  planificarActividadAyudantia(ayudantiaId: number, dto: ActividadAyudantiaDto): Observable<ActividadAyudantiaDto> {
    const itemGuardado: ActividadAyudantiaDto = {
      ...dto,
      id: dto.id || (Math.floor((Date.now() / 1000) % 2000000000) + 1),
      ayudantiaId: Number(ayudantiaId)
    };

    const currentMap = { ...this.planificacionesSubject.value };
    const listaActual = currentMap[ayudantiaId] || [];
    currentMap[ayudantiaId] = [itemGuardado, ...listaActual];
    this.planificacionesSubject.next(currentMap);
    this.saveStorage(this.STORAGE_PLANIFICACION, currentMap);

    return this.http.post<ActividadAyudantiaDto>(`${this.apiUrl}/ayudantias/${ayudantiaId}/planificacion`, dto).pipe(
      tap((res) => {
        if (res && res.id) {
          itemGuardado.id = res.id;
          this.saveStorage(this.STORAGE_PLANIFICACION, this.planificacionesSubject.value);
        }
      }),
      catchError(() => of(itemGuardado))
    );
  }

  toggleActividadPlanificada(ayudantiaId: number, actividadId: number): Observable<boolean> {
    const currentMap = { ...this.planificacionesSubject.value };
    const lista = currentMap[ayudantiaId] || [];
    currentMap[ayudantiaId] = lista.map(a => {
      if (a.id === actividadId) {
        return { ...a, completada: !a.completada };
      }
      return a;
    });
    this.planificacionesSubject.next(currentMap);
    this.saveStorage(this.STORAGE_PLANIFICACION, currentMap);
    return of(true);
  }

  eliminarActividadPlanificada(ayudantiaId: number, actividadId: number): Observable<boolean> {
    const currentMap = { ...this.planificacionesSubject.value };
    const lista = currentMap[ayudantiaId] || [];
    currentMap[ayudantiaId] = lista.filter(a => a.id !== actividadId);
    this.planificacionesSubject.next(currentMap);
    this.saveStorage(this.STORAGE_PLANIFICACION, currentMap);
    return of(true);
  }

  toggleActividadCompletada(ayudantiaId: number, actividadId: number): Observable<boolean> {
    const currentMap = { ...this.planificacionesSubject.value };
    const lista = currentMap[ayudantiaId] || PLANIFICACIONES_DEFAULT[ayudantiaId] || [];
    const item = lista.find(a => a.id === actividadId);
    if (item) {
      item.completada = !item.completada;
      currentMap[ayudantiaId] = [...lista];
      this.planificacionesSubject.next(currentMap);
      this.saveStorage(this.STORAGE_PLANIFICACION, currentMap);
      return of(true);
    }
    return of(false);
  }

  getPlanificacionAyudantia(ayudantiaId: number): Observable<ActividadAyudantiaDto[]> {
    return this.planificaciones$.pipe(
      map(mapa => mapa[ayudantiaId] || PLANIFICACIONES_DEFAULT[ayudantiaId] || [])
    );
  }

  monitorearAyudantia(ayudantiaId: number): Observable<MonitoreoAyudantiaDto> {
    const planLocal = this.planificacionesSubject.value[ayudantiaId] || [];

    return this.http.get<MonitoreoAyudantiaDto>(`${this.apiUrl}/ayudantias/${ayudantiaId}/monitoreo`).pipe(
      map(backendRes => {
        return {
          ayudantiaId,
          nombreAyudante: backendRes?.nombreAyudante || 'Ayudante de Cátedra',
          planificacion: backendRes?.planificacion || planLocal,
          bitacoras: backendRes?.bitacoras || []
        };
      }),
      catchError(() => of({
        ayudantiaId,
        nombreAyudante: 'Ayudante de Cátedra',
        planificacion: planLocal,
        bitacoras: []
      }))
    );
  }

  // ==================== OCUPACIÓN DE HORARIOS DE ALUMNOS ====================

  getHorariosOcupadosAlumnos(claseId?: number): Observable<HorarioOcupadoAlumnoDto[]> {
    return this.ocupaciones$.pipe(
      map(list => {
        if (!claseId) return list;
        return list.filter(o => Number(o.claseId) === Number(claseId));
      })
    );
  }

  /**
   * Valida si los alumnos tienen conflicto de horario en el día y rango de horas especificado.
   * Retorna el item en conflicto si existe, o null si el horario está completamente libre.
   */
  verificarConflictoHorario(claseId: number, dia: string, horaInicio: string, horaFin: string): HorarioOcupadoAlumnoDto | null {
    const list = this.ocupacionesSubject.value.filter(o => Number(o.claseId) === Number(claseId));

    const parseHora = (h: string) => {
      const [hh, mm] = h.split(':').map(Number);
      return (hh || 0) * 60 + (mm || 0);
    };

    const nuevoInicio = parseHora(horaInicio);
    const nuevoFin = parseHora(horaFin);

    for (const item of list) {
      if (item.dia.toLowerCase() === dia.toLowerCase()) {
        const itemInicio = parseHora(item.horaInicio);
        const itemFin = parseHora(item.horaFin);

        // Cruce de intervalos: max(inicio1, inicio2) < min(fin1, fin2)
        if (Math.max(nuevoInicio, itemInicio) < Math.min(nuevoFin, itemFin)) {
          return item;
        }
      }
    }

    return null;
  }
}

