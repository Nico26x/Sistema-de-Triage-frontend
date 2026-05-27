import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CrearAdministrativoRequest } from '../../../../models/usuario.models';
import { UsuarioService } from '../../../../services/usuario.service';

@Component({
  standalone: true,
  selector: 'app-crear-administrativo',
  templateUrl: './crear-administrativo.component.html',
  imports: [CommonModule, FormsModule]
})
export class CrearAdministrativoComponent {
  form = {
    nombre: '',
    apellido: '',
    email: '',
    identificacion: '',
    password: '',
    confirmarPassword: ''
  };

  loading = false;
  error = '';
  exito = '';

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  crearAdministrativo(): void {
    this.error = '';
    this.exito = '';

    const errorValidacion = this.validarFormulario();
    if (errorValidacion) {
      this.error = errorValidacion;
      this.cdr.detectChanges();
      return;
    }

    const request: CrearAdministrativoRequest = {
      nombre: this.form.nombre.trim(),
      apellido: this.form.apellido.trim(),
      email: this.form.email.trim(),
      identificacion: this.form.identificacion.trim(),
      password: this.form.password
    };

    this.loading = true;
    this.cdr.detectChanges();

    this.usuarioService
      .crearAdministrativo(request)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.exito = 'Administrativo creado correctamente.';
          this.error = '';
          this.form = {
            nombre: '',
            apellido: '',
            email: '',
            identificacion: '',
            password: '',
            confirmarPassword: ''
          };
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.exito = '';
          this.error = this.obtenerMensajeError(error);
          this.cdr.detectChanges();
        }
      });
  }

  volverAlListado(): void {
    this.router.navigate(['/dashboard/usuarios']);
  }

  private validarFormulario(): string {
    const nombre = this.form.nombre.trim();
    const apellido = this.form.apellido.trim();
    const email = this.form.email.trim();
    const identificacion = this.form.identificacion.trim();
    const password = this.form.password;
    const confirmarPassword = this.form.confirmarPassword;

    if (!nombre || nombre.length < 2 || nombre.length > 100) {
      return 'El nombre es obligatorio y debe tener entre 2 y 100 caracteres.';
    }

    if (!apellido || apellido.length < 2 || apellido.length > 100) {
      return 'El apellido es obligatorio y debe tener entre 2 y 100 caracteres.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return 'Debes ingresar un email valido.';
    }

    if (!identificacion || identificacion.length < 5 || identificacion.length > 20) {
      return 'La identificacion es obligatoria y debe tener entre 5 y 20 caracteres.';
    }

    if (!password || password.length < 6 || password.length > 50) {
      return 'La password es obligatoria y debe tener entre 6 y 50 caracteres.';
    }

    if (confirmarPassword !== password) {
      return 'La confirmacion de password no coincide.';
    }

    return '';
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo crear el administrativo.';
    }

    if (error.status === 400) {
      return 'Datos invalidos. Revisa los campos del formulario.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para crear administrativos.';
    }

    if (error.status === 409) {
      return 'El email o la identificacion ya estan registrados.';
    }

    if (error.status >= 500) {
      return 'Error del servidor al crear el administrativo.';
    }

    return 'No se pudo crear el administrativo.';
  }
}
