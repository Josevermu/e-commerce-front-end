import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * LoginComponent — Pantalla de inicio de sesión.
 *
 * Llama a POST /auth/login → recibe token + rol → redirige según rol.
 * Soporta "returnUrl" para redirigir a la ruta original si el guard
 * interceptó la navegación.
 */
@Component({
  selector: 'app-login',
  template: `
    <div class="login-page">
      <div class="login-panel">
        <!-- Decoración izquierda -->
        <div class="login-panel__deco">
          <div class="login-panel__deco-content">
            <div class="login-brand">
              <div class="login-brand__logo">K</div>
              <span class="login-brand__name">KONRAD</span>
            </div>
            <h2 class="login-panel__headline">La plataforma e-commerce que conecta Colombia</h2>
            <p class="login-panel__sub">Vendedores, compradores y el director comercial en un solo lugar.</p>
            <div class="login-panel__features">
              <div class="feat" *ngFor="let f of features">
                <span class="feat__icon">{{ f.icon }}</span>
                <span>{{ f.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulario derecho -->
        <div class="login-panel__form">
          <h1 class="login-form__title">Bienvenido de vuelta</h1>
          <p class="login-form__sub">Ingresa tus credenciales para continuar</p>

          <div *ngIf="errorMessage" class="alert alert-danger">
            ⚠️ {{ errorMessage }}
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">
            <div class="form-group">
              <label for="email">Correo electrónico</label>
              <input
                id="email" type="email" class="form-control"
                [class.is-invalid]="submitted && form.get('email')?.invalid"
                formControlName="email" placeholder="correo@ejemplo.com"
                autocomplete="email"
              />
              <div class="form-error" *ngIf="submitted && form.get('email')?.hasError('required')">
                El correo es requerido
              </div>
              <div class="form-error" *ngIf="submitted && form.get('email')?.hasError('email')">
                Ingresa un correo válido
              </div>
            </div>

            <div class="form-group">
              <label for="password">Contraseña</label>
              <div class="input-with-icon">
                <input
                  id="password" [type]="showPassword ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="submitted && form.get('password')?.invalid"
                  formControlName="password" placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button type="button" class="input-toggle" (click)="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁' }}
                </button>
              </div>
              <div class="form-error" *ngIf="submitted && form.get('password')?.hasError('required')">
                La contraseña es requerida
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="loading">
              <span *ngIf="!loading">Iniciar sesión</span>
              <span *ngIf="loading" class="flex items-center gap-1">
                <span class="spinner"></span> Verificando...
              </span>
            </button>
          </form>

          <div class="login-links">
            <span>¿Eres nuevo?</span>
            <a routerLink="/buyers/register">Registrarse como comprador</a>
            <span>·</span>
            <a routerLink="/sellers/apply">Solicitar ser vendedor</a>
          </div>

          <!-- Usuarios de prueba (solo desarrollo) -->
          <div class="test-users">
            <p class="test-users__title">Usuarios de prueba (dev)</p>
            <div class="test-user" *ngFor="let u of testUsers" (click)="fillCredentials(u)">
              <span class="badge badge-{{ u.badgeClass }}">{{ u.role }}</span>
              <span class="test-user__email">{{ u.email }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--color-bg); padding: 1rem;
    }
    .login-panel {
      display: grid; grid-template-columns: 1fr 1fr;
      max-width: 960px; width: 100%;
      border-radius: var(--radius-xl); overflow: hidden;
      box-shadow: var(--shadow-xl);
    }
    .login-panel__deco {
      background: linear-gradient(160deg, var(--color-navy) 0%, var(--color-navy-light) 60%, #1d3f61 100%);
      padding: 3rem;
      display: flex; flex-direction: column; justify-content: center;
      position: relative; overflow: hidden;
      &::after {
        content: '';
        position: absolute; bottom: -60px; right: -60px;
        width: 200px; height: 200px; border-radius: 50%;
        background: rgba(244, 98, 58, 0.15);
      }
    }
    .login-brand { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 2.5rem; }
    .login-brand__logo {
      width: 44px; height: 44px; border-radius: 12px; background: var(--color-orange);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-weight: 800; font-size: 1.5rem; color: white;
    }
    .login-brand__name { font-family: var(--font-display); font-weight: 800; font-size: 1.5rem; color: white; letter-spacing: 0.08em; }
    .login-panel__headline { font-family: var(--font-display); font-size: 1.625rem; color: white; line-height: 1.3; margin-bottom: 1rem; }
    .login-panel__sub { color: rgba(255,255,255,0.65); font-size: 0.9375rem; line-height: 1.6; margin-bottom: 2rem; }
    .login-panel__features { display: flex; flex-direction: column; gap: 0.75rem; }
    .feat { display: flex; align-items: center; gap: 0.625rem; color: rgba(255,255,255,0.8); font-size: 0.9375rem; }
    .feat__icon { font-size: 1.125rem; }

    .login-panel__form { background: var(--color-surface); padding: 3rem; display: flex; flex-direction: column; justify-content: center; }
    .login-form__title { font-family: var(--font-display); font-size: 1.75rem; font-weight: 700; margin-bottom: 0.375rem; }
    .login-form__sub { color: var(--text-secondary); margin-bottom: 2rem; }

    .input-with-icon { position: relative; }
    .input-with-icon .form-control { padding-right: 2.5rem; }
    .input-toggle { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1rem; }

    .login-links { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 1.5rem; font-size: 0.875rem; color: var(--text-muted); justify-content: center; }

    .test-users {
      margin-top: 1.75rem; padding: 1rem;
      background: var(--color-bg); border-radius: var(--radius-md);
      border: 1px dashed var(--color-border);
    }
    .test-users__title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.75rem; }
    .test-user { display: flex; align-items: center; gap: 0.625rem; padding: 0.375rem 0.5rem; border-radius: var(--radius-sm); cursor: pointer; transition: background var(--transition-fast); &:hover { background: white; } }
    .test-user__email { font-size: 0.8125rem; color: var(--text-secondary); }

    @media (max-width: 640px) {
      .login-panel { grid-template-columns: 1fr; }
      .login-panel__deco { padding: 2rem; }
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  submitted = false;
  showPassword = false;
  errorMessage = '';
  private returnUrl = '/';

  features = [
    { icon: '🛍️', label: 'Vitrina pública de productos' },
    { icon: '📊', label: 'KPIs y tablero del director' },
    { icon: '💳', label: 'Pagos PSE, tarjeta y consignación' },
    { icon: '🔔', label: 'Notificaciones automáticas' },
  ];

  /** Credenciales de prueba precargadas (entorno mock) */
  testUsers = [
    { role: 'DIRECTOR', email: 'director@konrad.com', password: 'Director123', badgeClass: 'info' },
    { role: 'SELLER',   email: 'vendedor@tienda.com', password: 'Seller123',   badgeClass: 'warning' },
    { role: 'BUYER',    email: 'comprador@gmail.com', password: 'Buyer123',    badgeClass: 'success' },
    { role: 'ADMIN',    email: 'admin@konrad.com',    password: 'Admin123',    badgeClass: 'purple' },
  ];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] ?? '/';
  }

  fillCredentials(user: { email: string; password: string }): void {
    this.form.patchValue({ email: user.email, password: user.password });
  }

  submit(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (this.form.invalid) return;

    this.loading = true;
    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        // Redirigir a URL previa o al dashboard del rol
        if (this.returnUrl !== '/') {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.auth.redirectByRole();
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'Credenciales inválidas. Intenta nuevamente.';
      }
    });
  }
}