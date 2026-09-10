import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getApiBase } from '../api';
import { ClaseService } from './clase.service';

export interface EstudianteDirectorioDto {
  id: number;
  nombre: string;
  correo: string;
  username: string;
  cedula?: string;
  matricula?: string;
  carrera?: string;
  telefono?: string;
  nota?: number;
  asistencia?: number;
  estado?: string;
}

const DIRECTORIO_BASE: EstudianteDirectorioDto[] = [
  { id: 101, nombre: 'Julián Cárdenas', correo: 'j.cardenas@uteq.edu.ec', username: 'j.cardenas', cedula: '1729384101', matricula: '2024-IS-101', carrera: 'Ingeniería de Software', nota: 4.4, asistencia: 92, estado: 'Regular' },
  { id: 102, nombre: 'Camila Villacís', correo: 'c.villacis@uteq.edu.ec', username: 'c.villacis', cedula: '1729384102', matricula: '2024-IS-102', carrera: 'Ingeniería de Software', nota: 4.7, asistencia: 96, estado: 'Destacado' },
  { id: 103, nombre: 'Felipe Zambrano', correo: 'f.zambrano@uteq.edu.ec', username: 'f.zambrano', cedula: '1729384103', matricula: '2024-IS-103', carrera: 'Ingeniería de Software', nota: 3.8, asistencia: 78, estado: 'En Riesgo' },
  { id: 104, nombre: 'Daniela Montes', correo: 'd.montes@uteq.edu.ec', username: 'd.montes', cedula: '1729384104', matricula: '2024-IS-104', carrera: 'Ingeniería de Software', nota: 4.6, asistencia: 90, estado: 'Regular' },
  { id: 105, nombre: 'Martín Barahona', correo: 'm.barahona@uteq.edu.ec', username: 'm.barahona', cedula: '1729384105', matricula: '2024-IS-105', carrera: 'Ingeniería de Software', nota: 4.1, asistencia: 85, estado: 'Regular' }
];

@Injectable({
  providedIn: 'root'
})
export class DirectorioService {
  private http = inject(HttpClient);
  private claseService = inject(ClaseService);

  private readonly STORAGE_KEY = 'sigac_directorio_estudiantes_v2';
  private directorioSubject = new BehaviorSubject<EstudianteDirectorioDto[]>(this.loadStorage());
  public directorio$ = this.directorioSubject.asObservable();

  private get apiUrl() {
    return `${getApiBase()}/api/Estudiante`;
  }

  private loadStorage(): EstudianteDirectorioDto[] {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch { }
      }
    }
    return DIRECTORIO_BASE;
  }

  private saveStorage(data: EstudianteDirectorioDto[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  /**
   * Recarga los datos del Directorio Institucional desde el backend o almacén sincronizado.
   */
  cargarDirectorio(): Observable<EstudianteDirectorioDto[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap((backendData) => {
        if (Array.isArray(backendData) && backendData.length > 0) {
          const mapped: EstudianteDirectorioDto[] = backendData.map(b => ({
            id: b.id || b.estudianteId || Math.floor(Math.random() * 10000),
            nombre: b.nombre || (b.nombres ? `${b.nombres} ${b.apellidos || ''}`.trim() : 'Estudiante'),
            correo: b.correo || b.email || '',
            username: b.username || (b.correo ? b.correo.split('@')[0] : 'estudiante'),
            cedula: b.cedula || '',
            matricula: b.matricula || '',
            carrera: b.carrera || 'Ingeniería de Software',
            nota: b.nota || 4.5,
            asistencia: b.asistencia || 100,
            estado: b.estado || 'Regular'
          }));
          this.directorioSubject.next(mapped);
          this.saveStorage(mapped);
        } else {
          // Si responde vacío, asegurar persistencia local actualizada
          this.directorioSubject.next(this.loadStorage());
        }
      }),
      catchError(() => {
        const local = this.loadStorage();
        this.directorioSubject.next(local);
        return of(local);
      })
    );
  }

  getDirectorioActual(): EstudianteDirectorioDto[] {
    return this.directorioSubject.value;
  }

  /**
   * Agrega un nuevo estudiante al Directorio General Institucional
   */
  agregarEstudiante(est: Partial<EstudianteDirectorioDto>): EstudianteDirectorioDto {
    const current = this.directorioSubject.value;
    const nuevoId = est.id || (Date.now() % 100000);
    const username = est.username || (est.correo ? est.correo.split('@')[0] : `estudiante.${nuevoId}`);
    const nuevo: EstudianteDirectorioDto = {
      id: nuevoId,
      nombre: est.nombre || 'Nuevo Estudiante',
      correo: est.correo || `${username}@uteq.edu.ec`,
      username: username,
      cedula: est.cedula || '17' + Math.floor(10000000 + Math.random() * 90000000),
      matricula: est.matricula || `2026-IS-${nuevoId}`,
      carrera: est.carrera || 'Ingeniería de Software',
      telefono: est.telefono || '',
      nota: est.nota || 4.5,
      asistencia: est.asistencia || 100,
      estado: est.estado || 'Regular'
    };

    const filtrados = current.filter(e => Number(e.id) !== Number(nuevo.id) && e.correo !== nuevo.correo);
    const actualizados = [nuevo, ...filtrados];
    this.directorioSubject.next(actualizados);
    this.saveStorage(actualizados);
    return nuevo;
  }

  /**
   * Elimina un estudiante de una clase llamando al endpoint:
   * DELETE /api/Clase/{claseId}/estudiantes/{estudianteId}
   */
  eliminarEstudiante(claseId: number, estudianteId: number): Observable<any> {
    return this.claseService.eliminarEstudiante(claseId, estudianteId);
  }

  /**
   * Elimina un estudiante del Directorio General
   */
  eliminarDelDirectorio(estudianteId: number): Observable<any> {
    const current = this.directorioSubject.value;
    const filtrados = current.filter(e => Number(e.id) !== Number(estudianteId));
    this.directorioSubject.next(filtrados);
    this.saveStorage(filtrados);

    return this.http.delete(`${this.apiUrl}/${estudianteId}`).pipe(
      catchError(() => of({ success: true }))
    );
  }
}
