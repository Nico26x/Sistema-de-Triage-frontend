import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { TokenService } from '../../../../services/token.service';
import { RolNombre } from '../../../../models/auth.models';

@Component({
  standalone: true,
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css'],
  imports: [CommonModule]
})
export class DashboardHomeComponent implements OnInit {
  userRole: RolNombre | null = null;
  userEmail: string | null = null;

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getCurrentRole();
    this.userEmail = this.tokenService.getEmail();
  }

  isStudentRole(): boolean {
    return this.userRole === 'ESTUDIANTE';
  }

  isAdminRole(): boolean {
    return this.userRole === 'ADMINISTRATIVO';
  }

  isCoordinatorRole(): boolean {
    return this.userRole === 'COORDINADOR';
  }

  goToSolicitudes(): void {
    this.router.navigate(['/dashboard/solicitudes']);
  }
}
