import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { throwError, catchError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenService);
  return next(req).pipe(
    // catchError operator for handling error
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 || error.status === 403) {
          tokenService.clearToken();
        }
      }
      return throwError(() => error);
    })
  );
};
