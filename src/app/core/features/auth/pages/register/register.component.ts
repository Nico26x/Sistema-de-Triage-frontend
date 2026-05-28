import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { AlertService } from '../../../../services/alert.service';
import { CommonModule } from '@angular/common';



@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [FormsModule, RouterLink, CommonModule]
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {}

  onSubmit() {
    this.error = '';
    this.success = '';

    if (!this.nombre || !this.email || !this.identificacion || !this.password || !this.confirmPassword) {
      this.alertService.toast('warning', 'Todos los campos son obligatorios.');
      return;
    }

    if (!this.validateEmail(this.email)) {
      this.alertService.toast('error', 'Ingrese un correo electrónico válido.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.alertService.toast('error', 'Las contraseñas no coinciden.');
      return;
    }

    if (this.password.length < 8) {
      this.alertService.toast('warning', 'La contraseña debe tener mínimo 8 caracteres.');
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
        this.alertService.toast('success', '¡Registro exitoso! Redirigiendo...');
        
        // Limpiar formulario
        this.nombre = '';
        this.email = '';
        this.identificacion = '';
        this.password = '';
        this.confirmPassword = '';
        
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: (err) => {
        const errorMessage = err?.error?.message || 'Error al registrarse. Verifique los datos o intente más tarde.';
        this.error = errorMessage;
        this.alertService.error(
          'Error en el registro',
          errorMessage
        );
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