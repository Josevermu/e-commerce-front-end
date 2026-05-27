import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BuyerService } from '../../../core/services/services';

/**
 * BuyerRegisterComponent
 *
 * Formulario público para que cualquier persona cree una cuenta de comprador.
 * Tras el registro exitoso se redirige al login.
 *
 * Endpoint:
 *   POST /buyers/register → { nombre, correo, password, telefono?, direccion?, ciudad? }
 */
@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  selector: 'app-buyer-register',
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <span class="brand-logo">K</span>
          <span class="brand-name">KONRAD</span>
        </div>
        <h1 class="auth-title">Crear cuenta</h1>
        <p class="auth-subtitle">Regístrate gratis y empieza a comprar</p>

        <div *ngIf="errorMsg" class="alert alert-danger">❌ {{ errorMsg }}</div>
        <div *ngIf="success"  class="alert alert-success">
          ✅ Cuenta creada. <a routerLink="/auth/login">Iniciar sesión →</a>
        </div>

        <form [formGroup]="form" (ngSubmit)="register()" *ngIf="!success">

          <div class="form-group">
            <label class="form-label">Nombre completo *</label>
            <input class="form-control" formControlName="nombre" placeholder="Tu nombre completo" />
            <span class="form-error"
              *ngIf="form.get('nombre')?.invalid && form.get('nombre')?.touched">
              El nombre es obligatorio
            </span>
          </div>

          <div class="form-group">
            <label class="form-label">Correo electrónico *</label>
            <input class="form-control" type="email" formControlName="correo"
              placeholder="tu@email.com" />
            <span class="form-error"
              *ngIf="form.get('correo')?.invalid && form.get('correo')?.touched">
              Correo inválido
            </span>
          </div>

          <div class="form-group">
            <label class="form-label">Contraseña *</label>
            <input class="form-control" type="password" formControlName="password"
              placeholder="Mínimo 8 caracteres, una mayúscula y un número" />
            <span class="form-error"
              *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
              La contraseña debe tener al menos 8 caracteres
            </span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-control" formControlName="telefono" placeholder="3001234567" />
            </div>
            <div class="form-group">
              <label class="form-label">Ciudad</label>
              <input class="form-control" formControlName="ciudad" placeholder="Bogotá" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Dirección de envío</label>
            <input class="form-control" formControlName="direccion"
              placeholder="Cra 15 #80-32, Apto 401" />
          </div>

          <button type="submit" class="btn btn-primary btn-block"
            [disabled]="form.invalid || loading">
            {{ loading ? 'Creando cuenta…' : 'Crear cuenta gratis' }}
          </button>

          <p class="auth-footer">
            ¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a>
          </p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-page    { min-height:100vh; display:flex; align-items:center; justify-content:center;
                    background:var(--bg-page,#F5F6FA); padding:2rem 1rem; }
    .auth-card    { background:#fff; border-radius:16px; padding:2.5rem 2rem;
                    box-shadow:0 4px 24px rgba(0,0,0,.09); width:100%; max-width:500px; }
    .auth-brand   { display:flex; align-items:center; gap:.6rem; margin-bottom:1.5rem; }
    .brand-logo   { width:36px; height:36px; background:var(--primary,#0D1B2A);
                    color:#fff; border-radius:8px; display:flex; align-items:center;
                    justify-content:center; font-weight:900; font-size:1.1rem; }
    .brand-name   { font-weight:800; font-size:1.2rem; color:var(--primary,#0D1B2A); }
    .auth-title   { font-size:1.6rem; font-weight:800; color:var(--primary,#0D1B2A); margin:0 0 .25rem; }
    .auth-subtitle{ font-size:.9rem; color:#6b7280; margin-bottom:1.5rem; }
    .auth-footer  { text-align:center; margin-top:1.25rem; font-size:.88rem; color:#6b7280; }
    .auth-footer a{ color:var(--accent,#F4623A); font-weight:600; text-decoration:none; }
    .btn-block    { width:100%; margin-top:.5rem; }
    .form-row     { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .alert        { padding:.75rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:.88rem; }
    .alert-danger { background:#FEF2F2; color:#991B1B; border:1px solid #FECACA; }
    .alert-success{ background:#ECFDF5; color:#065F46; border:1px solid #6EE7B7; }
    .alert-success a { color:#059669; font-weight:700; }
  `]
})
export class BuyerRegisterComponent {
  loading  = false;
  success  = false;
  errorMsg = '';

  form: FormGroup;

  constructor(private buyerSvc: BuyerService, private router: Router, private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre:    ['', Validators.required],
      correo:    ['', [Validators.required, Validators.email]],
      password:  ['', [Validators.required, Validators.minLength(8)]],
      telefono:  [''],
      ciudad:    [''],
      direccion: [''],
    });
  }

  /** POST /buyers/register */
  register(): void {
    if (this.form.invalid) return;
    this.loading  = true;
    this.errorMsg = '';
    this.buyerSvc.register(this.form.value).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.message ?? 'Error al crear la cuenta. Intenta de nuevo.';
        this.loading  = false;
      }
    });
  }
}
