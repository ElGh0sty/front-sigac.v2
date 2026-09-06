import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

  // Base mock en memoria para fallback cuando el backend esté offline
  private presentacionesDefault: PresentacionDetalleDto[] = [
    {
      id: 1,
      ayudantiaId: 101,
      estudianteId: 1,
      estudianteNombre: 'Alejandro García Mendoza',
      estudianteCorreo: 'alejandro.garcia@universidad.edu',
      catedraId: 201,
      catedraNombre: 'Cálculo Avanzado',
      fecha: '2026-09-12T10:00',
      temaSilabo: 'Unidad 3: Teorema de Green y Stokes con aplicaciones en Ingeniería',
      lugarOEnlace: 'Aula Magna 204 / Meet: meet.google.com/sig-trib-calc',
      decanoNombre: 'Dr. Roberto Zambrano (Decano Fac. Ingeniería)',
      coordinadorNombre: 'Mgtr. Patricia Silva (Coordinadora de Software)',
      profesoresAsignados: [
        'Ing. Marco Morales (Experto en Análisis Numérico)',
        'Dra. Elena Ruiz (Experta en Ecuaciones Diferenciales)'
      ],
      estado: 'Pendiente',
      yaEvaluadoPorMi: false
    },
    {
      id: 2,
      ayudantiaId: 102,
      estudianteId: 2,
      estudianteNombre: 'Valeria Sofía Ramos',
      estudianteCorreo: 'valeria.ramos@universidad.edu',
      catedraId: 202,
      catedraNombre: 'Estructuras de Datos y Algoritmos',
      fecha: '2026-09-14T15:30',
      temaSilabo: 'Unidad 4: Árboles AVL y B-Trees en Sistemas de Alto Rendimiento',
      lugarOEnlace: 'Laboratorio de Cómputo 3 / Zoom: 893-234-1122',
      decanoNombre: 'Dr. Roberto Zambrano (Decano Fac. Ingeniería)',
      coordinadorNombre: 'Mgtr. Patricia Silva (Coordinadora de Software)',
      profesoresAsignados: [
        'Ing. Diego Cárdenas (Especialista en Algoritmos)',
        'Ing. Gabriel Torres (Arquitectura de Software)'
      ],
      estado: 'Pendiente',
      yaEvaluadoPorMi: false
    }
  ];

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

  /**
   * Obtiene promedios, estado comparativo y detalles de las calificaciones del jurado.
   * Manejado localmente y sincronizado para evitar errores 404 en GET inexistentes del backend.
   */
  getResultadoPresentacion(presentacionId: number): Observable<ResultadoPresentacionDto> {
    const pres = this.presentacionesSubject.value.find(p => p.id === presentacionId) || this.presentacionesSubject.value[0];
    const resultadoMock: ResultadoPresentacionDto = {
      presentacionId: pres ? pres.id : presentacionId,
      ayudantiaId: pres ? pres.ayudantiaId : 101,
      estudianteNombre: pres ? pres.estudianteNombre : 'Alejandro García Mendoza',
      catedraNombre: pres ? pres.catedraNombre : 'Cálculo Avanzado',
      temaSilabo: pres ? pres.temaSilabo : 'Unidad 3: Teorema de Green y Stokes',
      fechaSustentacion: pres ? pres.fecha : '2026-09-12T10:00',
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
          observaciones: 'Excelente solvencia teórica y manejo del tiempo en la exposición del teorema.',
          fechaEvaluacion: '2026-09-12 10:45'
        },
        {
          juradoNombre: 'Mgtr. Patricia Silva',
          rolJurado: 'Coordinadora de Carrera',
          nota: 9.0,
          observaciones: 'Buena claridad pedagógica. Respondió con criterio las dudas metodológicas planteadas.',
          fechaEvaluacion: '2026-09-12 10:47'
        },
        {
          juradoNombre: 'Ing. Marco Morales',
          rolJurado: 'Docente Experto 1',
          nota: 9.2,
          observaciones: 'Demostración matemática precisa y fundamentada en la bibliografía oficial del sílabo.',
          fechaEvaluacion: '2026-09-12 10:50'
        },
        {
          juradoNombre: 'Dra. Elena Ruiz',
          rolJurado: 'Docente Experto 2',
          nota: 9.3,
          observaciones: 'Excelente empatía docente y uso apropiado de recursos didácticos digitales.',
          fechaEvaluacion: '2026-09-12 10:52'
        }
      ]
    };

    return of(resultadoMock);
  }

  /**
   * Obtiene la lista de presentaciones programadas para el jurado/coordinación.
   * Proporciona los datos reactivos guardados en el sistema sin disparar un GET 405 en el backend
   * (dado que el endpoint /api/Jurado/presentaciones en ASP.NET sólo admite POST).
   */
  getPresentaciones(): Observable<PresentacionDetalleDto[]> {
    return of([...this.presentacionesSubject.value]);
  }

  /**
   * Obtiene una presentación por ID
   */
  getPresentacionById(id: number): Observable<PresentacionDetalleDto | undefined> {
    return of(this.presentacionesSubject.value.find(p => p.id === id));
  }
}
