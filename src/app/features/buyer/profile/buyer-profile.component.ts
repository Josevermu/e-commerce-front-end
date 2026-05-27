import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BuyerService } from '../../../core/services/services';
import { AuthService } from '../../../core/services/auth.service';
import { BuyerProfile } from '../../../core/models';

/**
 * BuyerProfileComponent
 *
 * Permite al comprador ver y editar su perfil, y eliminar su cuenta.
 *
 * Endpoints:
 *   GET  /buyers/{id}      → cargar perfil actual
 *   PATCH /buyers/{id}     → actualizar nombre, teléfono, dirección
 *   DELETE /buyers/{id}    → eliminar cuenta (con confirmación)
 */
@Component({
  selector: 'app-buyer-profile',
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mi Perfil</h1>
        <p class="page-subtitle">Gestiona tu información personal</p>
      </div>
    </div>

    <div *ngIf="loading" class="loading-state">
      <span class="spinner"></span> Cargando perfil…
    </div>

    <div class="profile-layout" *ngIf="!loading">

      <!-- Avatar / resumen -->
      <div class="profile-sidebar card">
        <div class="avatar">{{ initials }}</div>
        <div class="profile-name">{{ profile?.nombres }}</div>
        <div class="profile-email">{{ profile?.correo }}</div>
        <div class="profile-badge">
          <span class="badge badge-success">✓ Comprador activo</span>
        </div>
        <hr style="margin:1.25rem 0; border-color:#f3f4f6;">
        <button class="btn btn-danger btn-block" (click)="deleteConfirm = true">
          🗑 Eliminar cuenta
        </button>
      </div>

      <!-- Formulario de edición -->
      <div class="card profile-form-card">
        <h2 class="card-title" style="margin-bottom:1.5rem;">Editar información</h2>

        <div *ngIf="successMsg" class="alert alert-success">✅ {{ successMsg }}</div>
        <div *ngIf="errorMsg"   class="alert alert-danger">❌ {{ errorMsg }}</div>

        <form [formGroup]="profileForm" (ngSubmit)="save()">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre completo *</label>
              <input class="form-control" formControlName="nombre" placeholder="Tu nombre" />
              <span class="form-error"
                *ngIf="profileForm.get('nombre')?.invalid && profileForm.get('nombre')?.touched">
                El nombre es obligatorio
              </span>
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-control" formControlName="telefono" placeholder="Ej: 3001234567" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Dirección de envío predeterminada</label>
            <input class="form-control" formControlName="direccion"
              placeholder="Calle, carrera, número…" />
          </div>

          <div class="form-group">
            <label class="form-label">Ciudad</label>
            <input class="form-control" formControlName="ciudad" placeholder="Bogotá, Medellín…" />
          </div>

          <div class="form-footer">
            <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || saving">
              {{ saving ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirmación eliminación -->
    <div class="modal-overlay" *ngIf="deleteConfirm" (click)="deleteConfirm = false">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <h3 class="modal-title" style="color:#EF4444;">⚠️ Eliminar cuenta</h3>
        <p style="color:#6b7280; margin-bottom:1.5rem; line-height:1.6;">
          Esta acción es <strong>irreversible</strong>. Se eliminarán todos tus datos,
          pedidos e historial de compras.
        </p>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="deleteConfirm = false">Cancelar</button>
          <button class="btn btn-danger" (click)="deleteAccount()" [disabled]="deleting">
            {{ deleting ? 'Eliminando…' : 'Sí, eliminar cuenta' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 768px) {
      .profile-layout { grid-template-columns: 1fr; }
    }
    .profile-sidebar {
      text-align: center;
      padding: 2rem 1.5rem;
    }
    .avatar {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.6rem; font-weight: 800; color: #fff;
      margin: 0 auto 1rem;
    }
    .profile-name  { font-size: 1.1rem; font-weight: 700; color: var(--primary); }
    .profile-email { font-size: .82rem; color: #9ca3af; margin-top: .25rem; }
    .profile-badge { margin-top: .75rem; }
    .btn-block     { width: 100%; }
    .btn-danger    { background: #EF4444; color: #fff; border-color: #EF4444; }
    .btn-danger:hover { background: #DC2626; }
    .profile-form-card { padding: 1.75rem; }
    .form-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
    }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
    .form-footer   { margin-top: 1.5rem; display: flex; justify-content: flex-end; }
    .alert         { padding: .85rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: .9rem; }
    .alert-success { background: #ECFDF5; color: #065F46; border: 1px solid #6EE7B7; }
    .alert-danger  { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
  `]
})
export class BuyerProfileComponent implements OnInit {
  loading     = true;
  saving      = false;
  deleting    = false;
  deleteConfirm = false;
  successMsg  = '';
  errorMsg    = '';
  profile!: BuyerProfile;
  profileForm!: FormGroup;

  get initials(): string {
    return (this.profile?.nombres ?? 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  constructor(
    private buyerSvc: BuyerService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      nombre:    ['', Validators.required],
      telefono:  [''],
      direccion: [''],
      ciudad:    [''],
    });
    const id = this.auth.currentState.relatedEntityId ?? '';
    this.buyerSvc.getById(id).subscribe({
      next: (p) => {
        this.profile = p;
        this.profileForm.patchValue(p);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  /** PATCH /buyers/{id} — actualiza campos editables */
  save(): void {
    if (this.profileForm.invalid) return;
    this.saving = true;
    this.successMsg = '';
    this.errorMsg   = '';
    const id = this.auth.currentState.relatedEntityId ?? '';
    this.buyerSvc.update(id, this.profileForm.value).subscribe({
      next: () => {
        this.successMsg = 'Perfil actualizado correctamente.';
        this.saving = false;
      },
      error: () => {
        this.errorMsg = 'No se pudo guardar. Intenta de nuevo.';
        this.saving = false;
      }
    });
  }

  /** DELETE /buyers/{id} → logout */
  deleteAccount(): void {
    this.deleting = true;
    const id = this.auth.currentState.relatedEntityId ?? '';
    this.buyerSvc.delete(id).subscribe({
      next: () => { this.auth.logout(); },
      error: () => { this.deleting = false; }
    });
  }
}
