import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.html'
})
export class HorariosComponent {
  rol = localStorage.getItem('rol') || 'Estudiante';
  esAyudante = this.rol === 'Ayudante' || this.rol === 'Docente';

  dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  horas = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  alturaCelda = 60;

  // ✅ 1. Horarios ocupados (Aqui deberias filtrar solo las clases del docente/ayudante)
  // Por ahora es un mock. En el futuro vendrá del backend.
  clasesEstudiante = [
    { dia: 'Lunes', horaInicio: '10:00', horaFin: '12:00', materia: 'Cálculo Avanzado', plataforma: 'Zoom' },
    { dia: 'Miércoles', horaInicio: '08:00', horaFin: '10:00', materia: 'Mecánica Cuántica', aula: 'Aula 301' },
    { dia: 'Viernes', horaInicio: '14:00', horaFin: '16:00', materia: 'Redes Neuronales', plataforma: 'Meet' }
  ];

  // HORARIOS OCUPADOS (Solo para el ayudante/docente. Pueden ser suyas o de otros)
  horariosOcupados = [
    { dia: 'Lunes', horaInicio: '10:00', horaFin: '12:00', materia: 'Cálculo Avanzado', plataforma: 'Zoom', esMiClase: true },
    { dia: 'Miércoles', horaInicio: '08:00', horaFin: '10:00', materia: 'Mecánica Cuántica', aula: 'Aula 301', esMiClase: false },
    { dia: 'Viernes', horaInicio: '14:00', horaFin: '16:00', materia: 'Redes Neuronales', plataforma: 'Meet', esMiClase: false }
  ];

  // ✅ 2. Variables para la selección (Ahora guardamos día + hora)
  // Usamos un Set de strings con formato "dia|hora"
  seleccionadas = new Set<string>();
  diaSeleccionado: string = 'Lunes';

  constructor(private router: Router) {}


  // Obtener la clase del estudiante en una celda (para el rol Estudiante)
  getClaseEstudiante(dia: string, hora: string) {
    return this.clasesEstudiante.find(c => c.dia === dia && c.horaInicio === hora);
  }
  // Verificar si una hora está ocupada
  isHoraOcupada(dia: string, hora: string): boolean {
    return this.horariosOcupados.some(c => c.dia === dia && c.horaInicio === hora);
  }

  // Obtener la clase en una celda (si la hay)
  getClaseEnCelda(dia: string, hora: string) {
    return this.horariosOcupados.find(c => c.dia === dia && c.horaInicio === hora);
  }

  // ✅ 3. Alternar selección de una hora (solo ayudante, en un día específico)
  toggleHora(dia: string, hora: string) {
    if (!this.esAyudante) return;
    if (this.isHoraOcupada(dia, hora)) return;

    const key = `${dia}|${hora}`;
    if (this.seleccionadas.has(key)) {
      this.seleccionadas.delete(key);
    } else {
      this.seleccionadas.add(key);
    }
  }

  // Ir a Gestión de Clases pasando los datos por Query Params
  crearClase() {
    if (this.seleccionadas.size === 0) {
      alert('Selecciona al menos una hora.');
      return;
    }

    // Extraer todos los días únicos seleccionados y las horas
    const diasSeleccionados = new Set<string>();
    const horasSeleccionadasSet = new Set<string>();

    this.seleccionadas.forEach(key => {
      const [dia, hora] = key.split('|');
      diasSeleccionados.add(dia);
      horasSeleccionadasSet.add(hora);
    });

    // Ordenar horas
    const horasOrdenadas = Array.from(horasSeleccionadasSet)
      .sort((a, b) => this.horas.indexOf(a) - this.horas.indexOf(b));

    const horaInicio = horasOrdenadas[0];
    const horaFin = horasOrdenadas[horasOrdenadas.length - 1];

    // Navegar a Gestión de Clases con los parámetros
    this.router.navigate(['/docente/gestion-clases'], {
      queryParams: {
        dias: Array.from(diasSeleccionados).join(','), // Ej: "Lunes,Miércoles"
        horaInicio: horaInicio,
        horaFin: horaFin
      }
    });
  }

  // Helpers para la cuadrícula
  getTop(hora: string): number {
    return this.horas.indexOf(hora) * this.alturaCelda;
  }

  getHeight(inicio: string, fin: string): number {
    return (this.horas.indexOf(fin) - this.horas.indexOf(inicio)) * this.alturaCelda - 4;
  }
}
