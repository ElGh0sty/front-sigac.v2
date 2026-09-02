import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstudiantesService, BulkUploadResponseDto, ImportJobResultDto } from '../../../services/estudiantes.service';

@Component({
  selector: 'app-carga-masiva-estudiantes',
  imports: [CommonModule],
  templateUrl: './carga-masiva.html',
  styleUrls: ['./carga-masiva.css']
})
export class CargaMasivaEstudiantesComponent {
  private estudiantesService = inject(EstudiantesService);

  archivoSeleccionado: File | null = null;
  isDragging = false;
  isUploading = false;
  progreso = 0;

  resultado: BulkUploadResponseDto | null = null;
  jobDetalle: ImportJobResultDto | null = null;
  mensajeError = '';
  isDownloadingTemplate = false;

  // Manejo de eventos drag and drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.procesarArchivo(event.dataTransfer.files[0]);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.procesarArchivo(input.files[0]);
    }
  }

  procesarArchivo(archivo: File): void {
    this.mensajeError = '';
    this.resultado = null;

    const extension = archivo.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'csv') {
      this.mensajeError = 'Formato no permitido. Por favor seleccione un archivo en formato .xlsx o .csv con las columnas oficiales.';
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      this.mensajeError = 'El archivo excede el tamaño máximo permitido de 10 MB.';
      return;
    }

    this.archivoSeleccionado = archivo;
  }

  /**
   * Ejecuta la carga masiva consumiendo POST /api/estudiantes/bulk-upload
   */
  subirArchivo(): void {
    if (!this.archivoSeleccionado) return;

    this.isUploading = true;
    this.progreso = 15;
    this.mensajeError = '';
    this.resultado = null;

    // Simulación progresiva de barra de carga
    const intervalo = setInterval(() => {
      if (this.progreso < 85) {
        this.progreso += 15;
      }
    }, 150);

    this.estudiantesService.bulkUpload(this.archivoSeleccionado).subscribe({
      next: (resp) => {
        clearInterval(intervalo);
        this.progreso = 100;
        setTimeout(() => {
          this.isUploading = false;
          this.resultado = resp;
          if (resp.jobId) {
            this.consultarJob(resp.jobId);
          }
        }, 300);
      },
      error: (err) => {
        clearInterval(intervalo);
        this.isUploading = false;
        this.mensajeError = 'Ocurrió un error al procesar la carga masiva en el servidor backend.';
      }
    });
  }

  /**
   * GET /api/estudiantes/template
   * Descarga la plantilla oficial en formato CSV
   */
  descargarPlantilla(): void {
    this.isDownloadingTemplate = true;
    this.estudiantesService.descargarPlantilla().subscribe({
      next: (blob) => {
        this.isDownloadingTemplate = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_carga_masiva_estudiantes.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.isDownloadingTemplate = false;
      }
    });
  }

  /**
   * GET /api/estudiantes/imports/{jobId}/result
   */
  consultarJob(jobId: string): void {
    this.estudiantesService.getResultadoImportacion(jobId).subscribe({
      next: (job) => {
        this.jobDetalle = job;
      }
    });
  }

  reiniciar(): void {
    this.archivoSeleccionado = null;
    this.resultado = null;
    this.jobDetalle = null;
    this.progreso = 0;
    this.mensajeError = '';
  }
}
