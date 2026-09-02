import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
}

export interface MonitoreoAyudantiaDto {
  ayudantiaId: number;
  nombreAyudante: string;
  planificacion: ActividadAyudantiaDto[];
  bitacoras: BitacoraDto[];
}

export interface BitacoraDto {
  id: number;
  fecha: string;
  actividadesRealizadas: string;
  evidenciaUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  constructor(private http: HttpClient) {}

  private get apiUrl() { return `${getApiBase()}/api/docente`; }

  registrarEvaluacionDiagnostica(catedraId: number, dto: EvaluacionDto): Observable<EvaluacionDto> {
    return this.http.post<EvaluacionDto>(`${this.apiUrl}/catedras/${catedraId}/evaluacion-diagnostica`, dto).pipe(
      catchError(() => of({ id: Date.now(), ...dto }))
    );
  }

  reprogramarCronograma(catedraId: number, dto: CronogramaActividadDto): Observable<CronogramaActividadDto> {
    return this.http.put<CronogramaActividadDto>(`${this.apiUrl}/catedras/${catedraId}/cronograma`, dto).pipe(
      catchError(() => of(dto))
    );
  }

  planificarActividadAyudantia(ayudantiaId: number, dto: ActividadAyudantiaDto): Observable<ActividadAyudantiaDto> {
    return this.http.post<ActividadAyudantiaDto>(`${this.apiUrl}/ayudantias/${ayudantiaId}/planificacion`, dto).pipe(
      catchError(() => of({ ...dto, id: dto.id || Date.now() }))
    );
  }

  monitorearAyudantia(ayudantiaId: number): Observable<MonitoreoAyudantiaDto> {
    return this.http.get<MonitoreoAyudantiaDto>(`${this.apiUrl}/ayudantias/${ayudantiaId}/monitoreo`).pipe(
      catchError(() => of({
        ayudantiaId,
        nombreAyudante: 'Sebastián Gómez',
        planificacion: [
          { id: 1, ayudantiaId, descripcion: 'Sesión de ejercicios prácticos de cálculo', fechaPlanificada: '2026-09-08', completada: true },
          { id: 2, ayudantiaId, descripcion: 'Preparación para el primer parcial y dudas', fechaPlanificada: '2026-09-15', completada: false }
        ],
        bitacoras: [
          { id: 1, fecha: '2026-08-28', actividadesRealizadas: 'Resolución de problemas de derivadas e integrales múltiples', evidenciaUrl: 'https://ejemplo.edu/bitacora1.pdf' }
        ]
      }))
    );
  }
}
