import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { getApiBase, setApiBase } from '../../api';

export interface CuentaPrueba {
  rol: string;
  usuario: string;
  correo: string;
  clave: string;
  badge: string;
  color: string;
}

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

  // 7 Cuentas oficiales precargadas en el backend ASP.NET Core
  cuentasPrueba: CuentaPrueba[] = [
    { rol: 'Administrador', usuario: 'admin', correo: 'admin@uteq.edu.ec', clave: 'Admin123!', badge: 'Admin', color: 'rose' },
    { rol: 'Coordinador', usuario: 'coordinador', correo: 'coordinador@uteq.edu.ec', clave: 'Coord123!', badge: 'Coord', color: 'amber' },
    { rol: 'Docente', usuario: 'docente', correo: 'docente@uteq.edu.ec', clave: 'Docente123!', badge: 'Docente', color: 'indigo' },
    { rol: 'Estudiante', usuario: 'estudiante', correo: 'estudiante@uteq.edu.ec', clave: 'Estudiante123!', badge: 'Estudiante', color: 'blue' },
    { rol: 'Ayudante', usuario: 'ayudante', correo: 'ayudante@uteq.edu.ec', clave: 'Ayudante123!', badge: 'Ayudante', color: 'teal' },
    { rol: 'Jurado', usuario: 'jurado', correo: 'jurado@uteq.edu.ec', clave: 'Jurado123!', badge: 'Jurado', color: 'purple' },
    { rol: 'Decano', usuario: 'decano', correo: 'decano@uteq.edu.ec', clave: 'Decano123!', badge: 'Decano', color: 'emerald' }
  ];

  // Configuración de Backend / Servidor Kestrel
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
    this.customBackendUrl = base || 'http://localhost:3000';
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
    this.testConnectionMessage = 'Probando conexión con el servidor Kestrel...';
    this.testConnectionSuccess = null;

    const testUrl = `${url.replace(/\/+$/, '')}/api/Login/login`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch(testUrl, { method: 'GET', signal: controller.signal, mode: 'cors' })
      .then(res => {
        clearTimeout(timeoutId);
        this.isTestingConnection = false;
        if (res.status >= 200 && res.status < 500) {
          this.testConnectionSuccess = true;
          this.testConnectionMessage = `✓ Backend Kestrel detectado y respondiendo en ${url}`;
        } else {
          this.testConnectionSuccess = false;
          this.testConnectionMessage = `⚠ El backend respondió con código ${res.status}.`;
        }
      })
      .catch(err => {
        clearTimeout(timeoutId);
        this.isTestingConnection = false;
        this.testConnectionSuccess = false;
        this.testConnectionMessage = `❌ No se pudo conectar a ${url}. Asegúrate de que el backend Kestrel esté iniciado en el puerto 3000.`;
      });
  }

  cargarCredencialesPrueba(cuenta: CuentaPrueba, usarCorreo: boolean = true) {
    this.credentials.username = usarCorreo ? cuenta.correo : cuenta.usuario;
    this.credentials.password = cuenta.clave;
    this.errorMessage = '';
  }

  ingresarDirectoConPrueba(cuenta: CuentaPrueba) {
    this.cargarCredencialesPrueba(cuenta, true);
    this.onLogin();
  }

  onLogin() {
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Por favor ingresa usuario/correo y contraseña.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login(this.credentials).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Usuario o contraseña incorrectos. Verifica las credenciales.';
        } else {
          this.errorMessage = `Error de comunicación con el backend (${this.currentBackendUrl}). Verifica que el servidor Kestrel esté corriendo en puerto 3000.`;
        }
      }
    });
  }
}

