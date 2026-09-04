import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RightSidebarComponent } from '../components/right-sidebar/right-sidebar';
import { RightSidebarAyudanteComponent } from '../components/ayudante/right-sidebar-ayudante/right-sidebar-ayudante';
import { AuthService } from '../services/auth.service';
import { getApiBase, setApiBase } from '../api';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
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

  // Gestión de Backend y Modo Autónomo
  backendActual: string = '';
  mostrarModalBackend: boolean = false;
  inputBackendUrl: string = '';
  mensajeBackend: string = '';
  esExitoBackend: boolean | null = null;
  probandoConexion: boolean = false;

  ngOnInit() {
    this.rol = localStorage.getItem('rol') || 'Estudiante';
    this.actualizarEstadoAyudante();
    this.actualizarBackend();

    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      this.username = storedUsername;
    }
  }

  actualizarBackend() {
    const base = getApiBase();
    this.backendActual = base || '';
    this.inputBackendUrl = base || 'http://localhost:5291';
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

  activarModoAutonomo() {
    setApiBase('');
    this.actualizarBackend();
    this.mensajeBackend = '✓ Modo Autónomo activado con éxito. Se usará almacenamiento local en memoria.';
    this.esExitoBackend = true;
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }

  guardarUrlBackend(url: string) {
    if (!url.trim()) {
      this.activarModoAutonomo();
      return;
    }
    setApiBase(url.trim());
    this.actualizarBackend();
    this.mensajeBackend = `✓ URL de backend guardada: ${url}`;
    this.esExitoBackend = true;
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }

  probarConexionBackend() {
    const url = (this.inputBackendUrl || '').trim();
    if (!url) {
      this.mensajeBackend = 'Ingresa una URL válida para verificar.';
      this.esExitoBackend = false;
      return;
    }

    this.probandoConexion = true;
    this.mensajeBackend = 'Verificando comunicación con el backend...';
    this.esExitoBackend = null;

    const testUrl = `${url.replace(/\/+$/, '')}/api/Login/login`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    fetch(testUrl, { method: 'GET', signal: controller.signal, mode: 'cors' })
      .then(res => {
        clearTimeout(timer);
        this.probandoConexion = false;
        if (res.status >= 200 && res.status < 500) {
          this.esExitoBackend = true;
          this.mensajeBackend = `✓ Backend detectado y respondiendo en ${url}`;
        } else {
          this.esExitoBackend = false;
          this.mensajeBackend = `⚠ Backend respondió con código HTTP ${res.status}.`;
        }
      })
      .catch(() => {
        clearTimeout(timer);
        this.probandoConexion = false;
        this.esExitoBackend = false;
        this.mensajeBackend = `❌ ERR_CONNECTION_REFUSED en ${url}. Tu backend no está ejecutándose en ese puerto. Inicia Visual Studio (F5) o activa Modo Autónomo.`;
      });
  }
}
