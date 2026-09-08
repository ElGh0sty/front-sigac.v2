import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MateriaService, MateriaDto, RecursoDto, ActividadDto, RegistroAsistenciaDto } from '../../../services/materia.service';
import { DocumentosDescargaService } from '../../../services/documentos-descarga.service';

@Component({
  selector: 'app-materia-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './materia-detalle.html'
})
export class MateriaDetalleComponent implements OnInit, OnDestroy {
  materiaId: number = 0;
  indiceTemaActual: number = 0;
  tabActual: 'recursos' | 'actividades' | 'asistencia' = 'recursos';

  rol: string = 'Estudiante';
  esAyudante: boolean = false;
  esDocente: boolean = false;
  esAdmin: boolean = false;
  canEdit: boolean = false;

  materia: MateriaDto = {
    id: 101,
    nombre: 'Cálculo Avanzado',
    codigo: 'MAT-301',
    descripcion: 'Derivadas parciales e integrales múltiples.',
    docente: 'Dra. Evelyn Vance',
    creditos: 4,
    semana: 8,
    totalSemanas: 16,
    estudiantes: []
  };

  temas: string[] = ['Tema 1: Fundamentos y Conceptos Iniciales'];
  recursosDeMateria: RecursoDto[] = [];
  actividadesDeMateria: ActividadDto[] = [];
  registrosAsistencia: RegistroAsistenciaDto[] = [];

  showAddRecurso = false;
  showAddActividad = false;
  showAddClase = false;
  showAddTema = false;

  newTemaNombre = '';
  newClaseTema = '';

  nuevoRecurso = {
    nombre: '',
    tipo: 'PDF',
    esencial: false,
    url: 'https://ejemplo.edu/recurso.pdf',
    descripcion: '',
    temaNombre: ''
  };

  nuevaActividad = {
    nombre: '',
    tipo: 'Taller',
    fechaEntrega: '',
    descripcion: ''
  };

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private materiaService: MateriaService,
    private descargaService: DocumentosDescargaService
  ) {}

  ngOnInit() {
    this.detectarRol();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.materiaId = Number(params['id']);
      } else {
        this.materiaId = 101;
      }
      this.cargarDatosMateria();
    });

    // Suscribirse a cambios en recursos
    this.subs.push(
      this.materiaService.recursos$.subscribe(allRecursos => {
        this.recursosDeMateria = allRecursos.filter(r => Number(r.materiaId) === Number(this.materiaId));
      })
    );

    // Suscribirse a cambios en actividades
    this.subs.push(
      this.materiaService.actividades$.subscribe(allActs => {
        this.actividadesDeMateria = allActs.filter(a => Number(a.materiaId) === Number(this.materiaId));
      })
    );

    // Suscribirse a cambios en asistencia
    this.subs.push(
      this.materiaService.asistencias$.subscribe(allAsist => {
        this.registrosAsistencia = allAsist.filter(a => Number(a.materiaId) === Number(this.materiaId));
      })
    );

    // Suscribirse a materias para sincronizar datos del banner
    this.subs.push(
      this.materiaService.materias$.subscribe(() => {
        const found = this.materiaService.getMateriaById(this.materiaId);
        if (found) {
          this.materia = found;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  detectarRol() {
    if (typeof window !== 'undefined') {
      this.rol = localStorage.getItem('rol') || 'Estudiante';
      this.esAyudante = this.rol === 'Ayudante';
      this.esDocente = this.rol === 'Docente';
      this.esAdmin = this.rol === 'Administrador' || this.rol === 'Admin';
      this.canEdit = this.esAyudante || this.esDocente || this.esAdmin;
    }
  }

  cargarDatosMateria() {
    const found = this.materiaService.getMateriaById(this.materiaId);
    if (found) {
      this.materia = found;
    } else {
      this.materia = {
        id: this.materiaId,
        nombre: `Materia #${this.materiaId}`,
        codigo: `MAT-${this.materiaId}`,
        docente: 'Docente Asignado',
        creditos: 4,
        semana: 1,
        totalSemanas: 16,
        estudiantes: []
      };
    }

    this.temas = this.materiaService.getTemasByMateria(this.materiaId);
    if (this.indiceTemaActual >= this.temas.length) {
      this.indiceTemaActual = 0;
    }
    this.nuevoRecurso.temaNombre = this.temas[this.indiceTemaActual] || 'Tema 1: Fundamentos';

    // Cargar listas iniciales
    this.recursosDeMateria = this.materiaService.getRecursosSnapshot().filter(r => Number(r.materiaId) === Number(this.materiaId));
  }

  get temaActualNombre(): string {
    return this.temas[this.indiceTemaActual] || 'Tema Principal';
  }

  get recursosDelTemaActual(): RecursoDto[] {
    const temaActual = this.temaActualNombre;
    return this.recursosDeMateria.filter(r => !r.temaNombre || r.temaNombre === temaActual);
  }

  irAlTemaAnterior() {
    if (this.indiceTemaActual > 0) {
      this.indiceTemaActual--;
      this.nuevoRecurso.temaNombre = this.temaActualNombre;
    }
  }

  irAlTemaSiguiente() {
    if (this.indiceTemaActual < this.temas.length - 1) {
      this.indiceTemaActual++;
      this.nuevoRecurso.temaNombre = this.temaActualNombre;
    }
  }

  seleccionarTema(index: number) {
    this.indiceTemaActual = index;
    this.nuevoRecurso.temaNombre = this.temaActualNombre;
  }

  agregarNuevoTema() {
    if (!this.newTemaNombre.trim()) return;
    this.temas = this.materiaService.addTemaToMateria(this.materiaId, this.newTemaNombre);
    this.indiceTemaActual = this.temas.length - 1;
    this.nuevoRecurso.temaNombre = this.temaActualNombre;
    this.newTemaNombre = '';
    this.showAddTema = false;
  }

  toggleVisto(id: number) {
    this.materiaService.marcarRecursoComoVisto(id).subscribe();
  }

  toggleEsencial(id: number) {
    this.materiaService.toggleRecursoEsencial(id);
  }

  eliminarRecurso(id: number) {
    if (confirm('¿Estás seguro de eliminar este recurso educativo?')) {
      this.materiaService.deleteRecurso(id);
    }
  }

  agregarRecurso() {
    if (!this.nuevoRecurso.nombre.trim()) return;

    this.materiaService.addRecurso(this.materiaId, {
      titulo: this.nuevoRecurso.nombre,
      descripcion: this.nuevoRecurso.descripcion || `Recurso de ${this.nuevoRecurso.tipo}`,
      url: this.nuevoRecurso.url || 'https://ejemplo.edu/recurso.pdf',
      tipo: this.nuevoRecurso.tipo,
      esEsencial: this.nuevoRecurso.esencial,
      materiaId: this.materiaId,
      temaNombre: this.nuevoRecurso.temaNombre || this.temaActualNombre
    }).subscribe(() => {
      this.nuevoRecurso = {
        nombre: '',
        tipo: 'PDF',
        esencial: false,
        url: 'https://ejemplo.edu/recurso.pdf',
        descripcion: '',
        temaNombre: this.temaActualNombre
      };
      this.showAddRecurso = false;
    });
  }

  agregarActividad() {
    if (!this.nuevaActividad.nombre.trim() || !this.nuevaActividad.fechaEntrega) return;

    this.materiaService.addActividad(this.materiaId, {
      titulo: this.nuevaActividad.nombre,
      descripcion: this.nuevaActividad.descripcion || 'Sin descripción',
      fechaEntrega: this.nuevaActividad.fechaEntrega,
      tipo: this.nuevaActividad.tipo,
      materiaId: this.materiaId
    }).subscribe(() => {
      this.nuevaActividad = { nombre: '', tipo: 'Taller', fechaEntrega: '', descripcion: '' };
      this.showAddActividad = false;
    });
  }

  marcarActividadEntregada(actividadId: number) {
    this.materiaService.updateActividadEstado(actividadId, 'entregada');
  }

  calificarActividad(actividadId: number) {
    const rutaBase = this.esAyudante ? '/ayudante' : '/docente';
    this.router.navigate([`${rutaBase}/actividades`, actividadId, 'calificar']);
  }

  eliminarActividad(actividadId: number) {
    if (confirm('¿Deseas eliminar esta actividad del curso?')) {
      this.materiaService.deleteActividad(actividadId);
    }
  }

  agregarClase() {
    if (!this.newClaseTema.trim()) return;
    this.materiaService.addRegistroAsistencia(this.materiaId, this.newClaseTema, this.materia.estudiantes);
    this.newClaseTema = '';
    this.showAddClase = false;
  }

  Math = Math;
  busquedaEstudianteAsistencia: string = '';
  filtroEstadoAsistencia: 'todos' | 'presentes' | 'ausentes' = 'todos';

  getEstudiantesFiltrados(asistentes: any[]): any[] {
    if (!asistentes) return [];
    let list = asistentes;
    if (this.filtroEstadoAsistencia === 'presentes') {
      list = list.filter(a => a.presente);
    } else if (this.filtroEstadoAsistencia === 'ausentes') {
      list = list.filter(a => !a.presente);
    }
    if (this.busquedaEstudianteAsistencia.trim()) {
      const q = this.busquedaEstudianteAsistencia.toLowerCase().trim();
      list = list.filter(a => a.nombre?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q));
    }
    return list;
  }

  marcarTodosAsistencia(registroId: number, presente: boolean) {
    const reg = this.registrosAsistencia.find(r => r.id === registroId);
    if (!reg || !reg.asistentes) return;
    reg.asistentes.forEach((a, idx) => {
      if (a.presente !== presente) {
        this.materiaService.toggleAsistencia(registroId, idx);
      }
    });
  }

  toggleAsistencia(registroId: number, estudianteIndex: number) {
    this.materiaService.toggleAsistencia(registroId, estudianteIndex);
  }

  contarPresentes(asistentes: any[]): number {
    if (!asistentes) return 0;
    return asistentes.filter(a => a.presente).length;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  descargarRecursoDocumento(r: RecursoDto): void {
    if (r.archivoDataUrl) {
      this.descargaService.descargarArchivo(r.nombreArchivo || `${r.titulo}.pdf`, r.archivoDataUrl);
      return;
    }
    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${r.titulo} - UTEQ</title>
<style>body{font-family:sans-serif;padding:30px;line-height:1.6;color:#1e293b;}</style>
</head>
<body>
  <div style="border-bottom:2px solid #047857;padding-bottom:10px;margin-bottom:20px;">
    <h2 style="color:#065f46;margin:0;">Universidad Técnica Estatal de Quevedo (UTEQ)</h2>
    <h4 style="color:#475569;margin:4px 0 0 0;">Material de Aprendizaje y Cátedra · SIGAC</h4>
  </div>
  <h3 style="color:#0f172a;">${r.titulo}</h3>
  <p><strong>Tipo:</strong> ${r.tipo} | <strong>Docente / Tutor:</strong> ${r.creadoPor || 'Cátedra'}</p>
  <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:15px;border-radius:8px;margin:15px 0;">
    <p>${r.descripcion || 'Material de lectura y apoyo para el semestre académico.'}</p>
    <p><strong>Enlace del recurso:</strong> <a href="${r.url}">${r.url}</a></p>
  </div>
  <p style="font-size:11px;color:#64748b;">Descargado desde el aula virtual SIGAC - UTEQ.</p>
</body>
</html>`;
    this.descargaService.descargarArchivo(`${r.titulo.replace(/\s+/g, '_')}_UTEQ.html`, html);
  }

  descargarActividadDocumento(a: ActividadDto): void {
    if (a.archivoDataUrl) {
      this.descargaService.descargarArchivo(a.nombreArchivo || `${a.titulo}.pdf`, a.archivoDataUrl);
      return;
    }
    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${a.titulo} - UTEQ</title>
<style>body{font-family:sans-serif;padding:30px;line-height:1.6;color:#1e293b;}</style>
</head>
<body>
  <div style="border-bottom:2px solid #047857;padding-bottom:10px;margin-bottom:20px;">
    <h2 style="color:#065f46;margin:0;">Universidad Técnica Estatal de Quevedo (UTEQ)</h2>
    <h4 style="color:#475569;margin:4px 0 0 0;">Guía y Rúbrica de Actividad Evaluativa · SIGAC</h4>
  </div>
  <h3 style="color:#0f172a;">${a.titulo}</h3>
  <p><strong>Tipo:</strong> ${a.tipo} | <strong>Fecha de Entrega:</strong> ${a.fechaEntrega}</p>
  <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:15px;border-radius:8px;margin:15px 0;">
    <h4>Instrucciones para la entrega:</h4>
    <p>${a.descripcion || 'Completar el informe o taller y enviarlo a través de la plataforma.'}</p>
  </div>
  <p style="font-size:11px;color:#64748b;">Asignación oficial registrada en SIGAC - UTEQ.</p>
</body>
</html>`;
    this.descargaService.descargarArchivo(`${a.titulo.replace(/\s+/g, '_')}_Guia_UTEQ.html`, html);
  }
}
