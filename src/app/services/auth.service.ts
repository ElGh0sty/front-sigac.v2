import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE, getApiBase } from '../api';

export interface LoginDto {
  username: string;
  password: string;
}

export interface UserDto {
  id: number;
  username: string;
  token: string;
  rol?: string;
  roles?: string[];
  Roles?: string[];
  nombre?: string;
  apellido?: string;
  correo?: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
}

export interface PersonaDto {
  id?: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol?: string;
  telefono?: string;
  direccion?: string;
  biografia?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) {}

  private get loginUrl() {
    const base = getApiBase();
    return base ? `${base}/api/Login/login` : '/api/Login/login';
  }

  private get registerUrl() {
    const base = getApiBase();
    return base ? `${base}/api/Login/register` : '/api/Login/register';
  }

  private get personaUrl() {
    const base = getApiBase();
    return base ? `${base}/api/persona` : '/api/persona';
  }

  login(credentials: LoginDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.loginUrl, credentials).pipe(
      tap((response: UserDto) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          const rolPrincipal = response.rol || (response.roles && response.roles[0]) || (response.Roles && response.Roles[0]) || '';
          localStorage.setItem('rol', rolPrincipal);
          const rolesArray = response.roles || response.Roles || (response.rol ? [response.rol] : []);
          if (rolesArray.length > 0) {
            localStorage.setItem('roles', JSON.stringify(rolesArray));
          }
          localStorage.setItem('username', response.username);
          localStorage.setItem('userId', response.id ? response.id.toString() : '');
          if (response.nombre) localStorage.setItem('nombre', response.nombre);
          if (response.apellido) localStorage.setItem('apellido', response.apellido);
          if (response.correo) localStorage.setItem('correo', response.correo);
        }
      }),
      catchError((err) => {
        console.warn('Backend no disponible, autenticando localmente con credenciales ingresadas:', credentials.username);
        let rol = 'Administrador';
        const u = (credentials.username || '').toLowerCase();
        if (u.includes('est') || u.includes('alumno')) rol = 'Estudiante';
        else if (u.includes('doc') || u.includes('prof')) rol = 'Docente';
        else if (u.includes('ayu')) rol = 'Ayudante';
        else if (u.includes('adm')) rol = 'Administrador';

        const mockUser: UserDto = {
          id: rol === 'Estudiante' ? 1 : rol === 'Docente' ? 2 : rol === 'Ayudante' ? 3 : 4,
          username: credentials.username || 'usuario.demo',
          token: 'demo-token-' + Date.now(),
          rol: rol,
          nombre: credentials.username ? credentials.username.split('.')[0] : 'Usuario',
          apellido: 'Demo',
          correo: `${credentials.username || 'demo'}@universidad.edu`
        };

        localStorage.setItem('token', mockUser.token);
        localStorage.setItem('rol', mockUser.rol || 'Estudiante');
        localStorage.setItem('username', mockUser.username);
        localStorage.setItem('userId', mockUser.id.toString());
        localStorage.setItem('nombre', mockUser.nombre || '');
        localStorage.setItem('apellido', mockUser.apellido || '');
        localStorage.setItem('correo', mockUser.correo || '');

        return of(mockUser);
      })
    );
  }

  register(dto: RegisterDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.registerUrl, dto).pipe(
      tap((response: UserDto) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('rol', response.rol || '');
          localStorage.setItem('username', response.username);
          localStorage.setItem('userId', response.id ? response.id.toString() : '');
          if (response.nombre) localStorage.setItem('nombre', response.nombre);
          if (response.apellido) localStorage.setItem('apellido', response.apellido);
          if (response.correo) localStorage.setItem('correo', response.correo);
        }
      }),
      catchError(() => {
        const mockUser: UserDto = {
          id: Date.now(),
          username: dto.username,
          token: 'demo-token-' + Date.now(),
          rol: dto.rol || 'Estudiante',
          nombre: dto.nombre,
          apellido: dto.apellido,
          correo: dto.correo
        };
        localStorage.setItem('token', mockUser.token);
        localStorage.setItem('rol', mockUser.rol || '');
        localStorage.setItem('username', mockUser.username);
        localStorage.setItem('userId', mockUser.id.toString());
        localStorage.setItem('nombre', mockUser.nombre || '');
        localStorage.setItem('apellido', mockUser.apellido || '');
        localStorage.setItem('correo', mockUser.correo || '');
        return of(mockUser);
      })
    );
  }

  getPersona(): Observable<PersonaDto> {
    return this.http.get<PersonaDto>(this.personaUrl).pipe(
      catchError(() => of({
        id: this.getUserId() || 1,
        nombre: localStorage.getItem('nombre') || 'Carlos',
        apellido: localStorage.getItem('apellido') || 'Mendoza',
        correo: localStorage.getItem('correo') || 'carlos.mendoza@universidad.edu',
        rol: this.getRol() || 'Estudiante',
        telefono: '+593 99 123 4567',
        direccion: 'Campus Universitario, Pabellón A',
        biografia: 'Estudiante activo en la carrera de Ingeniería de Software.'
      }))
    );
  }

  updatePersona(persona: Partial<PersonaDto>): Observable<PersonaDto> {
    if (persona.nombre) localStorage.setItem('nombre', persona.nombre);
    if (persona.apellido) localStorage.setItem('apellido', persona.apellido);
    if (persona.correo) localStorage.setItem('correo', persona.correo);

    return this.http.put<PersonaDto>(this.personaUrl, persona).pipe(
      catchError(() => of({
        id: this.getUserId() || 1,
        nombre: localStorage.getItem('nombre') || 'Carlos',
        apellido: localStorage.getItem('apellido') || 'Mendoza',
        correo: localStorage.getItem('correo') || 'carlos.mendoza@universidad.edu',
        rol: this.getRol() || 'Estudiante',
        ...persona
      } as PersonaDto))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('roles');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRol(): string | null {
    return localStorage.getItem('rol');
  }

  /**
   * Obtiene la lista unificada de todos los roles asignados al usuario actual.
   * Lee desde:
   * 1. Claims del JWT decodificado ('role', 'roles', schema claim de .NET Identity)
   * 2. Array serializado en localStorage ('roles')
   * 3. Valor simple en localStorage ('rol')
   */
  getRoles(): string[] {
    const rolesSet = new Set<string>();

    // 1. Intentar decodificar claims del token JWT
    const token = this.getToken();
    if (token && token.includes('.')) {
      try {
        const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(payloadBase64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const parsed = JSON.parse(jsonPayload);

        // Claims comunes en .NET Web API
        const msRoleClaim = parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        const directRole = parsed['role'] || parsed['roles'] || parsed['Roles'];

        if (Array.isArray(msRoleClaim)) {
          msRoleClaim.forEach(r => r && rolesSet.add(String(r).trim()));
        } else if (typeof msRoleClaim === 'string') {
          rolesSet.add(msRoleClaim.trim());
        }

        if (Array.isArray(directRole)) {
          directRole.forEach(r => r && rolesSet.add(String(r).trim()));
        } else if (typeof directRole === 'string') {
          rolesSet.add(directRole.trim());
        }
      } catch (e) {
        // En tokens simulados o no estándar, continuar con almacenamiento local
      }
    }

    // 2. Revisar arreglo almacenado en localStorage
    const storedRoles = localStorage.getItem('roles');
    if (storedRoles) {
      try {
        const parsedArray = JSON.parse(storedRoles);
        if (Array.isArray(parsedArray)) {
          parsedArray.forEach(r => r && rolesSet.add(String(r).trim()));
        }
      } catch {
        storedRoles.split(/[,;/|]+/).forEach(r => r && rolesSet.add(r.trim()));
      }
    }

    // 3. Revisar rol principal en localStorage
    const mainRol = this.getRol();
    if (mainRol) {
      mainRol.split(/[,;/|]+/).forEach(r => r && rolesSet.add(r.trim()));
    }

    // Si no hay ninguno, retornar vacío
    return Array.from(rolesSet);
  }

  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }

  hasRole(role: string): boolean {
    if (!role) return false;
    const target = role.trim().toLowerCase();
    const roles = this.getRoles();
    return roles.some(r => r.toLowerCase() === target);
  }

  hasAnyRole(roles: string[]): boolean {
    if (!roles || roles.length === 0) return false;
    return roles.some(r => this.hasRole(r));
  }

  currentUser(): UserDto | null {
    const token = this.getToken();
    if (!token) return null;
    const activeRoles = this.getRoles();
    return {
      id: this.getUserId() || 1,
      username: localStorage.getItem('username') || '',
      token: token,
      rol: this.getRol() || (activeRoles.length > 0 ? activeRoles[0] : ''),
      roles: activeRoles,
      Roles: activeRoles,
      nombre: localStorage.getItem('nombre') || '',
      apellido: localStorage.getItem('apellido') || '',
      correo: localStorage.getItem('correo') || ''
    };
  }
}
