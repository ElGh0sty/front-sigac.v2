import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// ✅ CORREGIDO: Importa desde la carpeta padre (./) porque están al mismo nivel
import { SolicitudesComponent } from '../solicitudes/solicitudes';
import { AsignacionesComponent } from '../asignaciones/asignaciones';
import { SeguimientoComponent } from '../seguimiento/seguimiento';

@Component({
  selector: 'app-ayudantias-admin',
  standalone: true,
  imports: [CommonModule, SolicitudesComponent, AsignacionesComponent, SeguimientoComponent],
  templateUrl: './ayudantias-admin.html'
})
export class AyudantiasAdminComponent {
  tab: 'solicitudes' | 'asignaciones' | 'seguimiento' = 'solicitudes';
}
