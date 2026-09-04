import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
  private router = inject(Router);

  rol: string = '';
  esAyudante: boolean = false;
  menuAbierto: boolean = false;
  username: string = 'Usuario';

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

  get userDisplayName(): string {
    const nombre = localStorage.getItem('nombre');
    const apellido = localStorage.getItem('apellido');
    if (nombre) {
      return `${nombre} ${apellido || ''}`.trim();
    }
    const username = localStorage.getItem('username');
    if (username) {
      return username;
    }
    return this.username || 'Usuario';
  }

  get userInitials(): string {
    const name = this.userDisplayName;
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || 'US';
  }

  actualizarBackend() {
    const base = getApiBase();
    this.backendActual = base || '';
    this.inputBackendUrl = base || 'http://localhost:5291';
  }

  mostrarSeccion(seccion: string): boolean {
    const rolActual = (this.rol || localStorage.getItem('rol') || 'Estudiante').trim().toLowerCase();
    const sec = seccion.trim().toLowerCase();

    if (sec === 'jurado' || sec === 'tribunal') {
      return rolActual === 'jurado' || rolActual === 'tribunal';
    }

    return rolActual === sec;
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
    this.actualizarEstadoAyudante();

    // Redirección inmediata según el rol seleccionado para cambiar la vista
    switch (nuevoRol) {
      case 'Estudiante':
        this.router.navigate(['/estudiante/materias']);
        break;
      case 'Ayudante':
        this.router.navigate(['/ayudante/materias']);
        break;
      case 'Docente':
        this.router.navigate(['/docente/gestion-clases']);
        break;
      case 'Coordinador':
        this.router.navigate(['/coordinador/validacion']);
        break;
      case 'Jurado':
        this.router.navigate(['/jurado/evaluacion']);
        break;
      case 'Administrador':
        this.router.navigate(['/admin/docentes']);
        break;
      default:
        this.router.navigate(['/dashboard']);
        break;
    }
  }

  actualizarEstadoAyudante() {
    this.esAyudante = this.rol === 'Ayudante';
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
