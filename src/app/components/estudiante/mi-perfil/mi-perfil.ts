import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, PersonaDto } from '../../../services/auth.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-perfil.html'
})
export class MiPerfilComponent implements OnInit {
  perfil: PersonaDto = {
    nombre: localStorage.getItem('nombre') || '',
    apellido: localStorage.getItem('apellido') || '',
    correo: localStorage.getItem('correo') || ''
  };

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.isLoading = true;
    this.authService.getPersona().subscribe({
      next: (data) => {
        this.isLoading = false;
        if (data) {
          this.perfil = {
            nombre: data.nombre || this.perfil.nombre,
            apellido: data.apellido || this.perfil.apellido,
            correo: data.correo || this.perfil.correo,
            rol: data.rol || this.perfil.rol,
            telefono: data.telefono,
            direccion: data.direccion,
            biografia: data.biografia
          };
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.warn('Usando datos de sesión local para el perfil:', err);
      }
    });
  }

  guardarCambios() {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService.updatePersona(this.perfil).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = 'Datos personales actualizados correctamente.';
        if (this.perfil.nombre) localStorage.setItem('nombre', this.perfil.nombre);
        if (this.perfil.apellido) localStorage.setItem('apellido', this.perfil.apellido);
        if (this.perfil.correo) localStorage.setItem('correo', this.perfil.correo);
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'No se pudo guardar los cambios en el servidor (' + (err.status || 'Red') + ').';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }
}
