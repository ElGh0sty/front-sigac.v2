import { Injectable, inject } from '@angular/core';
import { CoordinadorService } from './coordinador.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AyudantiaService {
  private coordinadorService = inject(CoordinadorService);

  getValidacionRequisitosEstudiante(estudianteId: number): Observable<{ porcentajeMalla: number; promedioEstudiante: number; promedioCarrera: number; promedioCurso: number; cumpleRequisitos: boolean }> {
    return this.coordinadorService.getValidacionRequisitosEstudiante(estudianteId);
  }

  crearPresentacionTribunal(body: { ayudantiaId: number; fecha: string; docentesIds: number[]; decanoId?: number; coordinadorId?: number; temaSilabo?: string; lugarOEnlace?: string }): Observable<any> {
    return this.coordinadorService.crearPresentacionTribunal(body);
  }

  subirDocumentoAnexo(formData: FormData): Observable<any> {
    return this.coordinadorService.subirDocumentoAnexo(formData);
  }

  getSolicitudesAyudantia() {
    return this.coordinadorService.getSolicitudesAyudantia();
  }

  asignarAyudante(dto: any) {
    return this.coordinadorService.asignarAyudante(dto);
  }
}
