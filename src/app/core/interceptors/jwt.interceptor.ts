// ============================================================
// KONRAD — Interceptor JWT + Guards de Ruta
// ============================================================

// ── jwt.interceptor.ts ───────────────────────────────────────

import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * JwtInterceptor — Inyecta el token Bearer en TODAS las peticiones HTTP.
 *
 * También maneja:
 *   - 401 Unauthorized → logout automático y redirección al login
 *   - 403 Forbidden    → redirección a página de acceso denegado
 *
 * Registro en AppModule:
 *   { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();

    // Clonar request y agregar Authorization header si hay token
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token inválido o expirado — cerrar sesión
          this.auth.logout();
        } else if (error.status === 403) {
          // Sin permisos — redirigir
          this.router.navigate(['/forbidden']);
        }
        return throwError(() => error);
      })
    );
  }
}

// ── auth.guard.ts ────────────────────────────────────────────


import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';

/**
 * AuthGuard — Protege rutas que requieren sesión activa.
 *
 * Si no hay token, redirige al login guardando la URL de retorno.
 *
 * Uso en rutas:
 *   { path: 'buyer', canActivate: [AuthGuard], component: ... }
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (this.auth.isLoggedIn()) return true;

    // Guardar URL intentada para redirigir después del login
    return this.router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}

// ── role.guard.ts ────────────────────────────────────────────


import { UserRole } from '../models';

/**
 * RoleGuard — Protege rutas por rol específico.
 *
 * Configuración en la ruta:
 *   {
 *     path: 'director',
 *     canActivate: [RoleGuard],
 *     data: { roles: ['DIRECTOR', 'ADMIN'] }
 *   }
 *
 * Si el rol del usuario no está en la lista, redirige a /forbidden.
 */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowedRoles: UserRole[] = route.data['roles'] || [];

    if (!this.auth.isLoggedIn()) {
      return this.router.createUrlTree(['/auth/login']);
    }

    if (allowedRoles.length === 0 || this.auth.hasRole(...allowedRoles)) {
      return true;
    }

    return this.router.createUrlTree(['/forbidden']);
  }
}
