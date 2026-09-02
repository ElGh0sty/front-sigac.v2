import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MateriaDto, MateriaService } from '../../../services/materia.service';

@Component({
  selector: 'app-ayudante-materias',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './materias.html'
})
export class AyudanteMateriasComponent implements OnInit, OnDestroy {
  materias: MateriaDto[] = [];
  private sub?: Subscription;

  constructor(
    private materiaService: MateriaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub = this.materiaService.materias$.subscribe(list => {
      this.materias = list;
    });
    this.materiaService.refreshMaterias().subscribe();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  irAGestionRecursos(materiaId: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/ayudante/materia', materiaId]);
  }
}
