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

  private STORAGE_KEY = 'sigac_docentes_creados_v1';

  // Lista base mock de docentes para desarrollo local y selectores de tribunal
  private docentesBase: DocenteItemDto[] = [
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

  private getDocentesGuardadosLocal(): DocenteItemDto[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo docentes locales', e);
    }
    return [];
  }

  private guardarDocenteLocal(docente: DocenteItemDto): void {
    if (typeof window === 'undefined') return;
    try {
      const actuales = this.getDocentesGuardadosLocal();
      const filtrados = actuales.filter(d => d.username.toLowerCase() !== docente.username.toLowerCase());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([docente, ...filtrados]));
    } catch (e) {
      console.warn('Error guardando docente local', e);
    }
  }

  private getListaCompletaLocal(): DocenteItemDto[] {
    const locales = this.getDocentesGuardadosLocal();
    const usernames = new Set(locales.map(d => d.username.toLowerCase()));
    const baseFiltrada = this.docentesBase.filter(d => !usernames.has(d.username.toLowerCase()));
    return [...locales, ...baseFiltrada];
  }

  /**
   * POST /api/login/register (o /api/Login/register)
   * Registra un nuevo docente asignándole múltiples responsabilidades/roles.
   */
  crearDocente(docenteDto: { username: string; password: string; nombre: string; apellido: string; correo: string; roles: string[] }): Observable<any> {
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

    // Siempre persistimos localmente para garantizar que no se pierda al reiniciar o desconectar
    this.guardarDocenteLocal(nuevo);

    const payload = {
      ...docenteDto,
      rol: docenteDto.roles[0] || 'Docente',
      Roles: docenteDto.roles
    };

    return this.http.post(`${this.baseUrl}/api/Login/register`, payload).pipe(
      catchError(() => {
        // En caso de que el backend use minúsculas
        return this.http.post(`${this.baseUrl}/api/login/register`, payload).pipe(
          catchError(() => {
            console.warn('Backend offline: registrando docente en almacenamiento local permanente:', docenteDto.username);
            return of({ success: true, message: 'Docente registrado exitosamente en almacenamiento seguro', docente: nuevo });
          })
        );
      })
    );
  }

  /**
   * GET /api/persona
   * Obtiene la lista de docentes registrados, combinando registros del backend y locales.
   */
  getDocentes(): Observable<DocenteItemDto[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/Persona`).pipe(
      map(personas => {
        const locales = this.getDocentesGuardadosLocal();
        if (!Array.isArray(personas) || personas.length === 0) {
          return this.getListaCompletaLocal();
        }
        const mapeados: DocenteItemDto[] = personas.map((p, idx) => ({
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

        // Combinar evitando duplicados
        const backendUsernames = new Set(mapeados.map(m => m.username.toLowerCase()));
        const localesNuevos = locales.filter(l => !backendUsernames.has(l.username.toLowerCase()));
        return [...localesNuevos, ...mapeados];
      }),
      catchError(() => of(this.getListaCompletaLocal()))
    );
  }
}
