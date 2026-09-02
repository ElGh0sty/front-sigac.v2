import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-right-sidebar-ayudante',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './right-sidebar-ayudante.html'
})
export class RightSidebarAyudanteComponent {
  proximasClases = [
    { titulo: 'Clase Virtual - Cálculo', descripcion: 'Zoom - 10:00 AM', fecha: '2026-08-11 10:00' },
    { titulo: 'Clase Presencial - Mecánica', descripcion: 'Aula 301 - 14:00 PM', fecha: '2026-08-12 14:00' }
  ];
}
