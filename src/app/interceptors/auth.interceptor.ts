import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { isModoAutonomo } from '../api';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Si el usuario activó "Modo Autónomo / Sin Backend", evitamos enviar peticiones de red
  // a localhost para prevenir errores net::ERR_CONNECTION_REFUSED en la consola del navegador
  if (isModoAutonomo() && (req.url.includes('/api/') || req.url.includes('localhost'))) {
    return throwError(() => new HttpErrorResponse({
      error: 'Modo Autónomo Local Activo (Petición interceptada sin backend)',
      status: 503,
      statusText: 'Modo Autónomo Local',
      url: req.url
    }));
  }

  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};

