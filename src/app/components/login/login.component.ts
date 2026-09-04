import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { getApiBase, setApiBase } from '../../api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  credentials = { username: '', password: '' };
  isLoading = false;
  errorMessage = '';

  // Configuración de Backend / Servidor
  showBackendConfig = false;
  currentBackendUrl = '';
  customBackendUrl = '';
  isTestingConnection = false;
  testConnectionMessage = '';
  testConnectionSuccess: boolean | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.actualizarBackendActual();
  }

  actualizarBackendActual() {
    const base = getApiBase();
    this.currentBackendUrl = base ? base : 'Modo Autónomo (Sin Backend)';
    this.customBackendUrl = base || 'http://localhost:5291';
  }

  toggleBackendConfig() {
    this.showBackendConfig = !this.showBackendConfig;
    this.testConnectionMessage = '';
    this.testConnectionSuccess = null;
  }

  seleccionarBackend(url: string) {
    this.customBackendUrl = url;
    this.guardarBackend();
  }

  guardarBackend() {
    if (this.customBackendUrl.trim()) {
      setApiBase(this.customBackendUrl.trim());
      this.actualizarBackendActual();
      this.errorMessage = '';
      this.testConnectionMessage = '';
      this.testConnectionSuccess = null;
    }
  }

  restablecerBackendLocal() {
    setApiBase('');
    this.actualizarBackendActual();
    this.testConnectionMessage = '✓ Modo Autónomo activado. La aplicación funcionará sin necesidad de tener el backend abierto.';
    this.testConnectionSuccess = true;
    this.errorMessage = '';
  }

  probarConexion() {
    const url = (this.customBackendUrl || '').trim();
    if (!url) {
      this.testConnectionMessage = 'Ingresa una URL válida para verificar.';
      this.testConnectionSuccess = false;
      return;
    }

    this.isTestingConnection = true;
    this.testConnectionMessage = 'Probando conexión con el servidor...';
    this.testConnectionSuccess = null;

    const testUrl = `${url.replace(/\/+$/, '')}/api/Login/login`;
    
    // Intento con fetch y timeout corto para diagnosticar net::ERR_CONNECTION_REFUSED
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch(testUrl, { method: 'GET', signal: controller.signal, mode: 'cors' })
      .then(res => {
        clearTimeout(timeoutId);
        this.isTestingConnection = false;
        if (res.status >= 200 && res.status < 500) {
          this.testConnectionSuccess = true;
          this.testConnectionMessage = `✓ Backend detectado y respondiendo en ${url}`;
        } else {
          this.testConnectionSuccess = false;
          this.testConnectionMessage = `⚠ El backend respondió con código ${res.status}.`;
        }
      })
      .catch(err => {
        clearTimeout(timeoutId);
        this.isTestingConnection = false;
        this.testConnectionSuccess = false;
        this.testConnectionMessage = `❌ No se pudo conectar a ${url} (ERR_CONNECTION_REFUSED). Verifica que tu proyecto backend en Visual Studio / .NET esté corriendo en HTTP (puerto 5291).`;
      });
  }

  ingresarComoDemo(rol: 'Estudiante' | 'Docente' | 'Ayudante' | 'Administrador' | 'Coordinador') {
    const demoUsers: Record<string, any> = {
      Estudiante: {
        id: 1,
        username: 'estudiante.demo',
        token: 'demo-token-estudiante-xyz',
        rol: 'Estudiante',
        roles: ['Estudiante'],
        nombre: 'Carlos',
        apellido: 'Mendoza',
        correo: 'carlos.mendoza@universidad.edu'
      },
      Docente: {
        id: 2,
        username: 'docente.demo',
        token: 'demo-token-docente-xyz',
        rol: 'Docente',
        roles: ['Docente', 'Tribunal'],
        nombre: 'Dra. Patricia',
        apellido: 'Rojas',
        correo: 'patricia.rojas@universidad.edu'
      },
      Coordinador: {
        id: 5,
        username: 'coordinador.demo',
        token: 'demo-token-coordinador-xyz',
        rol: 'Docente',
        roles: ['Docente', 'Coordinador'],
        nombre: 'Dr. Fernando',
        apellido: 'Sarmiento',
        correo: 'fernando.sarmiento@universidad.edu'
      },
      Ayudante: {
        id: 3,
        username: 'ayudante.demo',
        token: 'demo-token-ayudante-xyz',
        rol: 'Ayudante',
        roles: ['Estudiante', 'Ayudante'],
        nombre: 'Sebastián',
        apellido: 'Gómez',
        correo: 'sebastian.gomez@universidad.edu'
      },
      Administrador: {
        id: 4,
        username: 'admin.demo',
        token: 'demo-token-admin-xyz',
        rol: 'Administrador',
        roles: ['Administrador'],
        nombre: 'Ing. Roberto',
        apellido: 'Valenzuela',
        correo: 'admin@universidad.edu'
      }
    };

    const user = demoUsers[rol];
    if (!user) return;
    localStorage.setItem('token', user.token);
    localStorage.setItem('rol', user.rol);
    if (user.roles) {
      localStorage.setItem('roles', JSON.stringify(user.roles));
    }
    localStorage.setItem('username', user.username);
    localStorage.setItem('userId', user.id.toString());
    localStorage.setItem('nombre', user.nombre);
    localStorage.setItem('apellido', user.apellido);
    localStorage.setItem('correo', user.correo);

    this.router.navigate(['/dashboard']);
  }

  onLogin() {
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login(this.credentials).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos.';
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = `Error de conexión con el backend (${this.currentBackendUrl}). Verifica que el servidor de Visual Studio esté iniciado.`;
        }
      }
    });
  }
}
