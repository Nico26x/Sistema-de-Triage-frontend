import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../services/auth.service';
import { AlertService } from '../../../../services/alert.service';
import { CommonModule } from '@angular/common';



@Component({ 
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, RouterLink, CommonModule]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.alertService.toast('warning', 'Debe ingresar correo y contraseña.');
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.authService
      .login({ email: this.email, password: this.password })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.alertService.toast('success', '¡Bienvenido! Redirigiendo...');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          this.error = this.obtenerMensajeErrorLogin(error);
          this.cdr.detectChanges();

          Swal.fire({
            icon: 'error',
            title: 'No se pudo iniciar sesión',
            text: this.error,
            confirmButtonText: 'Intentar de nuevo'
          });
        }
      });
  }

  private obtenerMensajeErrorLogin(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return 'Credenciales incorrectas.';
      }

      if (error.status === 0) {
        return 'No se pudo conectar con el servidor.';
      }

      if (error.status >= 500) {
        return 'Error del servidor al iniciar sesión.';
      }
    }

    return 'No se pudo iniciar sesión.';
  }
}
