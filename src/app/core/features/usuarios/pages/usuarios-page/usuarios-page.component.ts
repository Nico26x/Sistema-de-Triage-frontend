import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { UsuarioResponse } from '../../../../models/usuario.models';
import { UsuarioService } from '../../../../services/usuario.service';

@Component({
  standalone: true,
  selector: 'app-usuarios-page',
  templateUrl: './usuarios-page.component.html',
  imports: [CommonModule]
})
export class UsuariosPageComponent implements OnInit {
  usuarios: UsuarioResponse[] = [];
  loading = false;
  error = '';

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
}
