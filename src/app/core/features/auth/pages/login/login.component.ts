import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, RouterLink]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.alertService.toast('warning', 'Debe ingresar correo y contraseña.');
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.alertService.toast('success', '¡Bienvenido! Redirigiendo...');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (err) => {
          this.error = 'Credenciales inválidas o error de conexión';
          this.alertService.error(
            'Error en el inicio de sesión',
            err?.error?.message || 'Credenciales inválidas o error de conexión'
          );
        },
        complete: () => {
          this.loading = false;
        }
      });
  }
}