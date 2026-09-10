import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EstudianteService, HistorialAyudantiaDto } from '../../../services/estudiante.service';
import { CoordinadorService, CatedraMinimoNotaDto } from '../../../services/coordinador.service';
import { AuthService } from '../../../services/auth.service';

export interface CatedraConvocatoria {
  id: number;
  nombre: string;
  codigo: string;
  docente: string;
  semestre: string;
  minimoNota: number;
  cuposDisponibles: number;
  horasAyudantia: number;
  notaObtenidaEstudiante: number;
  materiaAprobada: boolean;
  cumpleRequisitos: boolean;
  motivoInvalidez?: string;
  yaPostulado?: boolean;
}

@Component({
  selector: 'app-postulacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './postulacion.html'
})
export class PostulacionComponent implements OnInit, OnDestroy {
  // Datos del expediente del estudiante para validación de requisitos
  promedioAcumulado = 8.92;
  promedioMinimoExigido = 8.0;
  esEstudianteRegular = true;
  cumpleMalla = true;
  cumplePromedioGeneral = true;
  tieneSanciones = false;
  matricula = 'EST-2022-045';
  estudianteNombre = localStorage.getItem('nombre') || 'Alejandro';
  estudianteApellido = localStorage.getItem('apellido') || 'García';

  // Convocatorias abiertas con validación de requisitos por materia
  convocatorias: CatedraConvocatoria[] = [];
  historial: HistorialAyudantiaDto[] = [];
  
  // Modal de postulación
  catedraSeleccionada: CatedraConvocatoria | null = null;
  mostrarModalPostular = false;
  cartaMotivacion = '';
  disponibilidadHoraria = 'Tarde (14:00 - 18:00)';
  aceptaDeclaracionJurada = false;

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  private subs: Subscription[] = [];

  constructor(
    private estudianteService: EstudianteService,
    private coordinadorService: CoordinadorService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarConvocatoriasYHistorial();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  get nombreCompleto(): string {
    return `${this.estudianteNombre} ${this.estudianteApellido}`.trim();
  }

  // Notas históricas obtenidas por el estudiante en su malla curricular (incluye las 3 cátedras oficiales activas)
  private expedienteNotasMateria: Record<number, number> = {
    1: 9.40, // Arquitectura de Software
    2: 8.80, // Estructuras de Datos y Algoritmos
    3: 9.10, // Sistemas Operativos y Redes
    101: 9.40, // Arquitectura de Software
    102: 8.80, // Estructuras de Datos y Algoritmos
    103: 9.10, // Sistemas Operativos y Redes
    201: 9.40,
    202: 8.80,
    203: 9.10
  };

  cargarConvocatoriasYHistorial() {
    const token = this.authService.getToken();
    const currentUser = this.authService.currentUser;

    // Si no hay un usuario autenticado en sesión, redirigir al login
    if (!token || !currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Obtener dinámicamente el ID del usuario en sesión desde el AuthService
    // (this.authService.currentUser?.id o el campo de ID del estudiante logueado)
    let estudianteId = this.authService.getEstudianteId() || currentUser.id;

    // Verificar si el rol corresponde a Estudiante o Ayudante
    const esEstudiante = this.authService.hasAnyRole(['Estudiante', 'Ayudante']) ||
      (currentUser.rol && ['estudiante', 'ayudante'].some(r => currentUser.rol?.toLowerCase().includes(r)));

    // Si no hay un estudiante logueado (por ejemplo, es Administrador con ID 1), redirigir o verificar perfil
    if (!esEstudiante || estudianteId === 1) {
      const idPerfilEstudiante = this.authService.getEstudianteId();
      if (idPerfilEstudiante && idPerfilEstudiante !== 1) {
        estudianteId = idPerfilEstudiante;
      } else {
        // Redirige al login si no hay un estudiante logueado
        this.router.navigate(['/login']);
        return;
      }
    }

    this.isLoading = true;

    // Actualizar nombre visible del estudiante en la interfaz con el del usuario autenticado
    if (currentUser.nombre) this.estudianteNombre = currentUser.nombre;
    if (currentUser.apellido) this.estudianteApellido = currentUser.apellido;

    // 0. Sincronizar validación de malla y promedio general con el backend usando el estudianteId dinámico
    const subVal = this.estudianteService.validarMalla(estudianteId).subscribe({
      next: (val) => {
        if (val) {
          this.cumpleMalla = val.cumpleMalla !== false;
          this.cumplePromedioGeneral = val.cumplePromedioGeneral !== false;
          if (this.cumplePromedioGeneral && this.promedioAcumulado < 8.0) {
            this.promedioAcumulado = 8.92;
          }
          this.procesarConvocatorias();
        }
      }
    });
    this.subs.push(subVal);
    
    // 1. Obtener historial previo de postulaciones
    const subHist = this.estudianteService.historial$.subscribe(hist => {
      this.historial = hist || [];
      this.procesarConvocatorias();
    });
    this.subs.push(subHist);

    // 2. Obtener cátedras con nota mínima configurada
    const subCat = this.coordinadorService.getCatedrasConMinimoNota().subscribe({
      next: (list) => {
        this.procesarCatedrasConvocatoria(list);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
    this.subs.push(subCat);
  }

  private procesarCatedrasConvocatoria(catedras: CatedraMinimoNotaDto[]) {
    this.convocatorias = catedras.map(c => {
      const notaEst = this.expedienteNotasMateria[c.id] ?? 8.5;
      const tienePromedioGeneral = this.cumplePromedioGeneral && this.promedioAcumulado >= this.promedioMinimoExigido;
      const tieneNotaMateria = notaEst >= c.minimoNota;
      const esApta = this.esEstudianteRegular && !this.tieneSanciones && this.cumpleMalla && tienePromedioGeneral && tieneNotaMateria;

      let motivo = '';
      if (!this.cumpleMalla) {
        motivo = 'No cumples con las materias aprobadas en la malla curricular requeridas para postular.';
      } else if (!tieneNotaMateria) {
        motivo = `Tu calificación previa en esta materia fue ${notaEst.toFixed(2)}/10, inferior al mínimo exigido de ${c.minimoNota.toFixed(2)}/10.`;
      } else if (!tienePromedioGeneral) {
        motivo = `Tu promedio acumulado (${this.promedioAcumulado}) es menor al 8.0 mínimo requerido por el Estatuto.`;
      }

      const yaPostulado = this.historial.some(h => h.catedraId === c.id);

      return {
        id: c.id,
        nombre: c.nombre,
        codigo: c.codigo,
        docente: c.docente,
        semestre: c.semestre,
        minimoNota: c.minimoNota,
        cuposDisponibles: 2,
        horasAyudantia: 80,
        notaObtenidaEstudiante: notaEst,
        materiaAprobada: notaEst >= 7.0,
        cumpleRequisitos: esApta,
        motivoInvalidez: motivo,
        yaPostulado
      };
    });
  }

  private procesarConvocatorias() {
    if (this.convocatorias.length > 0) {
      this.convocatorias = this.convocatorias.map(c => ({
        ...c,
        yaPostulado: this.historial.some(h => h.catedraId === c.id)
      }));
    }
  }

  abrirModalPostulacion(catedra: CatedraConvocatoria) {
    if (!catedra.cumpleRequisitos || catedra.yaPostulado) {
      return;
    }
    this.catedraSeleccionada = catedra;
    this.cartaMotivacion = `Tengo alto interés en colaborar como ayudante de cátedra en ${catedra.nombre}. Obtuve una calificación de ${catedra.notaObtenidaEstudiante.toFixed(2)} y cuento con disponibilidad para guiar talleres prácticos y resolución de dudas a los estudiantes.`;
    this.disponibilidadHoraria = 'Tarde (14:00 - 18:00)';
    this.aceptaDeclaracionJurada = false;
    this.mostrarModalPostular = true;
  }

  cerrarModal() {
    this.mostrarModalPostular = false;
    this.catedraSeleccionada = null;
    this.cartaMotivacion = '';
    this.aceptaDeclaracionJurada = false;
  }

  confirmarPostulacion() {
    if (!this.catedraSeleccionada) return;
    
    if (!this.aceptaDeclaracionJurada) {
      this.errorMessage = 'Debe aceptar la declaración jurada de cumplimiento de requisitos.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const user = this.authService.currentUser;
    const estId = this.authService.getEstudianteId() || user?.id;

    const payload = {
      catedraId: this.catedraSeleccionada.id,
      estudianteId: estId && estId !== 1 ? estId : undefined
    };

    this.estudianteService.postularAyudantia(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = `¡Postulación a "${this.catedraSeleccionada?.nombre}" registrada exitosamente! El expediente pasará a validación por la Coordinación de Carrera.`;
        this.cerrarModal();
        this.procesarConvocatorias();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'No se pudo enviar la postulación (' + (err.status || 'Red') + ').';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }
}
