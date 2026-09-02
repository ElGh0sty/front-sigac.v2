// src/app/models/materia/materia.dto.ts
export interface MateriaDto {
  id: number;
  nombre: string;
  descripcion: string;
  codigo: string;
  docenteResponsableId: number;
}

export interface RecursoDto {
  id: number;
  titulo: string;
  descripcion: string;
  url: string;
  esEsencial: boolean;
  materiaId: number;
}

export interface RecursoConEstadoDto extends RecursoDto {
  visto: boolean;
}

export interface ActividadDto {
  id: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  tipo: string;
  estado: string;
  materiaId: number;
}

export interface ClaseDto {
  id: number;
  nombre: string;
  materiaId: number;
  docenteId: number;
  estudianteIds: number[];
}

export interface ClaseSesionDto {
  id: number;
  materiaId: number;
  claseId?: number;
  docenteId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoClase: string;
  linkVirtual?: string;
  aplicacionVirtual?: string;
  edificioPresencial?: string;
  aulaPresencial?: string;
  pisoPresencial?: string;
}

export interface AsistenciaDto {
  id: number;
  claseSesionId: number;
  estudianteId: number;
  presente: boolean;
}

export interface CreateRecursoDto {
  titulo: string;
  descripcion: string;
  url: string;
  esEsencial: boolean;
  materiaId: number;
}

export interface CreateActividadDto {
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  tipo: string;
  materiaId: number;
}

export interface CreateClaseDto {
  nombre: string;
  materiaId: number;
  docenteId: number;
  estudianteIds: number[];
}

export interface CreateClaseSesionDto {
  materiaId: number;
  claseId?: number;
  docenteId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoClase: string;
  linkVirtual?: string;
  aplicacionVirtual?: string;
  edificioPresencial?: string;
  aulaPresencial?: string;
  pisoPresencial?: string;
}

export interface CreateAsistenciaDto {
  claseSesionId: number;
  estudianteId: number;
  presente: boolean;
}

export interface MarkRecursoAsSeenDto {
  recursoId: number;
}
