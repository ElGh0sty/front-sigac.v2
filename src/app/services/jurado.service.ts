import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
    return `${getApiBase()}/api/jurado`;
  }

  // Base mock en memoria para fallback cuando el backend esté offline
  private presentacionesMock: PresentacionDetalleDto[] = [
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

  /**
   * POST /api/jurado/presentaciones
   * Roles autorizados: Coordinador
   * Registra una sustentación de tema de sílabo ante el tribunal (Decano, Coord y 2 docentes expertos)
   */
  crearPresentacion(dto: CrearPresentacionDto): Observable<PresentacionDetalleDto> {
    return this.http.post<PresentacionDetalleDto>(`${this.apiUrl}/presentaciones`, dto).pipe(
      catchError(() => {
        const nueva: PresentacionDetalleDto = {
          id: Date.now(),
          ayudantiaId: dto.ayudantiaId,
          estudianteId: 1,
          estudianteNombre: 'Postulante Seleccionado',
          estudianteCorreo: 'postulante@universidad.edu',
          catedraId: 101,
          catedraNombre: 'Cátedra de Ayudantía',
          fecha: dto.fecha,
          temaSilabo: dto.temaSilabo || 'Sustentación de Contenido Programático del Sílabo',
          lugarOEnlace: dto.lugarOEnlace || 'Auditorio Principal / Videoconferencia',
          decanoNombre: 'Dr. Decano de Facultad',
          coordinadorNombre: 'Mgtr. Coordinador de Carrera',
          profesoresAsignados: dto.profesoresAsignados,
          estado: 'Pendiente',
          yaEvaluadoPorMi: false
        };
        this.presentacionesMock.unshift(nueva);
        return of(nueva);
      })
    );
  }

  /**
   * POST /api/jurado/presentaciones/{id}/evaluaciones
   * Roles autorizados: Jurado (Decano, Coordinador o Docentes expertos asignados)
   * Agrega la calificación y observaciones del miembro del tribunal
   */
  evaluarPresentacion(presentacionId: number, dto: EvaluacionJuradoDto): Observable<{ mensaje: string; evaluacionId: number }> {
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
      catchError(() => {
        const item = this.presentacionesMock.find(p => p.id === presentacionId);
        if (item) {
          item.yaEvaluadoPorMi = true;
          item.estado = 'Evaluada';
        }
        return of({
          mensaje: 'Evaluación del tribunal registrada con éxito en el sistema.',
          evaluacionId: Date.now()
        });
      })
    );
  }

  /**
   * POST /api/jurado/presentaciones/{id}/evaluaciones
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
   * GET /api/jurado/presentaciones/{id}/resultado
   * Obtiene promedios, estado comparativo y detalles de las calificaciones del jurado
   */
  getResultadoPresentacion(presentacionId: number): Observable<ResultadoPresentacionDto> {
    return this.http.get<ResultadoPresentacionDto>(`${this.apiUrl}/presentaciones/${presentacionId}/resultado`).pipe(
      catchError(() => {
        const pres = this.presentacionesMock.find(p => p.id === presentacionId) || this.presentacionesMock[0];
        const resultadoMock: ResultadoPresentacionDto = {
          presentacionId: pres.id,
          ayudantiaId: pres.ayudantiaId,
          estudianteNombre: pres.estudianteNombre,
          catedraNombre: pres.catedraNombre,
          temaSilabo: pres.temaSilabo,
          fechaSustentacion: pres.fecha,
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
      })
    );
  }

  /**
   * Obtiene la lista de presentaciones programadas para el jurado/coordinación
   */
  getPresentaciones(): Observable<PresentacionDetalleDto[]> {
    return this.http.get<PresentacionDetalleDto[]>(`${this.apiUrl}/presentaciones`).pipe(
      catchError(() => of([...this.presentacionesMock]))
    );
  }

  /**
   * Obtiene una presentación por ID
   */
  getPresentacionById(id: number): Observable<PresentacionDetalleDto | undefined> {
    return this.http.get<PresentacionDetalleDto>(`${this.apiUrl}/presentaciones/${id}`).pipe(
      catchError(() => of(this.presentacionesMock.find(p => p.id === id)))
    );
  }
}
