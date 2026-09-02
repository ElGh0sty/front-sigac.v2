import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './right-sidebar.html'
})
export class RightSidebarComponent {
  // Notificaciones con IDs y tipo para redirigir
  notificaciones = [
    {
      id: 1,
      tipo: 'actividad',
      titulo: 'Entrega: Proyecto Redes',
      descripcion: 'Finalización de arquitectura',
      fechaEntrega: '2026-08-12',
      color: 'amber-500',
      materiaId: 101
    },
    {
      id: 2,
      tipo: 'recurso',
      titulo: 'Guía de Estudio - Cálculo',
      descripcion: 'Documento base para el examen',
      visto: false,
      recursoId: 1,
      materiaId: 101
    },
    {
      id: 3,
      tipo: 'clase',
      titulo: 'Clase Virtual - Cálculo',
      descripcion: 'Zoom - 10:00 AM',
      enlace: 'https://zoom.us/j/123',
      fecha: '2026-08-11 10:00',
      materiaId: 101
    }
  ];

  // Recursos esenciales que el estudiante aún no ha visto
  recursosEsenciales = [
    { id: 1, titulo: 'Guía de Estudio - Cálculo', descripcion: 'Documento base para el examen', visto: false, materiaId: 101 }
  ];

  // Próximas clases
  proximasClases = [
    { titulo: 'Clase Virtual - Cálculo', link: 'https://zoom.us/j/123', app: 'Zoom', fecha: '2026-08-11 10:00' }
  ];

  constructor(private router: Router) {}

  irADetalle(notificacion: any) {
    console.log('Navegando a notificación:', notificacion);
    // Redirigir según el tipo. Si es clase virtual, abrir el link
    if (notificacion.tipo === 'clase' && notificacion.enlace) {
      window.open(notificacion.enlace, '_blank');
    } else if (notificacion.tipo === 'actividad' || notificacion.tipo === 'recurso') {
      // Redirigir a la materia asociada
      if (notificacion.materiaId) {
        // Asumiendo que es estudiante normal
        this.router.navigate(['/estudiante/materia', notificacion.materiaId]);
      }
    }
  }

  marcarComoVisto(id: number) {
    console.log('Marcando recurso como visto:', id);
    this.recursosEsenciales = this.recursosEsenciales.map(r =>
      r.id === id ? { ...r, visto: true } : r
    );
    // También actualizar en notificaciones si existe
  }
}
