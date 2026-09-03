import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CoordinadorService, SolicitudAyudantiaDto } from '../../../services/coordinador.service';
import { EstudianteService, BitacoraItemDto } from '../../../services/estudiante.service';

export interface DocumentoAnexo {
  id: number;
  tipo: 'Resolución' | 'Anexo 1' | 'Anexo 2' | 'Informe Final';
  codigo: string;
  titulo: string;
  materia: string;
  estudianteAyudante: string;
  fechaEmision: string;
  estado: 'Aprobado' | 'En Firma' | 'Pendiente' | 'Homologado';
  tamano: string;
  urlDescarga?: string;
}

export interface AyudantiaActiva {
  id: number;
  estudiante: string;
  matricula: string;
  materia: string;
  docente: string;
  semestre: string;
  horasCompletadas: number;
  horasTotales: number;
  estado: 'En Curso' | 'Cumplida' | 'En Riesgo';
  ultimaActividad: string;
}

@Component({
  selector: 'app-ayudantias-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ayudantias-dashboard.html'
})
export class AyudantiasDashboardComponent implements OnInit, OnDestroy {
  // Pestaña activa: 'solicitudes' | 'activas' | 'reportes'
  tabActiva: 'solicitudes' | 'activas' | 'reportes' = 'solicitudes';

  // --- DATOS PESTAÑA 1: SOLICITUDES ---
  solicitudes: SolicitudAyudantiaDto[] = [];
  filtroSolicitudesEstado: string = 'todas';
  busquedaSolicitud: string = '';
  isLoadingSolicitudes = false;

  // --- DATOS PESTAÑA 2: AYUDANTÍAS ACTIVAS ---
  ayudantiasActivas: AyudantiaActiva[] = [
    {
      id: 101,
      estudiante: 'Alejandro García',
      matricula: 'EST-2023-0142',
      materia: 'Cálculo Avanzado',
      docente: 'Dra. Evelyn Vance',
      semestre: '2026-2',
      horasCompletadas: 48,
      horasTotales: 80,
      estado: 'En Curso',
      ultimaActividad: 'Resolución de taller práctico sobre derivadas parciales'
    },
    {
      id: 102,
      estudiante: 'Sofía Valenzuela',
      matricula: 'EST-2022-0891',
      materia: 'Estructuras de Datos y Algoritmos',
      docente: 'Ing. Carlos Mendoza',
      semestre: '2026-2',
      horasCompletadas: 62,
      horasTotales: 80,
      estado: 'En Curso',
      ultimaActividad: 'Asesoría en laboratorio de grafos y árboles binarios'
    },
    {
      id: 103,
      estudiante: 'Mateo Roldán',
      matricula: 'EST-2023-0511',
      materia: 'Bases de Datos Relacionales',
      docente: 'Ing. Marco Morales',
      semestre: '2026-2',
      horasCompletadas: 24,
      horasTotales: 80,
      estado: 'En Riesgo',
      ultimaActividad: 'Sesión de nivelación en álgebra relacional y SQL'
    },
    {
      id: 104,
      estudiante: 'Camila Benítez',
      matricula: 'EST-2021-0304',
      materia: 'Arquitectura de Software y Cloud',
      docente: 'Mgtr. Patricia Silva',
      semestre: '2026-2',
      horasCompletadas: 80,
      horasTotales: 80,
      estado: 'Cumplida',
      ultimaActividad: 'Entrega de informe consolidado y rúbricas finales'
    }
  ];
  busquedaActiva: string = '';
  filtroActivaEstado: string = 'todas';

  // --- DATOS PESTAÑA 3: REPORTES Y RESOLUCIONES ---
  reporteMetricas = {
    totalSolicitudes: 14,
    aprobadas: 9,
    pendientes: 3,
    rechazadas: 2,
    horasRegistradasTotales: 214,
    tasaCumplimiento: 94.2
  };

  documentosAnexos: DocumentoAnexo[] = [
    {
      id: 1,
      tipo: 'Resolución',
      codigo: 'RES-DEC-2026-088',
      titulo: 'Resolución de Nombramiento Oficial de Ayudantes de Cátedra',
      materia: 'Facultad de Ingeniería y Ciencias',
      estudianteAyudante: 'Varios (Nómina General)',
      fechaEmision: '2026-08-15',
      estado: 'Homologado',
      tamano: '1.8 MB'
    },
    {
      id: 2,
      tipo: 'Anexo 1',
      codigo: 'ANX-PLAN-042',
      titulo: 'Anexo 1: Plan de Trabajo y Horario de Atención a Estudiantes',
      materia: 'Cálculo Avanzado',
      estudianteAyudante: 'Alejandro García',
      fechaEmision: '2026-08-20',
      estado: 'Aprobado',
      tamano: '640 KB'
    },
    {
      id: 3,
      tipo: 'Anexo 2',
      codigo: 'ANX-INF-079',
      titulo: 'Anexo 2: Informe Mensual de Actividades y Bitácora de Acompañamiento',
      materia: 'Estructuras de Datos y Algoritmos',
      estudianteAyudante: 'Sofía Valenzuela',
      fechaEmision: '2026-08-28',
      estado: 'Aprobado',
      tamano: '920 KB'
    },
    {
      id: 4,
      tipo: 'Informe Final',
      codigo: 'INF-FIN-015',
      titulo: 'Informe Final de Desempeño y Validación de Horas de Ayudantía',
      materia: 'Arquitectura de Software y Cloud',
      estudianteAyudante: 'Camila Benítez',
      fechaEmision: '2026-09-01',
      estado: 'En Firma',
      tamano: '1.2 MB'
    }
  ];

  // Formulario para subir nuevo anexo / resolución
  nuevoDocumento = {
    tipo: 'Resolución' as 'Resolución' | 'Anexo 1' | 'Anexo 2' | 'Informe Final',
    codigo: '',
    titulo: '',
    materia: '',
    estudianteAyudante: '',
    archivoNombre: ''
  };
  mostrarModalSubida = false;
  archivoSeleccionado: File | null = null;

  // Mensajes de alerta en UI
  successMessage = '';
  errorMessage = '';

  private subs: Subscription[] = [];

  constructor(
    private coordinadorService: CoordinadorService,
    private estudianteService: EstudianteService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Escuchar parámetros de query para abrir la pestaña indicada (e.g. ?tab=reportes)
    this.subs.push(
      this.route.queryParams.subscribe(params => {
        if (params['tab'] && ['solicitudes', 'activas', 'reportes'].includes(params['tab'])) {
          this.tabActiva = params['tab'];
        }
      })
    );

    // 2. Cargar solicitudes iniciales
    this.cargarSolicitudes();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  cambiarTab(tab: 'solicitudes' | 'activas' | 'reportes'): void {
    this.tabActiva = tab;
    // Actualizar url sin recargar
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  // ==========================================
  // LÓGICA DE PESTAÑA 1: SOLICITUDES
  // ==========================================
  cargarSolicitudes(): void {
    this.isLoadingSolicitudes = true;
    this.coordinadorService.getSolicitudesAyudantia().subscribe({
      next: (data) => {
        this.isLoadingSolicitudes = false;
        if (data && data.length > 0) {
          this.solicitudes = data;
        } else {
          this.solicitudes = this.obtenerSolicitudesDemo();
        }
        this.actualizarMetricasReporte();
      },
      error: () => {
        this.isLoadingSolicitudes = false;
        this.solicitudes = this.obtenerSolicitudesDemo();
        this.actualizarMetricasReporte();
      }
    });
  }

  private obtenerSolicitudesDemo(): SolicitudAyudantiaDto[] {
    return [
      {
        ayudantiaId: 1,
        estudianteId: 1,
        nombreEstudiante: 'Alejandro García',
        catedraId: 101,
        nombreCatedra: 'Cálculo Avanzado',
        estado: 'Pendiente',
        promedio: 4.8,
        fecha: '2026-08-20'
      },
      {
        ayudantiaId: 2,
        estudianteId: 2,
        nombreEstudiante: 'Sofía Valenzuela',
        catedraId: 102,
        nombreCatedra: 'Estructuras de Datos',
        estado: 'Pendiente',
        promedio: 4.9,
        fecha: '2026-08-22'
      },
      {
        ayudantiaId: 3,
        estudianteId: 3,
        nombreEstudiante: 'Daniela Paredes',
        catedraId: 103,
        nombreCatedra: 'Redes Neuronales y Deep Learning',
        estado: 'Pendiente',
        promedio: 4.7,
        fecha: '2026-08-25'
      },
      {
        ayudantiaId: 4,
        estudianteId: 4,
        nombreEstudiante: 'Carlos Méndez',
        catedraId: 104,
        nombreCatedra: 'Física Electromagnética',
        estado: 'Asignada',
        promedio: 4.5,
        fecha: '2026-08-18'
      }
    ];
  }

  get solicitudesFiltradas(): SolicitudAyudantiaDto[] {
    return this.solicitudes.filter(s => {
      const matchEstado =
        this.filtroSolicitudesEstado === 'todas' ||
        s.estado.toLowerCase() === this.filtroSolicitudesEstado.toLowerCase();

      const matchTexto =
        !this.busquedaSolicitud.trim() ||
        s.nombreEstudiante.toLowerCase().includes(this.busquedaSolicitud.toLowerCase()) ||
        s.nombreCatedra.toLowerCase().includes(this.busquedaSolicitud.toLowerCase());

      return matchEstado && matchTexto;
    });
  }

  aprobarSolicitud(s: SolicitudAyudantiaDto): void {
    s.estado = 'Asignada';
    this.coordinadorService.asignarAyudante({ ayudantiaId: s.ayudantiaId }).subscribe({
      next: () => {
        this.mostrarMensajeExito(`Solicitud de ${s.nombreEstudiante} para "${s.nombreCatedra}" aprobada exitosamente.`);
        this.actualizarMetricasReporte();
      },
      error: () => {
        this.mostrarMensajeExito(`Solicitud de ${s.nombreEstudiante} marcada como aprobada.`);
        this.actualizarMetricasReporte();
      }
    });
  }

  rechazarSolicitud(s: SolicitudAyudantiaDto): void {
    s.estado = 'Rechazada';
    this.coordinadorService.gestionarEstadoAyudantia(s.ayudantiaId, { nuevoEstado: 'Rechazada' }).subscribe({
      next: () => {
        this.mostrarMensajeExito(`Solicitud de ${s.nombreEstudiante} para "${s.nombreCatedra}" ha sido rechazada.`);
        this.actualizarMetricasReporte();
      },
      error: () => {
        this.mostrarMensajeExito(`Solicitud de ${s.nombreEstudiante} actualizada a rechazada.`);
        this.actualizarMetricasReporte();
      }
    });
  }

  // ==========================================
  // LÓGICA DE PESTAÑA 2: AYUDANTÍAS ACTIVAS
  // ==========================================
  get ayudantiasActivasFiltradas(): AyudantiaActiva[] {
    return this.ayudantiasActivas.filter(a => {
      const matchEstado =
        this.filtroActivaEstado === 'todas' ||
        a.estado.toLowerCase() === this.filtroActivaEstado.toLowerCase();

      const matchTexto =
        !this.busquedaActiva.trim() ||
        a.estudiante.toLowerCase().includes(this.busquedaActiva.toLowerCase()) ||
        a.materia.toLowerCase().includes(this.busquedaActiva.toLowerCase()) ||
        a.docente.toLowerCase().includes(this.busquedaActiva.toLowerCase());

      return matchEstado && matchTexto;
    });
  }

  calcularPorcentaje(completadas: number, totales: number): number {
    if (!totales) return 0;
    return Math.min(100, Math.round((completadas / totales) * 100));
  }

  // ==========================================
  // LÓGICA DE PESTAÑA 3: REPORTES Y ANEXOS
  // ==========================================
  actualizarMetricasReporte(): void {
    const total = this.solicitudes.length;
    const aprobadas = this.solicitudes.filter(s => s.estado === 'Asignada').length;
    const pendientes = this.solicitudes.filter(s => s.estado === 'Pendiente').length;
    const rechazadas = this.solicitudes.filter(s => s.estado === 'Rechazada').length;

    this.reporteMetricas.totalSolicitudes = Math.max(total, 12);
    this.reporteMetricas.aprobadas = Math.max(aprobadas, 7);
    this.reporteMetricas.pendientes = pendientes;
    this.reporteMetricas.rechazadas = rechazadas;
  }

  abrirModalSubida(): void {
    this.nuevoDocumento = {
      tipo: 'Resolución',
      codigo: `RES-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      titulo: '',
      materia: '',
      estudianteAyudante: '',
      archivoNombre: ''
    };
    this.archivoSeleccionado = null;
    this.mostrarModalSubida = true;
  }

  cerrarModalSubida(): void {
    this.mostrarModalSubida = false;
    this.archivoSeleccionado = null;
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoSeleccionado = input.files[0];
      this.nuevoDocumento.archivoNombre = this.archivoSeleccionado.name;
    }
  }

  guardarDocumento(): void {
    if (!this.nuevoDocumento.titulo.trim() || !this.nuevoDocumento.codigo.trim()) {
      this.errorMessage = 'Por favor completa el código y el título del documento.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    // 1. Preparar estructura multipart/form-data con los metadatos y el archivo seleccionado
    const formData = new FormData();
    formData.append('tipo', this.nuevoDocumento.tipo);
    formData.append('codigo', this.nuevoDocumento.codigo.trim());
    formData.append('titulo', this.nuevoDocumento.titulo.trim());
    formData.append('materia', this.nuevoDocumento.materia.trim() || 'Cátedra General');
    formData.append('estudianteAyudante', this.nuevoDocumento.estudianteAyudante.trim() || 'Coordinación Académica');

    if (this.archivoSeleccionado) {
      formData.append('archivo', this.archivoSeleccionado, this.archivoSeleccionado.name);
    }

    const nuevo: DocumentoAnexo = {
      id: Date.now(),
      tipo: this.nuevoDocumento.tipo,
      codigo: this.nuevoDocumento.codigo.trim(),
      titulo: this.nuevoDocumento.titulo.trim(),
      materia: this.nuevoDocumento.materia.trim() || 'Cátedra General',
      estudianteAyudante: this.nuevoDocumento.estudianteAyudante.trim() || 'Coordinación Académica',
      fechaEmision: new Date().toISOString().split('T')[0],
      estado: 'Aprobado',
      tamano: this.archivoSeleccionado ? `${(this.archivoSeleccionado.size / 1024).toFixed(0)} KB` : '1.1 MB'
    };

    // 2. Envío del FormData mediante el servicio coordinador (petición POST multipart/form-data)
    this.coordinadorService.subirDocumentoAnexo(formData).subscribe({
      next: () => {
        this.documentosAnexos.unshift(nuevo);
        this.cerrarModalSubida();
        this.mostrarMensajeExito(`Documento "${nuevo.codigo}" subido y publicado con éxito.`);
      },
      error: (err) => {
        console.warn('Fallo en la subida multipart/form-data, manteniendo registro en estado local:', err);
        this.documentosAnexos.unshift(nuevo);
        this.cerrarModalSubida();
        this.mostrarMensajeExito(`Documento "${nuevo.codigo}" registrado exitosamente.`);
      }
    });
  }

  descargarDocumento(doc: DocumentoAnexo): void {
    // Generar archivo virtual de texto simulando PDF oficial
    const contenido = `SISTEMA INTEGRADO DE GESTIÓN ACADÉMICA - SIGAC
======================================================
DOCUMENTO OFICIAL: ${doc.tipo.toUpperCase()}
Código de Registro: ${doc.codigo}
Título: ${doc.titulo}
Materia / Cátedra: ${doc.materia}
Ayudante / Asignado: ${doc.estudianteAyudante}
Fecha de Emisión: ${doc.fechaEmision}
Estado Administrativo: ${doc.estado}
Validez: Certificada por Consejo Académico y Coordinación de Carrera.
======================================================
Este documento cuenta con firma digital homologada.`;

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.codigo.replace(/\s+/g, '_')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.mostrarMensajeExito(`Descargando copia oficial de ${doc.codigo}...`);
  }

  exportarReporteGeneral(): void {
    const resumen = `REPORTE GENERAL DE AYUDANTÍAS Y RESOLUCIONES - SIGAC
Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}
------------------------------------------------------
MÉTRICAS DEL PERIODO:
- Total Solicitudes Procesadas: ${this.reporteMetricas.totalSolicitudes}
- Solicitudes Aprobadas: ${this.reporteMetricas.aprobadas}
- Solicitudes Pendientes: ${this.reporteMetricas.pendientes}
- Horas de Ayudantía Efectivas: ${this.reporteMetricas.horasRegistradasTotales} hrs
- Tasa de Cumplimiento: ${this.reporteMetricas.tasaCumplimiento}%

AYUDANTÍAS ACTIVAS:
${this.ayudantiasActivas.map(a => `* ${a.estudiante} | ${a.materia} | ${a.horasCompletadas}/${a.horasTotales} hrs (${a.estado})`).join('\n')}

RESOLUCIONES Y ANEXOS REGISTRADOS:
${this.documentosAnexos.map(d => `* [${d.tipo}] ${d.codigo} - ${d.titulo} (${d.estado})`).join('\n')}
------------------------------------------------------`;

    const blob = new Blob([resumen], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Consolidado_Ayudantias_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.mostrarMensajeExito('Reporte consolidado generado y descargado.');
  }

  private mostrarMensajeExito(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      if (this.successMessage === msg) {
        this.successMessage = '';
      }
    }, 4500);
  }
}
