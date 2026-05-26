import { Component, OnInit } from '@angular/core';
import { Router, RouterLink,RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { TokenService } from '../../../services/token.service';
import { RolNombre } from '../../../models/auth.models';

@Component({
  standalone: true,
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
   imports: [CommonModule, RouterLink, RouterLinkActive]
})
export class NavbarComponent implements OnInit {
  currentRole: RolNombre | null = null;
  userEmail: string | null = null;

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentRole = this.authService.getCurrentRole();
    this.userEmail = this.tokenService.getEmail();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  isStudentRole(): boolean {
    return this.currentRole === 'ESTUDIANTE';
  }

  isAdminRole(): boolean {
    return this.currentRole === 'ADMINISTRATIVO';
  }

  isCoordinatorRole(): boolean {
    return this.currentRole === 'COORDINADOR';
  }
}

