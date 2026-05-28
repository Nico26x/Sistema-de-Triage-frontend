import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { UsuarioResponse } from '../../../../models/usuario.models';
import { AuthService } from '../../../../services/auth.service';
import { TokenService } from '../../../../services/token.service';
import { UsuarioService } from '../../../../services/usuario.service';
import { AlertService } from '../../../../services/alert.service'; // ← importar

@Component({
  standalone: true,
  selector: 'app-usuarios-page',
  templateUrl: './usuarios-page.component.html',
  styleUrls: ['./usuarios-page.component.css'],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class UsuariosPageComponent implements OnInit {
  usuarios: UsuarioResponse[] = [];
  usuariosFiltrados: UsuarioResponse[] = [];
  terminoBusqueda = '';
  filtroRol = '';
  filtroEstado = '';
  loading = false;
  error = '';
  accionEnCurso = false;
  usuarioActualId: number | null = null;
  rolActual = '';

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private alert: AlertService // ← inyectar
  ) { }

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
      .pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: usuarios => {
          this.usuarios = usuarios ?? [];
          this.aplicarFiltros();
          this.error = '';
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.usuarios = [];
          this.usuariosFiltrados = [];
          this.error = this.obtenerMensajeError(error);
          this.alert.error('Error al cargar usuarios', this.error);
          this.cdr.detectChanges();
        }
      });
  }

  refrescar(): void {
    this.cargarUsuarios();
    this.alert.toast('info', 'Actualizando lista de usuarios...');
  }

  aplicarFiltros(): void {
    this.usuariosFiltrados = this.usuarios.filter(
      u => this.coincideBusqueda(u) && this.coincideRol(u) && this.coincideEstado(u)
    );
    this.alert.toast('success', 'Filtros aplicados.'); // ← agregar
    this.cdr.detectChanges();
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroRol = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
    this.alert.toast('info', 'Filtros eliminados.');
  }

  async activarUsuario(usuario: UsuarioResponse): Promise<void> {
    if (!this.puedeGestionarEstado(usuario)) return;

    const result = await this.alert.confirm(
      `¿Activar a ${usuario.nombre}?`,
      'El usuario podrá ingresar al sistema nuevamente.',
      'Sí, activar',
      'Cancelar'
    );

    if (!result.isConfirmed) return;

    this.accionEnCurso = true;
    this.cdr.detectChanges();

    this.usuarioService
      .activarUsuario(usuario.id)
      .pipe(finalize(() => { this.accionEnCurso = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: () => {
          this.alert.toast('success', `${usuario.nombre} fue activado correctamente.`);
          this.cargarUsuarios();
        },
        error: (error: unknown) => {
          this.alert.error('Error al activar usuario', this.obtenerMensajeErrorAccion(error));
          this.cdr.detectChanges();
        }
      });
  }

  async desactivarUsuario(usuario: UsuarioResponse): Promise<void> {
    if (!this.puedeGestionarEstado(usuario)) return;

    const result = await this.alert.confirmDanger(
      `¿Desactivar a ${usuario.nombre}?`,
      'El usuario no podrá ingresar al sistema hasta que sea activado nuevamente.',
      'Sí, desactivar',
      'Cancelar'
    );

    if (!result.isConfirmed) return;

    this.accionEnCurso = true;
    this.cdr.detectChanges();

    this.usuarioService
      .desactivarUsuario(usuario.id)
      .pipe(finalize(() => { this.accionEnCurso = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: () => {
          this.alert.toast('success', `${usuario.nombre} fue desactivado.`);
          this.cargarUsuarios();
        },
        error: (error: unknown) => {
          this.alert.error('Error al desactivar usuario', this.obtenerMensajeErrorAccion(error));
          this.cdr.detectChanges();
        }
      });
  }

  puedeGestionarEstado(usuario: UsuarioResponse): boolean {
    if (this.rolActual !== 'COORDINADOR') return false;
    if (this.usuarioActualId !== null && usuario.id === this.usuarioActualId) return false;
    return true;
  }

  esUsuarioAutenticado(usuario: UsuarioResponse): boolean {
    return this.usuarioActualId !== null && usuario.id === this.usuarioActualId;
  }

  coincideBusqueda(usuario: UsuarioResponse): boolean {
    const termino = this.terminoBusqueda.trim().toLowerCase();
    if (!termino) return true;
    return (
      (usuario.nombre?.toLowerCase() ?? '').includes(termino) ||
      (usuario.email?.toLowerCase() ?? '').includes(termino) ||
      (usuario.identificacion?.toLowerCase() ?? '').includes(termino)
    );
  }

  coincideRol(usuario: UsuarioResponse): boolean {
    return !this.filtroRol || usuario.rol === this.filtroRol;
  }

  coincideEstado(usuario: UsuarioResponse): boolean {
    if (!this.filtroEstado) return true;
    if (this.filtroEstado === 'ACTIVO') return usuario.activo === true;
    if (this.filtroEstado === 'INACTIVO') return usuario.activo === false;
    return true;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return 'No se pudieron cargar los usuarios.';
    if (error.status === 0) return 'No se pudo conectar con el servidor.';
    if (error.status === 401 || error.status === 403) return 'No tienes permisos para consultar usuarios.';
    if (error.status >= 500) return 'Error del servidor al cargar usuarios.';
    return 'No se pudieron cargar los usuarios.';
  }

  private obtenerMensajeErrorAccion(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return 'No se pudo cambiar el estado del usuario.';
    if (error.status === 0) return 'No se pudo conectar con el servidor.';
    if (error.status === 403) return 'No tienes permisos para cambiar el estado de usuarios.';
    if (error.status === 404) return 'El usuario no existe.';
    if (error.status === 409) return 'No se pudo cambiar el estado por un conflicto de datos.';
    if (error.status >= 500) return 'Error del servidor al cambiar el estado del usuario.';
    return 'No se pudo cambiar el estado del usuario.';
  }
}