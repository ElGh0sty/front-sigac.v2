import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoordinadorService } from '../../../services/coordinador.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.html'
})
export class ReportesComponent implements OnInit {
  reporte: Array<{ estado: string; cantidad: number }> = [
    { estado: 'Activa', cantidad: 5 },
    { estado: 'Pendiente', cantidad: 3 },
    { estado: 'Finalizada', cantidad: 2 }
  ];

  total = 10;
  isLoading = false;

  constructor(private coordinadorService: CoordinadorService) {}

  ngOnInit() {
    this.generarReporte();
  }

  generarReporte() {
    this.isLoading = true;
    this.coordinadorService.getReportesAdministrativos().subscribe({
      next: (data) => {
        this.isLoading = false;
        if (Array.isArray(data) && data.length > 0) {
          this.reporte = data.map((d: any) => ({
            estado: d.estado || d.Estado || 'Desconocido',
            cantidad: d.cantidad || d.Cantidad || 0
          }));
          this.total = this.reporte.reduce((acc, curr) => acc + curr.cantidad, 0);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
