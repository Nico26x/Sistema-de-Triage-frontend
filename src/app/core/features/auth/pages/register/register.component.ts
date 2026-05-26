import { Component } from '@angular/core';
import { Router,RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [FormsModule,RouterLink]
})
export class RegisterComponent {
  nombre = '';
  email = '';
  identificacion = '';
  password = '';
  confirmPassword = '';
  loading = false;
  error = '';
  success = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.error = '';
    this.success = '';
    if (!this.nombre || !this.email || !this.identificacion || !this.password || !this.confirmPassword) {
      this.error = 'Todos los campos son obligatorios.';
      return;
    }
    if (!this.validateEmail(this.email)) {
      this.error = 'Ingrese un correo electrónico válido.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }
    this.loading = true;
    this.authService.register({
      nombre: this.nombre,
      email: this.email,
      identificacion: this.identificacion,
      password: this.password
    }).subscribe({
      next: () => {
        this.success = 'Registro exitoso. Redirigiendo a login.';
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err) => {
        if (err?.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Error al registrarse. Verifique los datos o intente más tarde.';
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private validateEmail(email: string): boolean {
    // Simple RFC 5322 email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
