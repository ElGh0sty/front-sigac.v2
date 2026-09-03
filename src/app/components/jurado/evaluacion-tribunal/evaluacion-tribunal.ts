import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { JuradoService, PresentacionDetalleDto, ResultadoPresentacionDto, EvaluacionJuradoDto } from '../../../services/jurado.service';

@Component({
  selector: 'app-evaluacion-tribunal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluacion-tribunal.html',
  styleUrls: ['./evaluacion-tribunal.css']
})
export class EvaluacionTribunalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private juradoService = inject(JuradoService);
  private route = inject(ActivatedRoute);

  presentaciones: PresentacionDetalleDto[] = [];
  presentacionSeleccionada: PresentacionDetalleDto | null = null;
  resultadoActual: ResultadoPresentacionDto | null = null;

  evaluacionForm!: FormGroup;
  isSubmitting = false;
  isLoadingResultado = false;
  mensajeExito = '';
  mensajeError = '';
  tabActiva: 'calificar' | 'resultado' = 'calificar';

  // Rúbrica de evaluación académica con ponderaciones
  criteriosRubrica = [
    { id: 'dominioTema', nombre: 'Dominio Conceptual y Teórico del Tema', peso: '35%', min: 0, max: 10 },
    { id: 'claridadPedagogica', nombre: 'Claridad Pedagógica y Didáctica Docente', peso: '30%', min: 0, max: 10 },
    { id: 'recursosDidacticos', nombre: 'Uso Efectivo de Recursos Didácticos Digitales', peso: '15%', min: 0, max: 10 },
    { id: 'manejoPreguntas', nombre: 'Solvencia y Argumentación ante Preguntas del Jurado', peso: '20%', min: 0, max: 10 }
  ];

  ngOnInit(): void {
    this.iniciarFormulario();
    this.cargarPresentaciones();
  }

  iniciarFormulario(): void {
    this.evaluacionForm = this.fb.group({
      criterio1: [9.0, [Validators.required, Validators.min(1), Validators.max(10)]],
      criterio2: [9.0, [Validators.required, Validators.min(1), Validators.max(10)]],
      criterio3: [9.0, [Validators.required, Validators.min(1), Validators.max(10)]],
      criterio4: [9.0, [Validators.required, Validators.min(1), Validators.max(10)]],
      notaFinalCalculada: [{ value: 9.0, disabled: true }],
      observaciones: ['', [Validators.required, Validators.minLength(15)]]
    });

    // Recalcular promedio ponderado al cambiar cualquier criterio
    this.evaluacionForm.valueChanges.subscribe(val => {
      const c1 = Number(val.criterio1 || 0);
      const c2 = Number(val.criterio2 || 0);
      const c3 = Number(val.criterio3 || 0);
      const c4 = Number(val.criterio4 || 0);

      // Ponderación: 35% + 30% + 15% + 20% = 100%
      const ponderado = (c1 * 0.35) + (c2 * 0.30) + (c3 * 0.15) + (c4 * 0.20);
      const notaRedondeada = Math.round(ponderado * 100) / 100;
      this.evaluacionForm.get('notaFinalCalculada')?.setValue(notaRedondeada, { emitEvent: false });
    });
  }

  cargarPresentaciones(): void {
    this.juradoService.getPresentaciones().subscribe({
      next: (data) => {
        this.presentaciones = data;
        this.route.paramMap.subscribe(params => {
          const presId = params.get('presentacionId');
          if (presId) {
            const found = this.presentaciones.find(p => p.id === Number(presId));
            if (found) {
              this.seleccionarPresentacion(found);
              return;
            }
          }
          if (this.presentaciones.length > 0) {
            this.seleccionarPresentacion(this.presentaciones[0]);
          }
        });
      }
    });
  }

  seleccionarPresentacion(p: PresentacionDetalleDto): void {
    this.presentacionSeleccionada = p;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.evaluacionForm.patchValue({
      observaciones: p.yaEvaluadoPorMi
        ? 'Evaluación completada previamente por el jurado con calificación satisfactoria.'
        : ''
    });

    if (p.yaEvaluadoPorMi) {
      this.tabActiva = 'resultado';
    } else {
      this.tabActiva = 'calificar';
    }

    this.cargarResultado(p.id);
  }

  cargarResultado(presentacionId: number): void {
    this.isLoadingResultado = true;
    this.juradoService.getResultadoPresentacion(presentacionId).subscribe({
      next: (res) => {
        this.resultadoActual = res;
        this.isLoadingResultado = false;
      },
      error: () => {
        this.isLoadingResultado = false;
      }
    });
  }

  /**
   * Envía la evaluación del miembro del jurado
   * Consume: POST /api/jurado/presentaciones/{id}/evaluaciones
   */
  enviarEvaluacion(): void {
    if (!this.presentacionSeleccionada) return;

    if (this.evaluacionForm.invalid) {
      this.evaluacionForm.markAllAsTouched();
      this.mensajeError = 'Por favor complete todos los criterios de la rúbrica y las observaciones técnicas.';
      return;
    }

    this.isSubmitting = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const val = this.evaluacionForm.getRawValue();
    const dto: EvaluacionJuradoDto = {
      nota: Number(val.notaFinalCalculada || 9.0),
      observaciones: val.observaciones,
      criterios: {
        dominioTema: Number(val.criterio1),
        claridadPedagogica: Number(val.criterio2),
        recursosDidacticos: Number(val.criterio3),
        manejoPreguntas: Number(val.criterio4)
      }
    };

    const currentPresId = this.presentacionSeleccionada.id;
    this.juradoService.registrarEvaluacion(currentPresId, dto).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.mensajeExito = res.mensaje;
        if (this.presentacionSeleccionada) {
          this.presentacionSeleccionada.yaEvaluadoPorMi = true;
          this.presentacionSeleccionada.estado = 'Evaluada';
        }
        // Recargar el resultado consolidado
        this.cargarResultado(currentPresId);
        this.tabActiva = 'resultado';
      },
      error: () => {
        this.isSubmitting = false;
        this.mensajeError = 'No se pudo guardar la evaluación en el servidor del jurado.';
      }
    });
  }
}
