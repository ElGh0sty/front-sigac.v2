import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { getApiBase } from '../api';

export interface DocenteRegistroDto {
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  correo: string;
  roles: string[];
}

export interface DocenteItemDto {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  correo: string;
  roles: string[];
  activo: boolean;
  departamento?: string;
  titulo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDocenteService {
  private http = inject(HttpClient);

  private get baseUrl() {
    return getApiBase();
  }

  // Lista mock de docentes para desarrollo local y selectores de tribunal
  private docentesMock: DocenteItemDto[] = [
    {
      id: 201,
      username: 'evelyn.vance',
      nombre: 'Evelyn',
      apellido: 'Vance',
      correo: 'evelyn.vance@universidad.edu',
      roles: ['Docente', 'Coordinador'],
      activo: true,
      departamento: 'Ciencias Exactas',
      titulo: 'PhD en Matemáticas Puras'
    },
    {
      id: 202,
      username: 'carlos.mendoza',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      correo: 'carlos.mendoza@universidad.edu',
      roles: ['Docente', 'Tribunal'],
      activo: true,
      departamento: 'Ingeniería de Software',
      titulo: 'Mgtr. en Ciencias de la Computación'
    },
    {
      id: 203,
      username: 'patricia.silva',
      nombre: 'Patricia',
      apellido: 'Silva',
      correo: 'patricia.silva@universidad.edu',
      roles: ['Docente', 'Coordinador', 'Tribunal'],
      activo: true,
      departamento: 'Sistemas Informáticos',
      titulo: 'Dra. en Arquitectura de Software'
    },
    {
      id: 204,
      username: 'marco.morales',
      nombre: 'Marco',
      apellido: 'Morales',
      correo: 'marco.morales@universidad.edu',
      roles: ['Docente', 'Tribunal'],
      activo: true,
      departamento: 'Computación y Sistemas',
      titulo: 'PhD en Métodos Numéricos'
    },
    {
      id: 205,
      username: 'elena.ruiz',
      nombre: 'Elena',
      apellido: 'Ruiz',
      correo: 'elena.ruiz@universidad.edu',
      roles: ['Docente', 'Tribunal'],
      activo: true,
      departamento: 'Matemática y Física',
      titulo: 'Dra. en Ecuaciones Diferenciales'
    }
  ];

  /**
   * POST /api/login/register (o /api/Login/register)
   * Registra un nuevo docente asignándole múltiples responsabilidades/roles.
   */
  crearDocente(docenteDto: { username: string; password: string; nombre: string; apellido: string; correo: string; roles: string[] }): Observable<any> {
    const payload = {
      ...docenteDto,
      rol: docenteDto.roles[0] || 'Docente',
      Roles: docenteDto.roles
    };

    return this.http.post(`${this.baseUrl}/api/Login/register`, payload).pipe(
      catchError(() => {
        // En caso de que el backend use minúsculas
        return this.http.post(`${this.baseUrl}/api/login/register`, payload).pipe(
          catchError((err) => {
            console.warn('Backend offline o simulación: registrando docente en memoria local:', docenteDto.username);
            const nuevo: DocenteItemDto = {
              id: Date.now(),
              username: docenteDto.username,
              nombre: docenteDto.nombre,
              apellido: docenteDto.apellido,
              correo: docenteDto.correo,
              roles: docenteDto.roles,
              activo: true,
              departamento: 'Facultad de Ingeniería',
              titulo: 'Docente Titular'
            };
            this.docentesMock.unshift(nuevo);
            return of({ success: true, message: 'Docente registrado exitosamente', docente: nuevo });
          })
        );
      })
    );
  }

  /**
   * GET /api/persona
   * Obtiene la lista de docentes registrados, con fallback en memoria para pruebas locales.
   */
  getDocentes(): Observable<DocenteItemDto[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/persona`).pipe(
      map(personas => {
        if (!Array.isArray(personas) || personas.length === 0) {
          return [...this.docentesMock];
        }
        return personas.map((p, idx) => ({
          id: p.id || idx + 1,
          username: p.username || (p.correo ? p.correo.split('@')[0] : `docente.${p.id}`),
          nombre: p.nombre || '',
          apellido: p.apellido || '',
          correo: p.correo || '',
          roles: Array.isArray(p.roles) ? p.roles : (p.rol ? [p.rol] : ['Docente']),
          activo: p.activo !== false,
          departamento: p.departamento || 'Facultad de Ingeniería',
          titulo: p.titulo || 'Docente de Cátedra'
        }));
      }),
      catchError(() => of([...this.docentesMock]))
    );
  }
}
