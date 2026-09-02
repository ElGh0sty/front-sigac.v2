import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { getApiBase, setApiBase } from '../../api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.currentBackendUrl = getApiBase() || 'http://localhost:3000/api';
    this.customBackendUrl = this.currentBackendUrl;
  }

  toggleBackendConfig() {
    this.showBackendConfig = !this.showBackendConfig;
  }

  seleccionarBackend(url: string) {
    this.customBackendUrl = url;
    this.guardarBackend();
  }

  guardarBackend() {
    if (this.customBackendUrl.trim()) {
      setApiBase(this.customBackendUrl.trim());
      this.currentBackendUrl = getApiBase();
      this.showBackendConfig = false;
      this.errorMessage = '';
    }
  }

  restablecerBackendLocal() {
    setApiBase('');
    this.currentBackendUrl = 'http://localhost:3000/api';
    this.customBackendUrl = this.currentBackendUrl;
    this.showBackendConfig = false;
  }

  ingresarComoDemo(rol: 'Estudiante' | 'Docente' | 'Ayudante' | 'Administrador') {
    const demoUsers: Record<string, any> = {
      Estudiante: {
        id: 1,
        username: 'estudiante.demo',
        token: 'demo-token-estudiante-xyz',
        rol: 'Estudiante',
        nombre: 'Carlos',
        apellido: 'Mendoza',
        correo: 'carlos.mendoza@universidad.edu'
      },
      Docente: {
        id: 2,
        username: 'docente.demo',
        token: 'demo-token-docente-xyz',
        rol: 'Docente',
        nombre: 'Dra. Patricia',
        apellido: 'Rojas',
        correo: 'patricia.rojas@universidad.edu'
      },
      Ayudante: {
        id: 3,
        username: 'ayudante.demo',
        token: 'demo-token-ayudante-xyz',
        rol: 'Ayudante',
        nombre: 'Sebastián',
        apellido: 'Gómez',
        correo: 'sebastian.gomez@universidad.edu'
      },
      Administrador: {
        id: 4,
        username: 'admin.demo',
        token: 'demo-token-admin-xyz',
        rol: 'Administrador',
        nombre: 'Ing. Roberto',
        apellido: 'Valenzuela',
        correo: 'admin@universidad.edu'
      }
    };

    const user = demoUsers[rol];
    localStorage.setItem('token', user.token);
    localStorage.setItem('rol', user.rol);
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
