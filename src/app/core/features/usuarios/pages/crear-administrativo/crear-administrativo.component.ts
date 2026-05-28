import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CrearAdministrativoRequest } from '../../../../models/usuario.models';
import { UsuarioService } from '../../../../services/usuario.service';
import { AlertService } from '../../../../services/alert.service'; // ← importar

@Component({
  standalone: true,
  selector: 'app-crear-administrativo',
  templateUrl: './crear-administrativo.component.html',
  styleUrls: ['./crear-administrativo.component.css'],
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

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private alert: AlertService // ← inyectar
  ) {}

  crearAdministrativo(): void {
    const errorValidacion = this.validarFormulario();
    if (errorValidacion) {
      this.alert.warning('Formulario incompleto', errorValidacion); // ← validación
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
    this.alert.showLoading('Creando administrativo...'); // ← loading
    this.cdr.detectChanges();

    this.usuarioService
      .crearAdministrativo(request)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.alert.hideLoading(); // ← cerrar loading
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: async () => {
          this.form = {
            nombre: '', apellido: '', email: '',
            identificacion: '', password: '', confirmarPassword: ''
          };
          this.cdr.detectChanges();

          // ← Éxito con opción de ir al listado
          const result = await this.alert.success(
            '¡Administrativo creado!',
            'El usuario fue registrado correctamente.'
          );

          // Siempre volver al listado tras confirmar
          this.router.navigate(['/dashboard/usuarios']);
        },
        error: (error: unknown) => {
          this.alert.error('Error al crear administrativo', this.obtenerMensajeError(error)); // ← error
          this.cdr.detectChanges();
        }
      });
  }

  volverAlListado(): void {
    this.router.navigate(['/dashboard/usuarios']);
  }

  private validarFormulario(): string {
    const { nombre, apellido, email, identificacion, password, confirmarPassword } = this.form;

    if (!nombre.trim() || nombre.trim().length < 2 || nombre.trim().length > 100)
      return 'El nombre es obligatorio y debe tener entre 2 y 100 caracteres.';

    if (!apellido.trim() || apellido.trim().length < 2 || apellido.trim().length > 100)
      return 'El apellido es obligatorio y debe tener entre 2 y 100 caracteres.';

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return 'Debes ingresar un correo electrónico válido.';

    if (!identificacion.trim() || identificacion.trim().length < 5 || identificacion.trim().length > 20)
      return 'La identificación es obligatoria y debe tener entre 5 y 20 caracteres.';

    if (!password || password.length < 6 || password.length > 50)
      return 'La contraseña es obligatoria y debe tener entre 6 y 50 caracteres.';

    if (confirmarPassword !== password)
      return 'La confirmación de contraseña no coincide.';

    return '';
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return 'No se pudo crear el administrativo.';
    if (error.status === 400) return 'Datos inválidos. Revisa los campos del formulario.';
    if (error.status === 403) return 'No tienes permisos para crear administrativos.';
    if (error.status === 409) return 'El correo o la identificación ya están registrados.';
    if (error.status >= 500)  return 'Error del servidor al crear el administrativo.';
    return 'No se pudo crear el administrativo.';
  }
}