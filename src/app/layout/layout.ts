import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RightSidebarComponent } from '../components/right-sidebar/right-sidebar';
import { RightSidebarAyudanteComponent } from '../components/ayudante/right-sidebar-ayudante/right-sidebar-ayudante';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RightSidebarComponent,
    RightSidebarAyudanteComponent
  ],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class LayoutComponent implements OnInit {
  public authService = inject(AuthService);

  rol: string = '';
  esAyudante: boolean = false;
  menuAbierto: boolean = false;
  username: string = 'Alejandro';

  ngOnInit() {
    this.rol = localStorage.getItem('rol') || 'Estudiante';
    this.actualizarEstadoAyudante();

    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      this.username = storedUsername;
    }
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return this.authService.hasAnyRole(roles);
  }

  get userRoles(): string[] {
    return this.authService.getRoles();
  }

  cambiarRol(nuevoRol: string) {
    this.rol = nuevoRol;
    localStorage.setItem('rol', nuevoRol);
    localStorage.setItem('roles', JSON.stringify([nuevoRol]));
    this.actualizarEstadoAyudante();
    window.location.reload();
  }

  actualizarEstadoAyudante() {
    this.esAyudante = this.rol === 'Ayudante' || this.hasRole('Ayudante');
  }
}
