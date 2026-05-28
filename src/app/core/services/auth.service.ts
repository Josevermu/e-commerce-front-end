import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  LoginRequest, LoginResponse, ChangePasswordRequest,
  UserResponse, AuthState, UserRole
} from '../models';
import { environment } from '../../../environments/environment';

/**
 * AuthService — Gestión de autenticación JWT.
 *
 * Responsabilidades:
 * - login() / logout(): flujo de sesión
 * - Persistencia del token en localStorage
 * - BehaviorSubject del estado actual para que cualquier componente
 *   pueda reaccionar a cambios de sesión (navbar, guards, etc.)
 * - Utilidades: isLoggedIn(), getRole(), hasRole()
 *
 * Endpoints consumidos:
 *   POST /auth/login
 *   POST /auth/change-password/{userId}
 *   GET  /auth/users   (solo ADMIN)
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly BASE = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'konrad_token';
  private readonly STATE_KEY = 'konrad_auth';

  // Estado reactivo compartido en toda la app
  private authState$ = new BehaviorSubject<AuthState | null>(this.loadState());
  private get state(): AuthState | null { return this.authState$.getValue(); }

  constructor(private http: HttpClient, private router: Router) {}

  // ── Sesión ──────────────────────────────────────────────────

  /**
   * Autenticar usuario y guardar estado de sesión.
   * POST /auth/login → { token, role, userId, relatedEntityId }
   */
  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE}/login`, req).pipe(
      tap(res => {
        const state: AuthState = {
          token:           res.token,
          role:            res.role,
          userId:          res.userId,
          relatedEntityId: res.relatedEntityId,
          email:           req.email,
        };
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.STATE_KEY, JSON.stringify(state));
        this.authState$.next(state);
      })
    );
  }

  /** Destruir sesión y redirigir al login */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.STATE_KEY);
    this.authState$.next(null);
    this.router.navigate(['/auth/login']);
  }

  // ── Utilidades de sesión ────────────────────────────────────

  /** Observable del estado de autenticación */
  get state$(): Observable<AuthState | null> { return this.authState$.asObservable(); }

  /** Snapshot del estado actual */
  get state(): AuthState | null { return this.authState$.getValue(); }

  /** ¿Hay sesión activa? */
  isLoggedIn(): boolean { return !!this.state; }

  /** Token JWT crudo */
  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

  /** Rol del usuario logueado */
  getRole(): UserRole | null { return this.state?.role ?? null; }

  /** ¿El usuario tiene alguno de los roles indicados? */
  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this.state?.role as UserRole);
  }

  /** ID del vendedor/comprador relacionado con el usuario */
  getRelatedEntityId(): string { return this.state?.relatedEntityId ?? ''; }
  getUserId(): string          { return this.state?.userId ?? ''; }

  /**
   * Expone el estado de auth actual de forma sincrónica.
   * Usado por componentes que necesitan userId/relatedEntityId/email sin suscribirse.
   */
  get currentState(): Partial<AuthState> { return this.state ?? {}; }

  /** Alias de getAllUsers() para mantener consistencia de nombrado en componentes Admin */
  getUsers(): Observable<UserResponse[]> { return this.getAllUsers(); }

  // ── Endpoints ───────────────────────────────────────────────

  /**
   * Cambiar contraseña del usuario autenticado.
   * POST /auth/change-password/{userId}
   */
  changePassword(req: ChangePasswordRequest): Observable<{ message: string }> {
    const userId = this.getUserId();
    return this.http.post<{ message: string }>(
      `${this.BASE}/change-password/${userId}`, req
    );
  }

  /**
   * Obtener todos los usuarios registrados (solo ADMIN).
   * GET /auth/users
   */
  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.BASE}/users`);
  }

  // ── Helpers privados ────────────────────────────────────────

  /** Recargar estado desde localStorage al iniciar app */
  private loadState(): AuthState | null {
    try {
      const raw = localStorage.getItem(this.STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  /**
   * Redirigir al dashboard correcto según el rol del usuario.
   * Llamado después del login exitoso.
   */
  redirectByRole(): void {
    const routes: Record<UserRole, string> = {
      ADMIN:    '/admin/dashboard',
      DIRECTOR: '/director/dashboard',
      SELLER:   '/seller/dashboard',
      BUYER:    '/buyer/dashboard',
    };
    const role = this.getRole();
    this.router.navigate([role ? routes[role] : '/auth/login']);
  }
}
