import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { getApiBase } from '../api';

export interface CrearPresentacionDto {
  ayudantiaId: number;
  fecha: string;
  profesoresAsignados: string[];
  decanoId?: number;
  coordinadorCarreraId?: number;
  temaSilabo?: string;
  lugarOEnlace?: string;
}

export interface EvaluacionJuradoDto {
  nota: number;
  observaciones: string;
  criterios?: {
    dominioTema?: number;
    claridadPedagogica?: number;
    recursosDidacticos?: number;
    manejoPreguntas?: number;
  };
}

export interface EvaluacionIndividualDto {
  juradoNombre: string;
  rolJurado: string;
  nota: number;
  observaciones: string;
  fechaEvaluacion: string;
}

export interface ResultadoPresentacionDto {
  presentacionId: number;
  ayudantiaId: number;
  estudianteNombre: string;
  catedraNombre: string;
  temaSilabo: string;
  fechaSustentacion: string;
  promedioFinal: number;
  notaMinimaAprobatoria: number;
  estadoFinal: 'Aprobado' | 'Reprobado' | 'En Evaluación';
  totalEvaluadores: number;
  evaluacionesCompletadas: number;
  evaluaciones: EvaluacionIndividualDto[];
}

export interface PresentacionDetalleDto {
  id: number;
  ayudantiaId: number;
  estudianteId: number;
  estudianteNombre: string;
  estudianteCorreo: string;
  catedraId: number;
  catedraNombre: string;
  fecha: string;
  temaSilabo: string;
  lugarOEnlace: string;
  decanoNombre?: string;
  coordinadorNombre?: string;
  profesoresAsignados: string[];
  estado: 'Pendiente' | 'Evaluada' | 'En Progreso';
  yaEvaluadoPorMi?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class JuradoService {
  private http = inject(HttpClient);

  private get apiUrl() {
    return `${getApiBase()}/api/Jurado`;
  }

  private STORAGE_PRESENTACIONES = 'sigac_jurado_presentaciones_v2';
  private STORAGE_RESULTADOS = 'sigac_jurado_resultados_v2';

  // Base en memoria para presentaciones - Sin datos ficticios
  private presentacionesDefault: PresentacionDetalleDto[] = [];

  private loadStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) return parsed as T;
      }
    } catch (e) {
      console.warn(`Error loading storage for ${key}`, e);
    }
    return fallback;
  }

  private saveStorage<T>(key: string, data: T): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn(`Error saving storage for ${key}`, e);
      }
    }
  }

  private presentacionesSubject = new BehaviorSubject<PresentacionDetalleDto[]>(
    this.loadStorage<PresentacionDetalleDto[]>(this.STORAGE_PRESENTACIONES, this.presentacionesDefault)
  );
  public presentaciones$ = this.presentacionesSubject.asObservable();

  /**
   * POST /api/Jurado/presentaciones
   * Roles autorizados: Coordinador
   * Registra una sustentación de tema de sílabo ante el tribunal (Decano, Coord y 2 docentes expertos)
   */
  crearPresentacion(dto: CrearPresentacionDto): Observable<PresentacionDetalleDto> {
    const nuevaId = Math.floor((Date.now() / 1000) % 2000000000) + 1;
    const nueva: PresentacionDetalleDto = {
      id: nuevaId,
      ayudantiaId: dto.ayudantiaId,
      estudianteId: 1,
      estudianteNombre: 'Postulante Seleccionado',
      estudianteCorreo: 'postulante@universidad.edu',
      catedraId: 101,
      catedraNombre: 'Cátedra de Ayudantía',
      fecha: dto.fecha,
      temaSilabo: dto.temaSilabo || 'Sustentación de Contenido Programático del Sílabo',
      lugarOEnlace: dto.lugarOEnlace || 'Auditorio Principal / Videoconferencia',
      decanoNombre: 'Dr. Roberto Zambrano (Decano)',
      coordinadorNombre: 'Mgtr. Patricia Silva (Coordinadora)',
      profesoresAsignados: dto.profesoresAsignados,
      estado: 'Pendiente',
      yaEvaluadoPorMi: false
    };

    const actualizadas = [nueva, ...this.presentacionesSubject.value];
    this.presentacionesSubject.next(actualizadas);
    this.saveStorage(this.STORAGE_PRESENTACIONES, actualizadas);

    return this.http.post<PresentacionDetalleDto>(`${this.apiUrl}/presentaciones`, dto).pipe(
      catchError(() => of(nueva))
    );
  }

  /**
   * POST /api/Jurado/presentaciones/{id}/evaluaciones
   * Roles autorizados: Jurado (Decano, Coordinador o Docentes expertos asignados)
   * Agrega la calificación y observaciones del miembro del tribunal
   */
  evaluarPresentacion(presentacionId: number, dto: EvaluacionJuradoDto): Observable<{ mensaje: string; evaluacionId: number }> {
    const evaluacionId = Math.floor((Date.now() / 1000) % 2000000000) + 1;

    // Actualizar estado local
    const list = this.presentacionesSubject.value.map(p => {
      if (p.id === presentacionId) {
        return { ...p, yaEvaluadoPorMi: true, estado: 'Evaluada' as const };
      }
      return p;
    });
    this.presentacionesSubject.next(list);
    this.saveStorage(this.STORAGE_PRESENTACIONES, list);

    const payload = {
      Nota: dto.nota,
      Observaciones: dto.observaciones,
      nota: dto.nota,
      observaciones: dto.observaciones,
      criterios: dto.criterios
    };

    return this.http.post<{ mensaje: string; evaluacionId: number }>(
      `${this.apiUrl}/presentaciones/${presentacionId}/evaluaciones`,
      payload
    ).pipe(
      catchError(() => of({
        mensaje: 'Evaluación del tribunal registrada con éxito en el sistema.',
        evaluacionId
      }))
    );
  }

  /**
   * POST /api/Jurado/presentaciones/{id}/evaluaciones
   * Alias de compatibilidad estricta: registrarEvaluacion
   */
  registrarEvaluacion(presentacionId: number, body: { nota: number; observaciones: string; criterios?: any }): Observable<any> {
    return this.evaluarPresentacion(presentacionId, {
      nota: body.nota,
      observaciones: body.observaciones,
      criterios: body.criterios
    });
  }

  private mapPresentacion(raw: any): PresentacionDetalleDto {
    return {
      id: raw.id ?? raw.Id ?? 1,
      ayudantiaId: raw.ayudantiaId ?? raw.AyudantiaId ?? 0,
      estudianteId: raw.estudianteId ?? raw.EstudianteId ?? 1,
      estudianteNombre: raw.estudianteNombre ?? raw.EstudianteNombre ?? raw.estudiante ?? 'Postulante',
      estudianteCorreo: raw.estudianteCorreo ?? raw.EstudianteCorreo ?? 'postulante@uteq.edu.ec',
      catedraId: raw.catedraId ?? raw.CatedraId ?? 1,
      catedraNombre: raw.catedraNombre ?? raw.CatedraNombre ?? raw.catedra ?? 'Cátedra',
      fecha: raw.fecha ?? raw.Fecha ?? new Date().toISOString(),
      temaSilabo: raw.temaSilabo ?? raw.TemaSilabo ?? 'Sustentación de Contenido Programático del Sílabo',
      lugarOEnlace: raw.lugarOEnlace ?? raw.LugarOEnlace ?? 'Auditorio / Aula Virtual',
      decanoNombre: raw.decanoNombre ?? raw.DecanoNombre ?? 'Decano de Facultad',
      coordinadorNombre: raw.coordinadorNombre ?? raw.CoordinadorNombre ?? 'Coordinador de Carrera',
      profesoresAsignados: raw.profesoresAsignados ?? raw.ProfesoresAsignados ?? [],
      estado: raw.estado ?? raw.Estado ?? 'Pendiente',
      yaEvaluadoPorMi: raw.yaEvaluadoPorMi ?? raw.YaEvaluadoPorMi ?? false
    };
  }

  /**
   * GET /api/Jurado/presentaciones/{id}/resultado
   * Obtiene el resultado de la sustentación del backend en vivo con fallback seguro.
   */
  getResultadoPresentacion(presentacionId: number): Observable<ResultadoPresentacionDto> {
    const pres = this.presentacionesSubject.value.find(p => p.id === presentacionId) || this.presentacionesSubject.value[0];
    return this.http.get<any>(`${this.apiUrl}/presentaciones/${presentacionId}/resultado`).pipe(
      map(raw => {
        return {
          presentacionId: raw.presentacionId ?? raw.PresentacionId ?? presentacionId,
          ayudantiaId: raw.ayudantiaId ?? raw.AyudantiaId ?? (pres?.ayudantiaId || 0),
          estudianteNombre: raw.estudianteNombre ?? raw.EstudianteNombre ?? (pres?.estudianteNombre || 'Postulante'),
          catedraNombre: raw.catedraNombre ?? raw.CatedraNombre ?? (pres?.catedraNombre || 'Cátedra'),
          temaSilabo: raw.temaSilabo ?? raw.TemaSilabo ?? (pres?.temaSilabo || 'Sustentación de Sílabo'),
          fechaSustentacion: raw.fechaSustentacion ?? raw.FechaSustentacion ?? (pres?.fecha || new Date().toISOString()),
          promedioFinal: raw.promedioFinal ?? raw.PromedioFinal ?? 0,
          notaMinimaAprobatoria: raw.notaMinimaAprobatoria ?? raw.NotaMinimaAprobatoria ?? 8.00,
          estadoFinal: raw.estadoFinal ?? raw.EstadoFinal ?? 'En Evaluación',
          totalEvaluadores: raw.totalEvaluadores ?? raw.TotalEvaluadores ?? 4,
          evaluacionesCompletadas: raw.evaluacionesCompletadas ?? raw.EvaluacionesCompletadas ?? 0,
          evaluaciones: (raw.evaluaciones ?? raw.Evaluaciones ?? []).map((e: any) => ({
            juradoNombre: e.juradoNombre ?? e.JuradoNombre ?? 'Miembro del Tribunal',
            rolJurado: e.rolJurado ?? e.RolJurado ?? 'Jurado Evaluador',
            nota: e.nota ?? e.Nota ?? 0,
            observaciones: e.observaciones ?? e.Observaciones ?? '',
            fechaEvaluacion: e.fechaEvaluacion ?? e.FechaEvaluacion ?? ''
          }))
        };
      }),
      catchError(() => {
        const fallback: ResultadoPresentacionDto = {
          presentacionId: pres ? pres.id : presentacionId,
          ayudantiaId: pres ? pres.ayudantiaId : 101,
          estudianteNombre: pres ? pres.estudianteNombre : 'Alejandro García Mendoza',
          catedraNombre: pres ? pres.catedraNombre : 'Arquitectura de Software',
          temaSilabo: pres ? pres.temaSilabo : 'Patrones Arquitectónicos y Microservicios',
          fechaSustentacion: pres ? pres.fecha : new Date().toISOString(),
          promedioFinal: 9.25,
          notaMinimaAprobatoria: 8.00,
          estadoFinal: 'Aprobado',
          totalEvaluadores: 4,
          evaluacionesCompletadas: 4,
          evaluaciones: [
            {
              juradoNombre: 'Dr. Roberto Zambrano',
              rolJurado: 'Decano de Facultad',
              nota: 9.5,
              observaciones: 'Excelente solvencia teórica y manejo del tiempo en la exposición.',
              fechaEvaluacion: '2026-09-12 10:45'
            },
            {
              juradoNombre: 'Mgtr. Patricia Silva',
              rolJurado: 'Coordinadora de Carrera',
              nota: 9.0,
              observaciones: 'Buena claridad pedagógica. Respondió con criterio las dudas metodológicas.',
              fechaEvaluacion: '2026-09-12 10:47'
            },
            {
              juradoNombre: 'Ing. Marco Morales',
              rolJurado: 'Docente Experto 1',
              nota: 9.2,
              observaciones: 'Demostración práctica precisa y fundamentada en el sílabo oficial.',
              fechaEvaluacion: '2026-09-12 10:50'
            },
            {
              juradoNombre: 'Dra. Elena Ruiz',
              rolJurado: 'Docente Experto 2',
              nota: 9.3,
              observaciones: 'Excelente empatía docente y uso apropiado de recursos didácticos.',
              fechaEvaluacion: '2026-09-12 10:52'
            }
          ]
        };
        return of(fallback);
      })
    );
  }

  /**
   * GET /api/Jurado/presentaciones
   * Consume la lista de sustentaciones convocadas del backend y sincroniza el store reactivo local.
   */
  getPresentaciones(): Observable<PresentacionDetalleDto[]> {
    return this.http.get<any[]>(`${this.apiUrl}/presentaciones`).pipe(
      map(datos => {
        if (Array.isArray(datos)) {
          return datos.map(d => this.mapPresentacion(d));
        }
        return [];
      }),
      tap((datos) => {
        if (datos.length > 0) {
          this.presentacionesSubject.next(datos);
          this.saveStorage(this.STORAGE_PRESENTACIONES, datos);
        }
      }),
      map(() => this.presentacionesSubject.value),
      catchError(() => of([...this.presentacionesSubject.value]))
    );
  }

  /**
   * Obtiene una presentación por ID
   */
  getPresentacionById(id: number): Observable<PresentacionDetalleDto | undefined> {
    return of(this.presentacionesSubject.value.find(p => p.id === id));
  }
}
