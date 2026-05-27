import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Params, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { RolNombre } from '../../../../models/auth.models';

@Component({
  standalone: true,
  selector: 'app-solicitudes-hub',
  templateUrl: './solicitudes-hub.component.html',
  styleUrls: ['./solicitudes-hub.component.css'],
  imports: [CommonModule]
})
export class SolicitudesHubComponent implements OnInit {
  userRole: RolNombre | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.userRole = this.authService.getCurrentRole();
  }

  goTo(path: string, queryParams?: Params): void {
    this.router.navigate([path], { queryParams });
  }
}
