import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MateriaService } from '../../services/materia.service';

declare const Plotly: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  rol = localStorage.getItem('rol') || 'Estudiante';
  esAyudante = localStorage.getItem('rol') === 'Ayudante';
  private sub?: Subscription;

  // --- Datos del Estudiante ---
  materiasEstudiante = [
    {
      id: 1,
      catedraId: 101,
      catedra: { id: 101, nombre: 'Cálculo Avanzado', docente: { username: 'Dra. Evelyn Vance' } },
      promedioActual: 4.8,
      alertaRendimiento: false
    },
    {
      id: 2,
      catedraId: 102,
      catedra: { id: 102, nombre: 'Mecánica Cuántica', docente: { username: 'Dr. Marcus Thorne' } },
      promedioActual: 4.5,
      alertaRendimiento: false
    },
    {
      id: 3,
      catedraId: 103,
      catedra: { id: 103, nombre: 'Redes Neuronales', docente: { username: 'Prof. Sarah Chen' } },
      promedioActual: 4.9,
      alertaRendimiento: false
    }
  ];

  // --- Datos del Ayudante / Docente ---
  dashboardAyudante = {
    estudiantes: 25,
    clasesImpartidas: 8,
    promedioAsistencia: 92,
    proximasClases: [
      { titulo: 'Clase Virtual - Cálculo Avanzado', descripcion: 'Zoom - 10:00 AM (Mañana)', ruta: '/docente/gestion-clases' },
      { titulo: 'Clase Presencial - Mecánica Cuántica', descripcion: 'Aula 301 - 14:00 PM (Viernes)', ruta: '/docente/gestion-clases' }
    ]
  };

  // --- Datos del Administrador ---
  dashboardAdmin = {
    materias: 3,
    docentes: 8,
    estudiantes: 240,
    ayudantiasActivas: 5
  };

  constructor(
    private router: Router,
    private materiaService: MateriaService
  ) {}

  ngOnInit(): void {
    this.sub = this.materiaService.materias$.subscribe(list => {
      this.dashboardAdmin.materias = list.length;
      this.materiasEstudiante = list.map((m, idx) => ({
        id: idx + 1,
        catedraId: m.id,
        catedra: { id: m.id, nombre: m.nombre, docente: { username: m.docente || 'Docente' } },
        promedioActual: 4.8,
        alertaRendimiento: false
      }));
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url === '/dashboard' && this.rol === 'Estudiante' && !this.esAyudante) {
          this.renderChart();
        }
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  ngAfterViewInit(): void {
    if (this.rol === 'Estudiante' && !this.esAyudante) {
      this.renderChart();
    }
  }

  renderChart() {
    const el = document.getElementById('trajectory-chart');
    if (!el || typeof Plotly === 'undefined') return;

    const data = [
      {
        x: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
        y: [4.2, 4.4, 4.3, 4.5, 4.7, 4.6, 4.8, 4.84],
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Tu Promedio',
        line: { color: '#2563eb', width: 3, shape: 'spline' },
        fill: 'tozeroy',
        fillcolor: 'rgba(37, 99, 235, 0.05)'
      },
      {
        x: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
        y: [3.8, 3.9, 3.9, 4.0, 4.1, 4.1, 4.2, 4.2],
        type: 'scatter',
        mode: 'lines',
        name: 'Promedio Grupal',
        line: { color: '#94a3b8', width: 2, dash: 'dot', shape: 'spline' }
      }
    ];

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { t: 10, r: 10, b: 40, l: 40 },
      showlegend: false,
      xaxis: { gridcolor: '#f1f5f9', tickfont: { color: '#94a3b8', size: 10 }, linecolor: '#f1f5f9' },
      yaxis: { gridcolor: '#f1f5f9', tickfont: { color: '#94a3b8', size: 10 }, range: [3.0, 5.0], dtick: 0.5 },
      hovermode: 'x unified',
      hoverlabel: { bgcolor: '#ffffff', bordercolor: '#e2e8f0', font: { color: '#0f172a' } }
    };

    const config = { responsive: true, displayModeBar: false, displaylogo: false };
    Plotly.newPlot('trajectory-chart', data, layout, config);
  }
}
