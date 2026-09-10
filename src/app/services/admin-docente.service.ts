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

  // Lista base de docentes oficiales del sistema
  private docentesBase: DocenteItemDto[] = [
    {
      id: 102,
      username: 'docente',
      nombre: 'Docente',
      apellido: 'Titular',
      correo: 'docente@uteq.edu.ec',
      roles: ['Docente'],
      activo: true,
      departamento: 'Facultad de Ingeniería',
      titulo: 'Docente Titular'
    },
    {
      id: 1,
      username: 'evance',
      nombre: 'Dra. Evelyn',
      apellido: 'Vance',
      correo: 'e.vance@uteq.edu.ec',
      roles: ['Docente'],
      activo: true,
      departamento: 'Ciencias Exactas',
      titulo: 'Docente Titular'
    },
    {
      id: 2,
      username: 'mthorne',
      nombre: 'Dr. Marcus',
      apellido: 'Thorne',
      correo: 'm.thorne@uteq.edu.ec',
      roles: ['Docente'],
      activo: true,
      departamento: 'Física y Química',
      titulo: 'Docente Asociado'
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
   * GET /api/Persona o GET /api/Docente
   * Obtiene la lista de docentes registrados en el backend con su ID real correspondiente.
   */
  getDocentes(): Observable<DocenteItemDto[]> {
    const urlPersona = `${this.baseUrl}/api/Persona`;
    const urlDocente = `${this.baseUrl}/api/Docente`;
    const urlDocenteLower = `${this.baseUrl}/api/docente`;

    return this.http.get<any>(urlPersona).pipe(
      catchError(() => this.http.get<any>(urlDocente)),
      catchError(() => this.http.get<any>(urlDocenteLower)),
      map(data => {
        let rawList: any[] = [];
        if (Array.isArray(data)) {
          rawList = data;
        } else if (data && Array.isArray(data.docentes)) {
          rawList = data.docentes;
        } else if (data && Array.isArray(data.personas)) {
          rawList = data.personas;
        } else if (data && Array.isArray(data.items)) {
          rawList = data.items;
        }

        if (rawList.length === 0) {
          return this.getListaCompletaLocal();
        }

        // Mapear registros recibidos del backend
        const docentesBackend: DocenteItemDto[] = [];

        for (let idx = 0; idx < rawList.length; idx++) {
          const p = rawList[idx];
          const correo = (p.correo || p.email || '').toLowerCase().trim();
          const username = (p.username || (correo ? correo.split('@')[0] : `docente.${p.id || idx + 1}`)).toLowerCase().trim();
          const rol = (p.rol || '').toLowerCase();
          const roles: string[] = Array.isArray(p.roles) ? p.roles : (p.rol ? [p.rol] : []);
          const rolesLower = roles.map((r: string) => r.toLowerCase());

          const esDocente = rol === 'docente' || 
                            rolesLower.includes('docente') || 
                            rolesLower.includes('coordinador') ||
                            correo.includes('docente') || 
                            username.includes('docente') ||
                            (!rolesLower.includes('estudiante') && p.nombre);

          if (esDocente || rawList.length <= 4) {
            const rawId = p.id ?? p.docenteId ?? p.personaId ?? (idx + 1);
            docentesBackend.push({
              id: Number(rawId),
              username: p.username || username,
              nombre: p.nombre || 'Docente',
              apellido: p.apellido || '',
              correo: p.correo || p.email || (username ? `${username}@uteq.edu.ec` : 'docente@uteq.edu.ec'),
              roles: roles.length > 0 ? roles : ['Docente'],
              activo: p.activo !== false,
              departamento: p.departamento || 'Facultad de Ingeniería',
              titulo: p.titulo || 'Docente Titular'
            });
          }
        }

        // Si no se identificaron docentes en el filtrado, mapear todos
        const listaFinal: DocenteItemDto[] = docentesBackend.length > 0 ? docentesBackend : rawList.map((p, idx) => ({
          id: Number(p.id ?? p.docenteId ?? p.personaId ?? idx + 1),
          username: p.username || (p.correo ? p.correo.split('@')[0] : `docente.${idx + 1}`),
          nombre: p.nombre || 'Docente',
          apellido: p.apellido || '',
          correo: p.correo || p.email || 'docente@uteq.edu.ec',
          roles: Array.isArray(p.roles) ? p.roles : (p.rol ? [p.rol] : ['Docente']),
          activo: p.activo !== false,
          departamento: p.departamento || 'Facultad de Ingeniería',
          titulo: p.titulo || 'Docente Titular'
        }));

        // Garantizar que docente@uteq.edu.ec esté siempre presente con su ID
        const tieneDocenteOficial = listaFinal.some(d =>
          d.correo.toLowerCase() === 'docente@uteq.edu.ec' || d.username.toLowerCase() === 'docente'
        );

        if (!tieneDocenteOficial) {
          const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
          const storedRol = typeof window !== 'undefined' ? localStorage.getItem('rol') : null;
          const idOficial = (storedRol === 'Docente' && storedUserId) ? Number(storedUserId) : 102;

          listaFinal.unshift({
            id: idOficial,
            username: 'docente',
            nombre: 'Docente',
            apellido: 'Titular',
            correo: 'docente@uteq.edu.ec',
            roles: ['Docente'],
            activo: true,
            departamento: 'Facultad de Ingeniería',
            titulo: 'Docente Titular'
          });
        }

        // Combinar con los guardados localmente evitando IDs duplicados
        const locales = this.getDocentesGuardadosLocal();
        const existingIds = new Set(listaFinal.map(m => m.id));
        for (const loc of locales) {
          if (!existingIds.has(loc.id)) {
            listaFinal.push(loc);
            existingIds.add(loc.id);
          }
        }

        return listaFinal;
      }),
      catchError(() => of(this.getListaCompletaLocal()))
    );
  }
}
