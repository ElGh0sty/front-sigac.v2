import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { getApiBase } from '../api';
import { MateriaService } from './materia.service';

export interface PostulacionAyudantiaDto {
  catedraId: number;
}

export interface RegistroBitacoraDto {
  ayudantiaId: number;
  actividadesRealizadas: string;
  evidenciaUrl: string;
}

export interface BitacoraItemDto {
  id: number;
  ayudantiaId: number;
  nombreAyudante: string;
  nombreCatedra: string;
  actividadesRealizadas: string;
  evidenciaUrl?: string;
  fecha: string;
}

export interface InformeMensualRequestDto {
  ayudantiaId: number;
  mes: number;
  anio: number;
}

export interface HistorialAyudantiaDto {
  ayudantiaId: number;
  estadoAyudantia: string;
  catedraId: number;
  nombreCatedra: string;
  semestreCatedra: string;
  docenteCatedra: string;
  estudianteId?: number;
  nombreEstudiante?: string;
}

const HISTORIAL_DEFAULT: HistorialAyudantiaDto[] = [
  {
    ayudantiaId: 1,
    estadoAyudantia: 'Asignada',
    catedraId: 101,
    nombreCatedra: 'Cálculo Avanzado',
    semestreCatedra: '2026-2',
    docenteCatedra: 'Dra. Evelyn Vance',
    estudianteId: 1,
    nombreEstudiante: 'Alejandro García'
  },
  {
    ayudantiaId: 2,
    estadoAyudantia: 'Pendiente',
    catedraId: 102,
    nombreCatedra: 'Mecánica Cuántica',
    semestreCatedra: '2026-2',
    docenteCatedra: 'Dr. Marcus Thorne',
    estudianteId: 2,
    nombreEstudiante: 'María López'
  }
];

const BITACORAS_DEFAULT: BitacoraItemDto[] = [
  {
    id: 1,
    ayudantiaId: 1,
    nombreAyudante: 'Alejandro García',
    nombreCatedra: 'Cálculo Avanzado',
    actividadesRealizadas: 'Resolución de dudas sobre integrales dobles y preparación de guía de ejercicios para el grupo A.',
    evidenciaUrl: 'https://ejemplo.edu/evidencias/guia_ejercicios.pdf',
    fecha: '2026-08-24'
  }
];

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {
  private STORAGE_POSTULACIONES = 'sigac_postulaciones_v2';
  private STORAGE_BITACORAS = 'sigac_bitacoras_v2';

  private historialSubject = new BehaviorSubject<HistorialAyudantiaDto[]>(this.loadStorage(this.STORAGE_POSTULACIONES, HISTORIAL_DEFAULT));
  public historial$ = this.historialSubject.asObservable();

  private bitacorasSubject = new BehaviorSubject<BitacoraItemDto[]>(this.loadStorage(this.STORAGE_BITACORAS, BITACORAS_DEFAULT));
  public bitacoras$ = this.bitacorasSubject.asObservable();

  constructor(
    private http: HttpClient,
    private materiaService: MateriaService
  ) {}

  private get apiUrl() { return `${getApiBase()}/api/estudiante`; }

  private loadStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as unknown as T;
        }
      }
    } catch (e) {
      console.warn(`Error loading storage for ${key}`, e);
    }
    return fallback;
  }

  private saveStorage<T>(key: string, data: T) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn(`Error saving storage for ${key}`, e);
      }
    }
  }

  postularAyudantia(dto: PostulacionAyudantiaDto): Observable<any> {
    const materia = this.materiaService.getMateriaById(dto.catedraId);
    const nombreUsuario = typeof window !== 'undefined' ? (localStorage.getItem('nombre') || 'Alejandro García') : 'Alejandro García';

    const nuevaPostulacion: HistorialAyudantiaDto = {
      ayudantiaId: Date.now(),
      estadoAyudantia: 'Pendiente',
      catedraId: Number(dto.catedraId),
      nombreCatedra: materia?.nombre || `Materia #${dto.catedraId}`,
      semestreCatedra: '2026-2',
      docenteCatedra: materia?.docente || 'Docente Responsable',
      estudianteId: 1,
      nombreEstudiante: nombreUsuario
    };

    const current = this.historialSubject.value;
    const updated = [nuevaPostulacion, ...current];
    this.historialSubject.next(updated);
    this.saveStorage(this.STORAGE_POSTULACIONES, updated);

    return this.http.post(`${this.apiUrl}/ayudantias/postulaciones`, dto).pipe(
      catchError(() => of({ success: true, postulacion: nuevaPostulacion }))
    );
  }

  registrarBitacora(dto: RegistroBitacoraDto): Observable<any> {
    const postulacion = this.historialSubject.value.find(h => Number(h.ayudantiaId) === Number(dto.ayudantiaId));
    const nombreUsuario = typeof window !== 'undefined' ? (localStorage.getItem('nombre') || 'Alejandro García') : 'Alejandro García';

    const nuevaBitacora: BitacoraItemDto = {
      id: Date.now(),
      ayudantiaId: Number(dto.ayudantiaId),
      nombreAyudante: nombreUsuario,
      nombreCatedra: postulacion?.nombreCatedra || 'Ayudantía General',
      actividadesRealizadas: dto.actividadesRealizadas,
      evidenciaUrl: dto.evidenciaUrl,
      fecha: new Date().toISOString().split('T')[0]
    };

    const current = this.bitacorasSubject.value;
    const updated = [nuevaBitacora, ...current];
    this.bitacorasSubject.next(updated);
    this.saveStorage(this.STORAGE_BITACORAS, updated);

    return this.http.post(`${this.apiUrl}/ayudantias/bitacora`, dto).pipe(
      catchError(() => of({ success: true, bitacora: nuevaBitacora }))
    );
  }

  getBitacoras(): Observable<BitacoraItemDto[]> {
    return this.bitacoras$;
  }

  generarInformeMensual(request: InformeMensualRequestDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/ayudantias/informe-mensual`, request).pipe(
      catchError(() => of({ success: true, mensaje: 'Informe generado exitosamente.' }))
    );
  }

  getHistorialAyudantias(): Observable<HistorialAyudantiaDto[]> {
    return this.historial$;
  }

  actualizarEstadoPostulacion(ayudantiaId: number, nuevoEstado: string): void {
    const list = this.historialSubject.value.map(h => {
      if (Number(h.ayudantiaId) === Number(ayudantiaId)) {
        return { ...h, estadoAyudantia: nuevoEstado };
      }
      return h;
    });
    this.historialSubject.next(list);
    this.saveStorage(this.STORAGE_POSTULACIONES, list);
  }
}
