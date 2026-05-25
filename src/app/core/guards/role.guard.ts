import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles: string[] | undefined = route.data['roles'];
  const currentRole = authService.getCurrentRole();
  if (roles && roles.includes(currentRole!)) {
    return true;
  } else {
    router.navigate(['/forbidden']);
    return false;
  }
};
