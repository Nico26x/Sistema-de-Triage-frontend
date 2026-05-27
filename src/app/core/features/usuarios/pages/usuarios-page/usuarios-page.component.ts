import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { UsuarioResponse } from '../../../../models/usuario.models';
import { AuthService } from '../../../../services/auth.service';
import { TokenService } from '../../../../services/token.service';
import { UsuarioService } from '../../../../services/usuario.service';

@Component({
  standalone: true,
  selector: 'app-usuarios-page',
  templateUrl: './usuarios-page.component.html',
  imports: [CommonModule, RouterLink]
})
export class UsuariosPageComponent implements OnInit {
  usuarios: UsuarioResponse[] = [];
  loading = false;
  error = '';
  accionEnCurso = false;
  exitoAccion = '';
  errorAccion = '';
  usuarioActualId: number | null = null;
  rolActual = '';

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.rolActual = this.authService.getCurrentRole() ?? '';
    this.usuarioActualId = this.tokenService.getUserId();
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.usuarioService
      .listarUsuarios()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: usuarios => {
          this.usuarios = usuarios ?? [];
          this.error = '';
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.usuarios = [];
          this.error = this.obtenerMensajeError(error);
          this.cdr.detectChanges();
        }
      });
  }

  refrescar(): void {
    this.cargarUsuarios();
  }

  puedeGestionarEstado(usuario: UsuarioResponse): boolean {
    if (this.rolActual !== 'COORDINADOR') {
      return false;
    }

    if (this.usuarioActualId !== null && usuario.id === this.usuarioActualId) {
      return false;
    }

    return true;
  }

  esUsuarioAutenticado(usuario: UsuarioResponse): boolean {
    return this.usuarioActualId !== null && usuario.id === this.usuarioActualId;
  }

  activarUsuario(usuario: UsuarioResponse): void {
    if (!this.puedeGestionarEstado(usuario)) {
      return;
    }

    this.accionEnCurso = true;
    this.errorAccion = '';
    this.exitoAccion = '';
    this.cdr.detectChanges();

    this.usuarioService
      .activarUsuario(usuario.id)
      .pipe(
        finalize(() => {
          this.accionEnCurso = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.exitoAccion = 'Usuario activado correctamente.';
          this.cargarUsuarios();
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.errorAccion = this.obtenerMensajeErrorAccion(error);
          this.cdr.detectChanges();
        }
      });
  }

  desactivarUsuario(usuario: UsuarioResponse): void {
    if (!this.puedeGestionarEstado(usuario)) {
      return;
    }

    const confirmar = confirm('Seguro que deseas desactivar este usuario?');
    if (!confirmar) {
      return;
    }

    this.accionEnCurso = true;
    this.errorAccion = '';
    this.exitoAccion = '';
    this.cdr.detectChanges();

    this.usuarioService
      .desactivarUsuario(usuario.id)
      .pipe(
        finalize(() => {
          this.accionEnCurso = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.exitoAccion = 'Usuario desactivado correctamente.';
          this.cargarUsuarios();
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.errorAccion = this.obtenerMensajeErrorAccion(error);
          this.cdr.detectChanges();
        }
      });
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudieron cargar los usuarios.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'No tienes permisos para consultar usuarios.';
    }

    if (error.status >= 500) {
      return 'Error del servidor al cargar usuarios.';
    }

    return 'No se pudieron cargar los usuarios.';
  }

  private obtenerMensajeErrorAccion(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo cambiar el estado del usuario.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    if (error.status === 403) {
      return 'No tienes permisos para cambiar el estado de usuarios.';
    }

    if (error.status === 404) {
      return 'El usuario no existe.';
    }

    if (error.status === 409) {
      return 'No se pudo cambiar el estado por un conflicto de datos.';
    }

    if (error.status >= 500) {
      return 'Error del servidor al cambiar el estado del usuario.';
    }

    return 'No se pudo cambiar el estado del usuario.';
  }
}
