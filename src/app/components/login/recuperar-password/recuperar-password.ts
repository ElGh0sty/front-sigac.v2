import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { getApiBase } from '../../../api';

@Component({
  selector: 'app-recuperar-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-password.html',
  styleUrls: ['./recuperar-password.css']
})
export class RecuperarPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);

  recoveryForm: FormGroup = this.fb.group({
    correo: ['', [
      Validators.required,
      Validators.email,
      Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    ]]
  });

  isSubmitting = false;
  solicitudEnviada = false;
  correoEnviado = '';
  mensajeError = '';

  onSubmit(): void {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.mensajeError = '';
    const correo = this.recoveryForm.value.correo;

    // Llamada al endpoint backend .NET de recuperación de credenciales
    this.http.post(`${getApiBase()}/api/auth/recuperar-password`, { correo }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.solicitudEnviada = true;
        this.correoEnviado = correo;
      },
      error: () => {
        // Fallback seguro: el sistema confirma el envío para proteger contra enumeración de correos
        this.isSubmitting = false;
        this.solicitudEnviada = true;
        this.correoEnviado = correo;
      }
    });
  }

  reintentar(): void {
    this.solicitudEnviada = false;
    this.recoveryForm.reset();
  }
}
