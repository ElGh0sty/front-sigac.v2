import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest, Subscription } from 'rxjs';
import { MateriaDto, MateriaService } from '../../../services/materia.service';
import { ClaseDto, ClaseService } from '../../../services/clase.service';

export interface GrupoClaseMaterias {
  claseNombre: string;
  claseId?: number;
  semestre?: string;
  materias: MateriaDto[];
  totalEstudiantes: number;
  totalCreditos: number;
}

@Component({
  selector: 'app-materias-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './materias-admin.html'
})
export class MateriasAdminComponent implements OnInit, OnDestroy {
  materias: MateriaDto[] = [];
  clases: ClaseDto[] = [];
  filtroTexto = '';
  filtroClase = 'todas';
  filtroSemestre = 'todos';
  modoVista: 'grid' | 'por_clase' = 'grid'; // 'grid' | 'por_clase'
  
  private sub?: Subscription;

  constructor(
    private materiaService: MateriaService,
    private claseService: ClaseService
  ) {}

  ngOnInit() {
    this.sub = combineLatest([
      this.materiaService.materias$,
      this.claseService.clases$
    ]).subscribe(([materias, clases]) => {
      this.materias = materias;
      this.clases = clases;
    });
    this.materiaService.refreshMaterias().subscribe();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get clasesDisponibles(): string[] {
    const nombres = new Set<string>();
    this.clases.forEach(c => nombres.add(c.nombre));
    this.materias.forEach(m => {
      if (m.claseNombre) nombres.add(m.claseNombre);
    });
    return Array.from(nombres);
  }

  get semestresDisponibles(): string[] {
    const semestres = new Set<string>();
    this.clases.forEach(c => { if (c.semestre) semestres.add(c.semestre); });
    this.materias.forEach(m => { if (m.semestre) semestres.add(m.semestre); });
    return Array.from(new Set(['2026-2', '2026-1', ...Array.from(semestres)]));
  }

  get materiasFiltradas(): MateriaDto[] {
    return this.materias.filter(m => {
      const matchTexto = !this.filtroTexto.trim() ||
        m.nombre.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        m.codigo.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        (m.docente && m.docente.toLowerCase().includes(this.filtroTexto.toLowerCase())) ||
        (m.claseNombre && m.claseNombre.toLowerCase().includes(this.filtroTexto.toLowerCase()));

      const matchClase = this.filtroClase === 'todas' ||
        (m.claseNombre && m.claseNombre === this.filtroClase) ||
        (m.claseId && String(m.claseId) === this.filtroClase);

      const matchSemestre = this.filtroSemestre === 'todos' ||
        m.semestre === this.filtroSemestre;

      return matchTexto && matchClase && matchSemestre;
    });
  }

  get materiasAgrupadasPorClase(): GrupoClaseMaterias[] {
    const mapGrupos = new Map<string, MateriaDto[]>();

    // Inicializar con clases registradas
    this.clases.forEach(c => {
      if (!mapGrupos.has(c.nombre)) {
        mapGrupos.set(c.nombre, []);
      }
    });

    // Agregar materias a sus grupos
    this.materiasFiltradas.forEach(m => {
      const nombreClase = m.claseNombre || 'Otras Materias / Sin Clase Asignada';
      if (!mapGrupos.has(nombreClase)) {
        mapGrupos.set(nombreClase, []);
      }
      mapGrupos.get(nombreClase)!.push(m);
    });

    const resultado: GrupoClaseMaterias[] = [];
    mapGrupos.forEach((mats, nombreClase) => {
      if (mats.length > 0 || this.filtroClase === 'todas' && !this.filtroTexto.trim()) {
        const matchingClase = this.clases.find(c => c.nombre.trim().toLowerCase() === nombreClase.trim().toLowerCase());
        const totalEstudiantes = mats.reduce((acc, curr) => acc + (curr.estudiantes?.length || 0), 0);
        const totalCreditos = mats.reduce((acc, curr) => acc + (curr.creditos || 4), 0);

        resultado.push({
          claseNombre: nombreClase,
          claseId: matchingClase?.id,
          semestre: matchingClase?.semestre || mats[0]?.semestre || '2026-2',
          materias: mats,
          totalEstudiantes,
          totalCreditos
        });
      }
    });

    return resultado;
  }

  getBadgeColorClass(claseNombre?: string): { bg: string, text: string, border: string } {
    if (!claseNombre) {
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    }
    const hash = claseNombre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
      { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
    ];
    return colors[hash % colors.length];
  }

  eliminarMateria(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar esta materia del sistema?')) {
      this.materiaService.deleteMateria(id).subscribe();
    }
  }
}

