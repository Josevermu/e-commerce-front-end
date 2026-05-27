import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BuyerService } from '../../../core/services/services';

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
        <p class="auth-subtitle">Registrate gratis y empieza a comprar</p>
        <div *ngIf="errorMsg" class="alert alert-danger">X {{ errorMsg }}</div>
        <div *ngIf="success" class="alert alert-success">
          Cuenta creada. <a routerLink="/auth/login">Iniciar sesion</a>
        </div>
        <form [formGroup]="form" (ngSubmit)="register()" *ngIf="!success">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombres *</label>
              <input class="form-control" formControlName="nombres" placeholder="Tu nombre" />
            </div>
            <div class="form-group">
              <label class="form-label">Apellidos *</label>
              <input class="form-control" formControlName="apellidos" placeholder="Tus apellidos" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Identificacion *</label>
              <input class="form-control" formControlName="identificacion" placeholder="Cedula" />
            </div>
            <div class="form-group">
              <label class="form-label">Telefono</label>
              <input class="form-control" formControlName="telefono" placeholder="3001234567" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Correo electronico *</label>
            <input class="form-control" type="email" formControlName="correo" placeholder="tu@email.com" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Pais *</label>
              <input class="form-control" formControlName="pais" placeholder="Colombia" />
            </div>
            <div class="form-group">
              <label class="form-label">Ciudad *</label>
              <input class="form-control" formControlName="ciudad" placeholder="Bogota" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Direccion *</label>
            <input class="form-control" formControlName="direccion" placeholder="Cra 15 80-32" />
          </div>
          <button type="submit" class="btn btn-primary btn-block" [disabled]="form.invalid || loading">
            {{ loading ? "Creando cuenta..." : "Crear cuenta gratis" }}
          </button>
          <p class="auth-footer">Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesion</a></p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#F5F6FA; padding:2rem 1rem; }
    .auth-card { background:#fff; border-radius:16px; padding:2.5rem 2rem; box-shadow:0 4px 24px rgba(0,0,0,.09); width:100%; max-width:560px; }
    .auth-brand { display:flex; align-items:center; gap:.6rem; margin-bottom:1.5rem; }
    .brand-logo { width:36px; height:36px; background:#0D1B2A; color:#fff; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:900; }
    .brand-name { font-weight:800; font-size:1.2rem; color:#0D1B2A; }
    .auth-title { font-size:1.6rem; font-weight:800; color:#0D1B2A; margin:0 0 .25rem; }
    .auth-subtitle { font-size:.9rem; color:#6b7280; margin-bottom:1.5rem; }
    .auth-footer { text-align:center; margin-top:1.25rem; font-size:.88rem; color:#6b7280; }
    .auth-footer a { color:#F4623A; font-weight:600; text-decoration:none; }
    .btn-block { width:100%; margin-top:.5rem; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .alert { padding:.75rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:.88rem; }
    .alert-danger { background:#FEF2F2; color:#991B1B; border:1px solid #FECACA; }
    .alert-success { background:#ECFDF5; color:#065F46; border:1px solid #6EE7B7; }
  `]
})
export class BuyerRegisterComponent {
  loading = false; success = false; errorMsg = '';
  form: FormGroup;
  constructor(private buyerSvc: BuyerService, private fb: FormBuilder) {
    this.form = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      identificacion: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      pais: ['Colombia', Validators.required],
      ciudad: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: [''],
    });
  }
  register(): void {
    if (this.form.invalid) return;
    this.loading = true; this.errorMsg = '';
    this.buyerSvc.register(this.form.value).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err: any) => { this.errorMsg = err?.error?.message ?? 'Error al crear la cuenta.'; this.loading = false; }
    });
  }
}
