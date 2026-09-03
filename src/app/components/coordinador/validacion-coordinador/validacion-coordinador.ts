import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { JuradoService, CrearPresentacionDto } from '../../../services/jurado.service';
import { CoordinadorService } from '../../../services/coordinador.service';

/**
 * Interface del Expediente Académico del Estudiante Postulante.
 * NOTA DE INTEGRACIÓN TÉCNICA (50% de la Malla y Promedios):
 * -------------------------------------------------------------
 * Para verificar que el estudiante tiene el 50% de la malla aprobada y promedios superiores:
 * 1. En un entorno productivo con SIS/ERP Universitario (e.g. Banner, SAP SLCM, o endpoints .NET de Expediente):
 *    Se debe invocar un servicio `ExpedienteService.getExpedienteAcademico(estudianteId)` que consulte:
 *    - `creditosAprobados` / `creditosTotalesMalla` (o `asignaturasAprobadas` / `asignaturasTotales`).
 *    - `promedioEstudiante`: GPA acumulado en la carrera.
 *    - `promedioCarrera`: Media ponderada de todos los estudiantes activos en la misma carrera y cohorte.
 *    - `promedioCurso`: Media histórica de calificaciones del curso específico al que postula como ayudante.
 * 2. El modelo de datos expuesto a continuación implementa las reglas de validación en el cliente
 *    para bloquear o autorizar la convocatoria del Tribunal de Sustentación.
 */
export interface PostulanteEvaluacion {
  ayudantiaId: number;
  estudianteId: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  correo: string;
  carrera: string;
  catedraId: number;
  catedraNombre: string;
  semestreCatedra: string;
  docenteTitularNombre: string;
  // Requisito 1: Aprobación del Docente responsable
  acuerdoDocenteAprobado: boolean;
  docenteObservaciones?: string;
  // Requisito 2: 50% de la malla curricular aprobada
  porcentajeMallaAprobada: number; // e.g. 65 (%)
  creditosAprobados: number;
  creditosTotales: number;
  // Requisito 3: Promedio superior al promedio de carrera
  promedioEstudiante: number; // e.g. 9.15
  promedioGeneralCarrera: number; // e.g. 8.30
  // Requisito 4: Promedio en la materia superior al promedio del curso
  notaEstudianteEnCatedra: number; // e.g. 9.70
  promedioHistoricoCurso: number; // e.g. 7.90
  // Estado general
  cumpleTodosRequisitos: boolean;
  estado: 'Pendiente Revisión' | 'Tribunal Asignado' | 'Rechazada';
  temaSilaboPropuesto?: string;
}

@Component({
  selector: 'app-validacion-coordinador',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './validacion-coordinador.html',
  styleUrls: ['./validacion-coordinador.css']
})
export class ValidacionCoordinadorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private juradoService = inject(JuradoService);
  private coordinadorService = inject(CoordinadorService);
  private route = inject(ActivatedRoute);

  // Lista de postulantes pendientes de revisión por la Coordinación
  postulantes: PostulanteEvaluacion[] = [
    {
      ayudantiaId: 101,
      estudianteId: 1,
      nombres: 'Alejandro David',
      apellidos: 'García Mendoza',
      cedula: '1724568910',
      correo: 'alejandro.garcia@universidad.edu',
      carrera: 'Ingeniería de Software',
      catedraId: 201,
      catedraNombre: 'Cálculo Avanzado',
      semestreCatedra: '2026-2',
      docenteTitularNombre: 'Dra. Evelyn Vance',
      acuerdoDocenteAprobado: true,
      docenteObservaciones: 'Estudiante con excelente desenvolvimiento didáctico y dominio conceptual.',
      porcentajeMallaAprobada: 62.5, // > 50% CUMPLE
      creditosAprobados: 150,
      creditosTotales: 240,
      promedioEstudiante: 9.20, // > 8.40 CUMPLE
      promedioGeneralCarrera: 8.40,
      notaEstudianteEnCatedra: 9.80, // > 7.95 CUMPLE
      promedioHistoricoCurso: 7.95,
      cumpleTodosRequisitos: true,
      estado: 'Pendiente Revisión',
      temaSilaboPropuesto: 'Unidad 3: Integrales de Línea y Teorema de Stokes en Modelación Física'
    },
    {
      ayudantiaId: 102,
      estudianteId: 2,
      nombres: 'Valeria Sofía',
      apellidos: 'Ramos Salazar',
      cedula: '1719876542',
      correo: 'valeria.ramos@universidad.edu',
      carrera: 'Ingeniería de Software',
      catedraId: 202,
      catedraNombre: 'Estructuras de Datos y Algoritmos',
      semestreCatedra: '2026-2',
      docenteTitularNombre: 'Ing. Carlos Zambrano',
      acuerdoDocenteAprobado: true,
      docenteObservaciones: 'Aprobado formalmente por el docente responsable.',
      porcentajeMallaAprobada: 54.0, // > 50% CUMPLE
      creditosAprobados: 130,
      creditosTotales: 240,
      promedioEstudiante: 9.05, // > 8.40 CUMPLE
      promedioGeneralCarrera: 8.40,
      notaEstudianteEnCatedra: 9.40, // > 8.10 CUMPLE
      promedioHistoricoCurso: 8.10,
      cumpleTodosRequisitos: true,
      estado: 'Pendiente Revisión',
      temaSilaboPropuesto: 'Unidad 4: Árboles B y Balanceo AVL aplicados a Bases de Datos'
    },
    {
      ayudantiaId: 103,
      estudianteId: 3,
      nombres: 'Mateo Sebastián',
      apellidos: 'López Morales',
      cedula: '1723445566',
      correo: 'mateo.lopez@universidad.edu',
      carrera: 'Ingeniería de Software',
      catedraId: 203,
      catedraNombre: 'Física Clásica',
      semestreCatedra: '2026-2',
      docenteTitularNombre: 'Dr. Fernando Ortiz',
      acuerdoDocenteAprobado: false, // NO CUMPLE acuerdo docente
      docenteObservaciones: 'Pendiente de entrevista presencial con el docente titular.',
      porcentajeMallaAprobada: 42.0, // < 50% NO CUMPLE
      creditosAprobados: 100,
      creditosTotales: 240,
      promedioEstudiante: 8.15, // < 8.40 NO CUMPLE
      promedioGeneralCarrera: 8.40,
      notaEstudianteEnCatedra: 8.50,
      promedioHistoricoCurso: 8.20,
      cumpleTodosRequisitos: false,
      estado: 'Pendiente Revisión',
      temaSilaboPropuesto: 'Unidad 2: Dinámica Rotacional y Momento de Inercia'
    }
  ];

  // Catálogo de autoridades y docentes expertos para el Tribunal
  decanosDisponibles = [
    { id: 10, nombre: 'Dr. Roberto Zambrano - Decano Facultad de Ingeniería y Ciencias Aplicadas' },
    { id: 11, nombre: 'Dra. María Elena Castro - Subdecana Académica' }
  ];

  coordinadoresDisponibles = [
    { id: 20, nombre: 'Mgtr. Patricia Silva - Coordinadora de Carrera de Software' },
    { id: 21, nombre: 'Dr. Juan Carlos Vaca - Coordinador de Sistemas de Información' }
  ];

  docentesExpertosDisponibles = [
    'Ing. Marco Morales (PhD en Métodos Numéricos)',
    'Dra. Elena Ruiz (Especialista en Ecuaciones Diferenciales y Modelación)',
    'Ing. Diego Cárdenas (Experto en Análisis de Complejidad Algorítmica)',
    'Ing. Gabriel Torres (Especialista en Arquitectura de Software)',
    'Dra. Andrea Morales (Especialista en Inteligencia Artificial y Datos)'
  ];

  postulanteSeleccionado: PostulanteEvaluacion | null = null;
  tribunalForm!: FormGroup;
  minimoNotaForm!: FormGroup;

  isSubmitting = false;
  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    this.iniciarFormularios();

    // Comprobar si se ingresó mediante ruta con parámetro :solicitudId
    this.route.paramMap.subscribe(params => {
      const solicitudId = params.get('solicitudId');
      if (solicitudId) {
        const encontrada = this.postulantes.find(p => p.ayudantiaId === Number(solicitudId) || p.estudianteId === Number(solicitudId));
        if (encontrada) {
          this.seleccionarPostulante(encontrada);
          return;
        }
      }
      if (this.postulantes.length > 0) {
        this.seleccionarPostulante(this.postulantes[0]);
      }
    });
  }

  iniciarFormularios(): void {
    // Formulario reactivo para convocar el Tribunal (Jurado)
    // Se requiere: Decano, Coordinador, 2 Docentes expertos, Fecha y Tema del sílabo
    this.tribunalForm = this.fb.group({
      ayudantiaId: [null, [Validators.required]],
      fecha: ['', [Validators.required]],
      decanoId: [10, [Validators.required]],
      coordinadorCarreraId: [20, [Validators.required]],
      docenteExperto1: [this.docentesExpertosDisponibles[0], [Validators.required]],
      docenteExperto2: [this.docentesExpertosDisponibles[1], [Validators.required]],
      temaSilabo: ['', [Validators.required, Validators.minLength(10)]],
      lugarOEnlace: ['Aula Magna 204 / Meet: meet.google.com/sig-trib-ayud', [Validators.required]]
    });

    // Formulario para parametrizar nota mínima de la cátedra
    this.minimoNotaForm = this.fb.group({
      catedraId: [201, Validators.required],
      minimoNota: [8.0, [Validators.required, Validators.min(7.0), Validators.max(10.0)]]
    });
  }

  seleccionarPostulante(postulante: PostulanteEvaluacion): void {
    this.postulanteSeleccionado = postulante;
    this.mensajeExito = '';
    this.mensajeError = '';

    // Consultar servicio normativo para confirmar datos
    this.coordinadorService.getValidacionRequisitosEstudiante(postulante.estudianteId).subscribe({
      next: (req) => {
        if (req && this.postulanteSeleccionado) {
          this.postulanteSeleccionado.porcentajeMallaAprobada = req.porcentajeMalla;
          this.postulanteSeleccionado.promedioEstudiante = req.promedioEstudiante;
          this.postulanteSeleccionado.promedioGeneralCarrera = req.promedioCarrera;
          this.postulanteSeleccionado.promedioHistoricoCurso = req.promedioCurso;
          this.postulanteSeleccionado.cumpleTodosRequisitos = req.cumpleRequisitos && this.postulanteSeleccionado.acuerdoDocenteAprobado;
        }
      }
    });

    this.tribunalForm.patchValue({
      ayudantiaId: postulante.ayudantiaId,
      temaSilabo: postulante.temaSilaboPropuesto || '',
      fecha: this.getFechaDefault()
    });

    this.minimoNotaForm.patchValue({
      catedraId: postulante.catedraId
    });
  }

  private getFechaDefault(): string {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  }

  /**
   * Envía el formulario para crear la presentación ante el tribunal
   * Consume: POST /api/jurado/presentaciones
   */
  asignarTribunal(): void {
    if (!this.postulanteSeleccionado) return;

    if (!this.postulanteSeleccionado.cumpleTodosRequisitos) {
      this.mensajeError = 'No se puede convocar el tribunal: el estudiante no cumple con todos los requisitos académicos (50% malla, promedios o acuerdo docente).';
      return;
    }

    if (this.tribunalForm.invalid) {
      this.tribunalForm.markAllAsTouched();
      this.mensajeError = 'Por favor complete todos los campos obligatorios del Tribunal.';
      return;
    }

    const formVal = this.tribunalForm.value;

    // Validación de que los 2 docentes expertos sean distintos
    if (formVal.docenteExperto1 === formVal.docenteExperto2) {
      this.mensajeError = 'Los dos docentes expertos asignados deben ser profesionales diferentes.';
      return;
    }

    this.isSubmitting = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const dto: CrearPresentacionDto = {
      ayudantiaId: Number(formVal.ayudantiaId),
      fecha: formVal.fecha,
      profesoresAsignados: [formVal.docenteExperto1, formVal.docenteExperto2],
      decanoId: Number(formVal.decanoId),
      coordinadorCarreraId: Number(formVal.coordinadorCarreraId),
      temaSilabo: formVal.temaSilabo,
      lugarOEnlace: formVal.lugarOEnlace
    };

    this.juradoService.crearPresentacion(dto).subscribe({
      next: (resp) => {
        this.isSubmitting = false;
        this.mensajeExito = `¡Tribunal convocado exitosamente! Se notificó al Decano, Coordinador y a los 2 Docentes expertos para la sustentación del día ${new Date(dto.fecha).toLocaleString()}.`;
        if (this.postulanteSeleccionado) {
          this.postulanteSeleccionado.estado = 'Tribunal Asignado';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.mensajeError = 'Ocurrió un error al registrar la presentación en el servidor.';
      }
    });
  }

  /**
   * Actualiza la nota mínima requerida para la cátedra
   * Consume: PUT /api/coordinador/catedras/{id}/minimo-nota
   */
  guardarMinimoNota(): void {
    if (this.minimoNotaForm.invalid) return;

    const { catedraId, minimoNota } = this.minimoNotaForm.value;
    this.coordinadorService.actualizarMinimoNota(catedraId, minimoNota).subscribe({
      next: (res) => {
        this.mensajeExito = res.mensaje;
      }
    });
  }
}
