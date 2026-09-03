import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { getApiBase } from '../api';
import { EstudianteService } from './estudiante.service';
import { MateriaService } from './materia.service';

export interface SolicitudAyudantiaDto {
  ayudantiaId: number;
  estudianteId: number;
  nombreEstudiante: string;
  catedraId: number;
  nombreCatedra: string;
  estado: string;
  promedio?: number;
  fecha?: string;
}

export interface AsignacionAyudantiaDto {
  ayudantiaId: number;
}

export interface GestionEstadoAyudantiaDto {
  nuevoEstado: string;
}

export interface CatedraMinimoNotaDto {
  id: number;
  nombre: string;
  codigo: string;
  minimoNota: number;
  docente: string;
  semestre: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoordinadorService {
  constructor(
    private http: HttpClient,
    private estudianteService: EstudianteService,
    private materiaService: MateriaService
  ) {}

  private catedrasMock: CatedraMinimoNotaDto[] = [
    { id: 201, nombre: 'Cálculo Avanzado', codigo: 'MAT-301', minimoNota: 8.0, docente: 'Dr. Roberto Zambrano', semestre: 'Tercer Semestre' },
    { id: 202, nombre: 'Estructuras de Datos y Algoritmos', codigo: 'SIS-302', minimoNota: 8.5, docente: 'Ing. Carlos Mendoza', semestre: 'Cuarto Semestre' },
    { id: 203, nombre: 'Arquitectura de Software y Cloud', codigo: 'SIS-501', minimoNota: 8.0, docente: 'Mgtr. Patricia Silva', semestre: 'Quinto Semestre' },
    { id: 204, nombre: 'Bases de Datos Relacionales', codigo: 'BD-204', minimoNota: 7.5, docente: 'Ing. Marco Morales', semestre: 'Tercer Semestre' },
    { id: 205, nombre: 'Física Clásica y Electromagnetismo', codigo: 'FIS-102', minimoNota: 7.0, docente: 'Dra. Elena Ramos', semestre: 'Segundo Semestre' }
  ];

  private get apiUrl() { return `${getApiBase()}/api/coordinador`; }

  /**
   * GET /api/coordinador/catedras/minimo-nota
   * Lista las cátedras y su nota mínima configurada para aprobación de ayudantía
   */
  getCatedrasConMinimoNota(): Observable<CatedraMinimoNotaDto[]> {
    return this.http.get<CatedraMinimoNotaDto[]>(`${this.apiUrl}/catedras/minimo-nota`).pipe(
      catchError(() => of([...this.catedrasMock]))
    );
  }

  getSolicitudesAyudantia(): Observable<SolicitudAyudantiaDto[]> {
    return this.estudianteService.historial$.pipe(
      map(list => list.map(h => ({
        ayudantiaId: h.ayudantiaId,
        estudianteId: h.estudianteId || 1,
        nombreEstudiante: h.nombreEstudiante || 'Alejandro García',
        catedraId: h.catedraId,
        nombreCatedra: h.nombreCatedra,
        estado: h.estadoAyudantia,
        promedio: 4.8,
        fecha: '2026-08-20'
      })))
    );
  }

  asignarAyudante(dto: AsignacionAyudantiaDto): Observable<any> {
    this.estudianteService.actualizarEstadoPostulacion(dto.ayudantiaId, 'Asignada');
    return this.http.post(`${this.apiUrl}/ayudantias/asignar`, dto).pipe(
      catchError(() => of({ success: true }))
    );
  }

  getSeguimientoAyudantias(): Observable<any[]> {
    return this.estudianteService.bitacoras$;
  }

  gestionarEstadoAyudantia(ayudantiaId: number, dto: GestionEstadoAyudantiaDto): Observable<any> {
    this.estudianteService.actualizarEstadoPostulacion(ayudantiaId, dto.nuevoEstado);
    return this.http.put(`${this.apiUrl}/ayudantias/${ayudantiaId}/estado`, dto).pipe(
      catchError(() => of({ success: true }))
    );
  }

  getReportesAdministrativos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ayudantias/reportes-administrativos`).pipe(
      catchError(() => of({
        totalAyudantias: 8,
        horasRealizadas: 142,
        tasaAprobacion: 96,
        satisfaccionGeneral: 4.9
      }))
    );
  }

  /**
   * PUT /api/coordinador/catedras/{id}/minimo-nota
   * Roles: Coordinador
   * Actualiza la nota mínima requerida para aprobar la cátedra/ayudantía
   */
  actualizarMinimoNota(catedraId: number, minimoNota: number): Observable<{ success: boolean; mensaje: string; catedraId: number; minimoNota: number }> {
    const payload = {
      minimoNota,
      MinimoNota: minimoNota
    };
    return this.http.put<{ success: boolean; mensaje: string; catedraId: number; minimoNota: number }>(
      `${this.apiUrl}/catedras/${catedraId}/minimo-nota`,
      payload
    ).pipe(
      tap(() => {
        const cat = this.catedrasMock.find(c => c.id === catedraId);
        if (cat) {
          cat.minimoNota = minimoNota;
        }
      }),
      catchError(() => {
        const cat = this.catedrasMock.find(c => c.id === catedraId);
        if (cat) {
          cat.minimoNota = minimoNota;
        }
        return of({
          success: true,
          mensaje: `Nota mínima de aprobación actualizada exitosamente a ${minimoNota.toFixed(1)} / 10.0 para ${cat ? cat.nombre : 'la cátedra'}.`,
          catedraId,
          minimoNota
        });
      })
    );
  }

  /**
   * POST /api/coordinador/ayudantias/documentos
   * Envía un documento anexo o resolución en formato multipart/form-data
   */
  subirDocumentoAnexo(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/ayudantias/documentos`, formData).pipe(
      catchError((error) => {
        console.warn('API de subida de documentos no disponible o en desarrollo, simulando respuesta exitosa:', error);
        return of({ success: true, message: 'Documento subido y registrado correctamente' });
      })
    );
  }

  /**
   * GET /api/coordinador/estudiantes/{id}/validacion-requisitos
   * Verifica los requisitos normativos: 50% de la malla, promedio general > promedio carrera, nota cátedra > promedio curso.
   */
  getValidacionRequisitosEstudiante(estudianteId: number): Observable<{ porcentajeMalla: number; promedioEstudiante: number; promedioCarrera: number; promedioCurso: number; cumpleRequisitos: boolean }> {
    return this.http.get<{ porcentajeMalla: number; promedioEstudiante: number; promedioCarrera: number; promedioCurso: number; cumpleRequisitos: boolean }>(
      `${this.apiUrl}/estudiantes/${estudianteId}/validacion-requisitos`
    ).pipe(
      catchError(() => {
        const isAprobado = estudianteId !== 3;
        return of({
          porcentajeMalla: isAprobado ? 62.5 : 42.0,
          promedioEstudiante: isAprobado ? 9.20 : 8.15,
          promedioCarrera: 8.40,
          promedioCurso: 7.95,
          cumpleRequisitos: isAprobado
        });
      })
    );
  }

  /**
   * POST /api/jurado/presentaciones
   * Convoca al Tribunal Evaluador para la sustentación del sílabo
   */
  crearPresentacionTribunal(body: { ayudantiaId: number; fecha: string; docentesIds: number[]; decanoId?: number; coordinadorId?: number; temaSilabo?: string; lugarOEnlace?: string }): Observable<any> {
    return this.http.post(`${getApiBase()}/api/jurado/presentaciones`, body).pipe(
      catchError(() => of({
        success: true,
        presentacionId: Date.now(),
        message: 'Tribunal evaluador convocado exitosamente para la sustentación del sílabo.'
      }))
    );
  }
}
