import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostulacionComponent } from '../../estudiante/postulacion/postulacion';
import { BitacoraComponent } from '../../estudiante/bitacora/bitacora';
import { InformesComponent } from '../../estudiante/informes/informes';

@Component({
  selector: 'app-gestion-ayudantia',
  standalone: true,
  imports: [CommonModule, PostulacionComponent, BitacoraComponent, InformesComponent],
  templateUrl: './gestion-ayudantia.html'
})
export class GestionAyudantiaComponent {
  tab: 'postulacion' | 'bitacora' | 'informes' = 'postulacion';
}
