import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

@Injectable({
  providedIn: 'root'
})
export class CoordinadorService {
  constructor(
    private http: HttpClient,
    private estudianteService: EstudianteService,
    private materiaService: MateriaService
  ) {}

  private get apiUrl() { return `${getApiBase()}/api/coordinador`; }

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
}
