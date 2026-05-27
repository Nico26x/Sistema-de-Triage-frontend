import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  // ===== Colores del sistema =====
  private readonly PRIMARY   = '#2e7d52';
  private readonly DANGER    = '#dc2626';
  private readonly WARNING   = '#b45309';
  private readonly INFO      = '#1a56db';

  // ===== Toast (esquina, desaparece solo) =====
  toast(icon: 'success' | 'error' | 'warning' | 'info', message: string, duration = 3000): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: message,
      showConfirmButton: false,
      timer: duration,
      timerProgressBar: true,
      customClass: { popup: 'swal-toast-custom' }
    });
  }

  // ===== Success =====
  success(title: string, message = ''): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'success',
      title,
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: this.PRIMARY,
      customClass: { popup: 'swal-custom' }
    });
  }

  // ===== Error =====
  error(title: string, message = ''): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonText: 'Entendido',
      confirmButtonColor: this.DANGER,
      customClass: { popup: 'swal-custom' }
    });
  }

  // ===== Warning =====
  warning(title: string, message = ''): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: this.WARNING,
      customClass: { popup: 'swal-custom' }
    });
  }

  // ===== Info =====
  info(title: string, message = ''): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'info',
      title,
      text: message,
      confirmButtonText: 'Entendido',
      confirmButtonColor: this.INFO,
      customClass: { popup: 'swal-custom' }
    });
  }

  // ===== Confirmación (Sí / No) =====
  confirm(
    title: string,
    message = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'question',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: this.PRIMARY,
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      customClass: { popup: 'swal-custom' }
    });
  }

  // ===== Confirmación peligrosa (eliminar, etc.) =====
  confirmDanger(
    title: string,
    message = '',
    confirmText = 'Eliminar',
    cancelText = 'Cancelar'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: this.DANGER,
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      customClass: { popup: 'swal-custom' }
    });
  }

  // ===== Loading (mostrar / ocultar) =====
  showLoading(message = 'Procesando...'): void {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: { popup: 'swal-custom' },
      didOpen: () => Swal.showLoading()
    });
  }

  hideLoading(): void {
    Swal.close();
  }
}