import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EstudianteService } from '../../../services/estudiante.service';

export interface AnexoInforme {
  id: string;
  nombre: string;
  tamanoKb: number;
  tipo: 'documento_firmado' | 'captura_videollamada';
  fechaCarga: string;
  archivo?: File;
}

export interface RegistroInformeAyudantia {
  id: number;
  numeroResolucion: string; // e.g. "RES-FAC-2026-084-AYUD"
  tipoInforme: 'Mensual' | 'Final de Ciclo';
  ayudantiaId: number;
  catedraNombre: string;
  periodo: string;
  horasTotales: number;
  diasPorSemana: number;
  modalidad: 'Presencial' | 'Virtual' | 'Híbrida';
  temasImpartidos: string;
  anexos: AnexoInforme[];
  estado: 'Borrador' | 'Enviado a Coordinación' | 'Aprobado por Docente';
  fechaCreacion: string;
}

@Component({
  selector: 'app-informes-ayudantia',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './informes-ayudantia.html',
  styleUrls: ['./informes-ayudantia.css']
})
export class InformesAyudantiaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private estudianteService = inject(EstudianteService);

  informeForm!: FormGroup;
  anexosCargados: AnexoInforme[] = [];
  isSubmitting = false;
  mensajeExito = '';
  mensajeError = '';

  // Historial de ayudantías activas
  ayudantias = [
    { id: 101, nombre: 'Cálculo Avanzado - Grupo 1', resolucionDefault: 'RES-FAC-2026-084-AYUD' },
    { id: 102, nombre: 'Estructuras de Datos y Algoritmos - Grupo 2', resolucionDefault: 'RES-FAC-2026-092-AYUD' }
  ];

  // Informes registrados previamente
  informesRegistrados: RegistroInformeAyudantia[] = [
    {
      id: 1,
      numeroResolucion: 'RES-FAC-2026-084-AYUD',
      tipoInforme: 'Mensual',
      ayudantiaId: 101,
      catedraNombre: 'Cálculo Avanzado',
      periodo: 'Agosto 2026',
      horasTotales: 24,
      diasPorSemana: 3,
      modalidad: 'Presencial',
      temasImpartidos: 'Ejercicios de integración múltiple, Teorema de Fubini y cambio de variables con Jacobiano.',
      anexos: [
        {
          id: 'anx-1',
          nombre: 'Hojas_Asistencia_Firmadas_Agosto.pdf',
          tamanoKb: 1420,
          tipo: 'documento_firmado',
          fechaCarga: '2026-08-31'
        }
      ],
      estado: 'Aprobado por Docente',
      fechaCreacion: '2026-08-31 16:20'
    },
    {
      id: 2,
      numeroResolucion: 'RES-FAC-2026-084-AYUD',
      tipoInforme: 'Mensual',
      ayudantiaId: 101,
      catedraNombre: 'Cálculo Avanzado',
      periodo: 'Septiembre 2026',
      horasTotales: 28,
      diasPorSemana: 3,
      modalidad: 'Virtual',
      temasImpartidos: 'Campos vectoriales, rotacional, divergencia y resolución de guías de estudio para el examen intermedio.',
      anexos: [
        {
          id: 'anx-2',
          nombre: 'Captura_Meet_Sesion_09_02.png',
          tamanoKb: 840,
          tipo: 'captura_videollamada',
          fechaCarga: '2026-09-02'
        },
        {
          id: 'anx-3',
          nombre: 'Registro_Asistencia_Zoom_CSV.csv',
          tamanoKb: 45,
          tipo: 'captura_videollamada',
          fechaCarga: '2026-09-02'
        }
      ],
      estado: 'Enviado a Coordinación',
      fechaCreacion: '2026-09-02 18:00'
    }
  ];

  meses = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' }
  ];

  ngOnInit(): void {
    this.iniciarFormulario();
  }

  iniciarFormulario(): void {
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    this.informeForm = this.fb.group({
      ayudantiaId: [101, Validators.required],
      numeroResolucion: ['RES-FAC-2026-084-AYUD', [Validators.required, Validators.pattern(/^[A-Z0-9\-_]{5,30}$/)]],
      tipoInforme: ['Mensual', Validators.required],
      mes: [mesActual, Validators.required],
      anio: [anioActual, [Validators.required, Validators.min(2020), Validators.max(2035)]],
      horasTotales: [20, [Validators.required, Validators.min(1), Validators.max(120)]],
      diasPorSemana: [3, [Validators.required, Validators.min(1), Validators.max(7)]],
      modalidad: ['Presencial', Validators.required],
      temasImpartidos: ['', [Validators.required, Validators.minLength(20)]]
    });

    // Actualizar resolución al cambiar cátedra
    this.informeForm.get('ayudantiaId')?.valueChanges.subscribe((id) => {
      const encontrada = this.ayudantias.find(a => a.id === Number(id));
      if (encontrada) {
        this.informeForm.patchValue({ numeroResolucion: encontrada.resolucionDefault });
      }
    });
  }

  onModalidadChange(): void {
    // Si cambia modalidad, advertir sobre el tipo de anexo esperado
  }

  onAnexoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const mod = this.informeForm.get('modalidad')?.value;
    const tipoAnexo: 'documento_firmado' | 'captura_videollamada' =
      mod === 'Virtual' ? 'captura_videollamada' : 'documento_firmado';

    Array.from(input.files).forEach(file => {
      this.anexosCargados.push({
        id: 'anx-' + Date.now() + Math.random().toString(36).substring(2, 6),
        nombre: file.name,
        tamanoKb: Math.round(file.size / 1024),
        tipo: tipoAnexo,
        fechaCarga: new Date().toISOString().slice(0, 10),
        archivo: file
      });
    });

    input.value = '';
  }

  eliminarAnexo(id: string): void {
    this.anexosCargados = this.anexosCargados.filter(a => a.id !== id);
  }

  guardarInforme(): void {
    if (this.informeForm.invalid) {
      this.informeForm.markAllAsTouched();
      this.mensajeError = 'Por favor complete todos los campos obligatorios del informe y el número de resolución.';
      return;
    }

    if (this.anexosCargados.length === 0) {
      this.mensajeError = 'Debe adjuntar al menos un comprobante probatorio (hoja de asistencia firmada o captura de videollamada con fecha).';
      return;
    }

    this.isSubmitting = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const val = this.informeForm.value;
    const ayudantiaSeleccionada = this.ayudantias.find(a => a.id === Number(val.ayudantiaId));
    const mesObj = this.meses.find(m => m.num === Number(val.mes));

    const nuevoInforme: RegistroInformeAyudantia = {
      id: Date.now(),
      numeroResolucion: val.numeroResolucion,
      tipoInforme: val.tipoInforme,
      ayudantiaId: Number(val.ayudantiaId),
      catedraNombre: ayudantiaSeleccionada ? ayudantiaSeleccionada.nombre : 'Cátedra de Ayudantía',
      periodo: val.tipoInforme === 'Mensual' ? `${mesObj?.nombre} ${val.anio}` : `Ciclo Completo ${val.anio}`,
      horasTotales: Number(val.horasTotales),
      diasPorSemana: Number(val.diasPorSemana),
      modalidad: val.modalidad,
      temasImpartidos: val.temasImpartidos,
      anexos: [...this.anexosCargados],
      estado: 'Enviado a Coordinación',
      fechaCreacion: new Date().toLocaleString()
    };

    // Llamar al servicio existente de estudiante para mantener sincronía
    this.estudianteService.generarInformeMensual({
      ayudantiaId: Number(val.ayudantiaId),
      mes: Number(val.mes),
      anio: Number(val.anio)
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.informesRegistrados.unshift(nuevoInforme);
        this.mensajeExito = `¡Informe registrado exitosamente bajo la Resolución ${nuevoInforme.numeroResolucion}! Se ha enviado a Coordinación Académica para su validación formal.`;
        this.anexosCargados = [];
        this.informeForm.patchValue({
          temasImpartidos: ''
        });
      },
      error: () => {
        this.isSubmitting = false;
        this.informesRegistrados.unshift(nuevoInforme);
        this.mensajeExito = `Informe registrado localmente con Resolución ${nuevoInforme.numeroResolucion}.`;
      }
    });
  }
}
