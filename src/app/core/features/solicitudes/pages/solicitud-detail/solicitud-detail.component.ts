import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { SolicitudService } from '../../../../services/solicitud.service';
import { SolicitudResponse } from '../../../../models/solicitud.models';

@Component({
  standalone: true,
  selector: 'app-solicitud-detail',
  templateUrl: './solicitud-detail.component.html',
  imports: [CommonModule]
})
export class SolicitudDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private solicitudService = inject(SolicitudService);
  private cdr = inject(ChangeDetectorRef);

  solicitud: SolicitudResponse | null = null;
  loading = false;
  error = '';
  private solicitudId: number | null = null;

  ngOnInit(): void {
    this.leerIdRuta();
    if (this.solicitudId !== null) {
      this.cargarDetalle();
    }
  }

  cargarDetalle(): void {
    if (this.solicitudId === null) {
      this.error = 'El identificador de solicitud no es valido.';
      this.solicitud = null;
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';

    this.solicitudService
      .obtenerSolicitudPorId(this.solicitudId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.solicitud = response;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          this.solicitud = null;
          this.error = this.obtenerMensajeError(error);
          this.cdr.detectChanges();
        }
      });
  }

  actualizarDetalle(): void {
    this.cargarDetalle();
  }

  volverAMisSolicitudes(): void {
    this.router.navigate(['/dashboard/solicitudes/mis-solicitudes']);
  }

  private leerIdRuta(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || Number.isNaN(id) || id <= 0) {
      this.error = 'El identificador de solicitud no es valido.';
      this.solicitud = null;
      this.loading = false;
      this.solicitudId = null;
      this.cdr.detectChanges();
      return;
    }

    this.solicitudId = id;
  }

  private obtenerMensajeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No fue posible cargar el detalle de la solicitud.';
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'Tu sesion expiro o no tienes permisos para ver esta solicitud.';
    }

    if (error.status === 404) {
      return 'No se encontro la solicitud solicitada.';
    }

    if (error.status >= 500) {
      return 'El servidor tuvo un problema al consultar el detalle.';
    }

    return 'No fue posible cargar el detalle de la solicitud.';
  }
}
