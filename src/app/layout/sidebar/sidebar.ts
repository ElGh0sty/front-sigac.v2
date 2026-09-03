import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  public authService = inject(AuthService);

  @Input() menuAbierto: boolean = false;

  username: string = 'Alejandro';
  nombreCompleto: string = 'Alejandro García';
  rolesActivos: string[] = [];
  rolPrincipal: string = 'Estudiante';

  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.username = user.username || 'Usuario';
      this.nombreCompleto = (user.nombre && user.apellido)
        ? `${user.nombre} ${user.apellido}`
        : user.username || 'Alejandro García';
      this.rolPrincipal = user.rol || 'Estudiante';
    }
    this.rolesActivos = this.authService.getRoles();
    if (this.rolesActivos.length === 0 && this.rolPrincipal) {
      this.rolesActivos = [this.rolPrincipal];
    }
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return this.authService.hasAnyRole(roles);
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }
}
