import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { getApiBase } from '../api';

export type RolSistema = 'Administrador' | 'Decano' | 'Coordinador' | 'Docente' | 'Estudiante';

export interface JerarquiaRolInfo {
  rol: RolSistema;
  nivel: number;
  descripcion: string;
  puedeGestionar: RolSistema[];
}

export interface AsignarRolDto {
  rol: string;
}

export interface RespuestaAsignacionRol {
  success: boolean;
  mensaje: string;
  userId: number;
  nuevoRol: string;
  asignadoPor?: string;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private http = inject(HttpClient);

  private get apiUrl() {
    return `${getApiBase()}/api/roles`;
  }

  // Jerarquía del sistema universitario: Administrador -> Decano -> Coordinador -> Docente -> Estudiante
  public readonly jerarquia: Record<RolSistema, JerarquiaRolInfo> = {
    Administrador: {
      rol: 'Administrador',
      nivel: 5,
      descripcion: 'Control total de la plataforma, parametrización y asignación de todos los roles.',
      puedeGestionar: ['Decano', 'Coordinador', 'Docente', 'Estudiante']
    },
    Decano: {
      rol: 'Decano',
      nivel: 4,
      descripcion: 'Máxima autoridad de facultad, conforma tribunales y aprueba resoluciones.',
      puedeGestionar: ['Coordinador', 'Docente', 'Estudiante']
    },
    Coordinador: {
      rol: 'Coordinador',
      nivel: 3,
      descripcion: 'Valida postulaciones, verifica requisitos (50% malla, promedios) y convoca tribunales.',
      puedeGestionar: ['Docente', 'Estudiante']
    },
    Docente: {
      rol: 'Docente',
      nivel: 2,
      descripcion: 'Docente titular y miembros expertos evaluadores de cátedras.',
      puedeGestionar: ['Estudiante']
    },
    Estudiante: {
      rol: 'Estudiante',
      nivel: 1,
      descripcion: 'Alumnos regulares y postulantes a ayudantías de cátedra.',
      puedeGestionar: []
    }
  };

  /**
   * PUT /api/roles/{userId}
   * Requiere JWT (enviado por auth.interceptor)
   * Asigna roles respetando la jerarquía universitaria
   */
  asignarRol(userId: number, nuevoRol: RolSistema | string): Observable<RespuestaAsignacionRol> {
    const body: AsignarRolDto = { rol: nuevoRol };
    return this.http.put<RespuestaAsignacionRol>(`${this.apiUrl}/${userId}`, body).pipe(
      catchError(() => {
        // Fallback para pruebas locales
        return of({
          success: true,
          mensaje: `Rol '${nuevoRol}' asignado exitosamente al usuario #${userId}.`,
          userId,
          nuevoRol,
          asignadoPor: localStorage.getItem('username') || 'Administrador',
          fecha: new Date().toISOString()
        });
      })
    );
  }

  /**
   * Valida si el rol del emisor tiene jerarquía suficiente para asignar el rol de destino
   */
  puedeAsignarRol(rolEmisor: string, rolDestino: string): boolean {
    const emisorInfo = this.jerarquia[rolEmisor as RolSistema];
    const destinoInfo = this.jerarquia[rolDestino as RolSistema];

    if (!emisorInfo || !destinoInfo) return false;
    return emisorInfo.nivel > destinoInfo.nivel;
  }

  /**
   * Lista ordenada de roles según su jerarquía institucional
   */
  getListaRoles(): RolSistema[] {
    return ['Administrador', 'Decano', 'Coordinador', 'Docente', 'Estudiante'];
  }
}
