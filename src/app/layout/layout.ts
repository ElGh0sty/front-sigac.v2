import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RightSidebarComponent } from '../components/right-sidebar/right-sidebar';
import { RightSidebarAyudanteComponent } from '../components/ayudante/right-sidebar-ayudante/right-sidebar-ayudante';

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
  rol: string = '';
  esAyudante: boolean = false;

  // ✅ AGREGA ESTAS DOS LÍNEAS PARA CORREGIR LOS ERRORES:
  menuAbierto: boolean = false; // Controla el menú en móviles
  username: string = 'Alejandro'; // Nombre del usuario (puedes leerlo del localStorage si quieres)

  ngOnInit() {
    this.rol = localStorage.getItem('rol') || 'Estudiante';
    this.actualizarEstadoAyudante();

    // Opcional: Leer el username del localStorage (si lo guardaste en el login)
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      this.username = storedUsername;
    }
  }

  cambiarRol(nuevoRol: string) {
    this.rol = nuevoRol;
    localStorage.setItem('rol', nuevoRol);
    this.actualizarEstadoAyudante();
    window.location.reload();
  }

  actualizarEstadoAyudante() {
    this.esAyudante = this.rol === 'Ayudante';
  }
}
