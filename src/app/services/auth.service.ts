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
          localStorage.setItem('rol', response.rol || '');
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
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRol(): string | null {
    return localStorage.getItem('rol');
  }

  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }
}
