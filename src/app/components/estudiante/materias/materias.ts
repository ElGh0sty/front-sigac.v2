import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MateriaDto, MateriaService } from '../../../services/materia.service';

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './materias.html'
})
export class MateriasComponent implements OnInit, OnDestroy {
  materias: MateriaDto[] = [];
  private sub?: Subscription;

  constructor(private materiaService: MateriaService) {}

  ngOnInit() {
    this.sub = this.materiaService.materias$.subscribe(list => {
      this.materias = list;
    });
    this.materiaService.refreshMaterias().subscribe();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}

