import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminDocenteService, DocenteItemDto } from '../../../services/admin-docente.service';

@Component({
  selector: 'app-admin-docentes',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-docentes.html',
  styleUrls: ['./admin-docentes.css']
})
export class AdminDocentesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminDocenteService = inject(AdminDocenteService);

  docentes: DocenteItemDto[] = [];
  docenteForm!: FormGroup;

  modalAbierto = false;
  isSubmitting = false;
  filtroTexto = '';
  filtroRol = 'Todos';

  mensajeExito = '';
  mensajeError = '';

  // Roles disponibles para asignación múltiple
  rolesDisponibles = [
    { key: 'Docente', label: 'Docente de Cátedra', descripcion: 'Imparte materias, crea tareas y evalúa estudiantes', obligatorio: true },
    { key: 'Coordinador', label: 'Coordinador de Carrera', descripcion: 'Valida ayudantías, define notas mínimas y convoca tribunales', obligatorio: false },
    { key: 'Tribunal', label: 'Miembro de Tribunal Evaluador', descripcion: 'Califica sustentaciones de ayudantes y emite dictámenes técnicos', obligatorio: false }
  ];

  ngOnInit(): void {
    this.iniciarFormulario();
    this.cargarDocentes();
  }

  iniciarFormulario(): void {
    this.docenteForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4), Validators.pattern('^[a-zA-Z0-9._-]+$')]],
      password: ['Temporal2026*', [Validators.required, Validators.minLength(6)]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      // Checkboxes de roles
      rolDocente: [{ value: true, disabled: false }],
      rolCoordinador: [false],
      rolTribunal: [false]
    });
  }

  cargarDocentes(): void {
    this.adminDocenteService.getDocentes().subscribe({
      next: (data) => {
        this.docentes = data;
      },
      error: (err) => {
        console.error('Error al cargar docentes:', err);
      }
    });
  }

  abrirModal(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.docenteForm.reset({
      username: '',
      password: 'Temporal2026*',
      nombre: '',
      apellido: '',
      correo: '',
      rolDocente: true,
      rolCoordinador: false,
      rolTribunal: false
    });
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  // Generar sugerencia de username y correo al escribir nombres
  actualizarSugerencias(): void {
    const nom = (this.docenteForm.get('nombre')?.value || '').trim().toLowerCase();
    const ape = (this.docenteForm.get('apellido')?.value || '').trim().toLowerCase();
    if (nom && ape && !this.docenteForm.get('username')?.dirty) {
      const usernameSugerido = `${nom.split(' ')[0]}.${ape.split(' ')[0]}`;
      this.docenteForm.patchValue({
        username: usernameSugerido,
        correo: `${usernameSugerido}@universidad.edu`
      });
    }
  }

  guardarDocente(): void {
    if (this.docenteForm.invalid) {
      this.docenteForm.markAllAsTouched();
      return;
    }

    const formVal = this.docenteForm.getRawValue();

    // Construcción del array de roles inclusivos
    const rolesSeleccionados: string[] = [];
    if (formVal.rolDocente) rolesSeleccionados.push('Docente');
    if (formVal.rolCoordinador) rolesSeleccionados.push('Coordinador');
    if (formVal.rolTribunal) rolesSeleccionados.push('Tribunal');

    if (rolesSeleccionados.length === 0) {
      this.mensajeError = 'Debe seleccionar al menos un rol para el docente.';
      return;
    }

    this.isSubmitting = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const payload = {
      username: formVal.username.trim(),
      password: formVal.password,
      nombre: formVal.nombre.trim(),
      apellido: formVal.apellido.trim(),
      correo: formVal.correo.trim(),
      roles: rolesSeleccionados
    };

    this.adminDocenteService.crearDocente(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.mensajeExito = `Docente ${payload.nombre} ${payload.apellido} registrado exitosamente con roles: ${rolesSeleccionados.join(', ')}.`;
        this.cargarDocentes();
        setTimeout(() => {
          this.cerrarModal();
        }, 1200);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.mensajeError = 'Error al registrar el docente. Por favor verifique los datos.';
        console.error(err);
      }
    });
  }

  get docentesFiltrados(): DocenteItemDto[] {
    return this.docentes.filter(d => {
      const matchTexto = !this.filtroTexto ||
        d.nombre.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        d.apellido.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        d.correo.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        d.username.toLowerCase().includes(this.filtroTexto.toLowerCase());

      const matchRol = this.filtroRol === 'Todos' || d.roles.includes(this.filtroRol);

      return matchTexto && matchRol;
    });
  }
}
