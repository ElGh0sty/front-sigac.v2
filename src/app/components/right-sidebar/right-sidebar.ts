import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface NotificacionItem {
  id: number;
  tipo: 'comunicado' | 'recurso' | 'clase' | 'calificacion';
  titulo: string;
  descripcion: string;
  fecha: string;
  materiaId: number;
  materiaNombre: string;
  emisor?: string;
  contenidoCompleto?: string;
  enlaceClase?: string;
  idReunion?: string;
  codigoAcceso?: string;
  leida: boolean;
}

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './right-sidebar.html'
})
export class RightSidebarComponent implements OnInit {
  filtro: 'todas' | 'pendientes' = 'todas';
  
  // Notificaciones interactivas y funcionales
  notificaciones: NotificacionItem[] = [
    {
      id: 1,
      tipo: 'comunicado',
      titulo: 'Aviso de Evaluación - Cálculo Avanzado',
      descripcion: 'Indicaciones oficiales para el primer taller sincrónico de derivadas.',
      fecha: 'Hoy, 09:30',
      materiaId: 101,
      materiaNombre: 'Cálculo Avanzado',
      emisor: 'Dr. Roberto Zambrano (Docente Titular)',
      contenidoCompleto: 'Estimados estudiantes, el próximo lunes se llevará a cabo la sesión de resolución de casos prácticos del Tema 2. Se solicita revisar con anticipación las hojas de fórmulas subidas en el aula virtual y contar con calculadora científica habilitada. Cualquier duda puntual pueden enviarla al foro de tutorías.',
      leida: false
    },
    {
      id: 2,
      tipo: 'recurso',
      titulo: 'Nueva Guía Didáctica Disponible',
      descripcion: 'Guía de laboratorio de algoritmos con problemas de grafos y árboles.',
      fecha: 'Ayer, 16:45',
      materiaId: 102,
      materiaNombre: 'Estructuras de Datos y Algoritmos',
      emisor: 'Ing. Carlos Mendoza',
      contenidoCompleto: 'Se ha cargado la Guía de Ejercicios N° 3 con especificaciones técnicas sobre estructuras dinámicas y árboles binarios balanceados. El documento está disponible en la sección de recursos de la cátedra.',
      leida: false
    },
    {
      id: 3,
      tipo: 'clase',
      titulo: 'Sesión Sincrónica de Tutoría',
      descripcion: 'Tutoría virtual de refuerzo previa al examen parcial.',
      fecha: 'Mañana, 10:00 AM',
      materiaId: 101,
      materiaNombre: 'Cálculo Avanzado',
      emisor: 'Ayudante de Cátedra',
      enlaceClase: 'https://meet.google.com/xyz-abcd-efg',
      idReunion: '849 2039 1102',
      codigoAcceso: 'CALC2026',
      contenidoCompleto: 'Sesión de tutoría personalizada para resolver dudas sobre los ejercicios del cuadernillo. Los estudiantes pueden traer sus consultas específicas.',
      leida: false
    },
    {
      id: 4,
      tipo: 'calificacion',
      titulo: 'Calificación Publicada: Taller 1',
      descripcion: 'Tu nota ha sido asentada en el registro del aula virtual: 9.50/10.',
      fecha: 'Hace 2 días',
      materiaId: 101,
      materiaNombre: 'Cálculo Avanzado',
      emisor: 'Dr. Roberto Zambrano',
      contenidoCompleto: 'Excelente demostración en el desarrollo analítico de funciones continuas y límites indeterminados. Se ha dejado feedback detallado en la entrega.',
      leida: true
    }
  ];

  // Modal para detalle de notificación
  modalAbierto = false;
  notificacionSeleccionada: NotificacionItem | null = null;
  enlaceCopiado = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.cargarEstadoLeidas();
  }

  get pendientesCount(): number {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  get notificacionesFiltradas(): NotificacionItem[] {
    if (this.filtro === 'pendientes') {
      return this.notificaciones.filter(n => !n.leida);
    }
    return this.notificaciones;
  }

  cargarEstadoLeidas() {
    try {
      const guardadas = localStorage.getItem('notificaciones_estudiante_leidas');
      if (guardadas) {
        const idsLeidas: number[] = JSON.parse(guardadas);
        this.notificaciones = this.notificaciones.map(n => ({
          ...n,
          leida: idsLeidas.includes(n.id) || n.leida
        }));
      }
    } catch {
      // Ignorar error de parsing
    }
  }

  guardarEstadoLeidas() {
    try {
      const idsLeidas = this.notificaciones.filter(n => n.leida).map(n => n.id);
      localStorage.setItem('notificaciones_estudiante_leidas', JSON.stringify(idsLeidas));
    } catch {
      // Ignorar error de localStorage
    }
  }

  abrirNotificacion(noti: NotificacionItem) {
    // Marcar como leída automáticamente al interactuar
    noti.leida = true;
    this.guardarEstadoLeidas();

    if (noti.tipo === 'recurso') {
      // Navegar directamente a la materia
      this.router.navigate(['/estudiante/materia', noti.materiaId]);
    } else {
      // Abrir modal con la información completa y opciones funcionales
      this.notificacionSeleccionada = noti;
      this.enlaceCopiado = false;
      this.modalAbierto = true;
    }
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.notificacionSeleccionada = null;
    this.enlaceCopiado = false;
  }

  toggleLeida(event: MouseEvent, noti: NotificacionItem) {
    event.stopPropagation();
    noti.leida = !noti.leida;
    this.guardarEstadoLeidas();
  }

  marcarTodasComoLeidas() {
    this.notificaciones.forEach(n => n.leida = true);
    this.guardarEstadoLeidas();
  }

  irAMateriaDesdeModal() {
    if (this.notificacionSeleccionada?.materiaId) {
      const matId = this.notificacionSeleccionada.materiaId;
      this.cerrarModal();
      this.router.navigate(['/estudiante/materia', matId]);
    }
  }

  copiarEnlaceClase() {
    if (!this.notificacionSeleccionada?.enlaceClase) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(this.notificacionSeleccionada.enlaceClase).then(() => {
        this.enlaceCopiado = true;
        setTimeout(() => this.enlaceCopiado = false, 3000);
      });
    } else {
      this.enlaceCopiado = true;
      setTimeout(() => this.enlaceCopiado = false, 3000);
    }
  }
}
