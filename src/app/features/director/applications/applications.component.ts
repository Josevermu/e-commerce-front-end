import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SellerService } from '../../../core/services/seller.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ApplicationSummaryResponse, ApplicationDetailResponse,
  ApplicationStatus, DecisionType
} from '../../../core/models';

// ─────────────────────────────────────────────────────────────────────────────
// ApplicationsListComponent — Listado de solicitudes (Director)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lista todas las solicitudes de vendedores para que el Director
 * pueda revisarlas y tomar decisiones.
 *
 * Endpoint: GET /sellers/applications
 * Ruta:     /director/applications
 * Rol:      DIRECTOR | ADMIN
 */
@Component({
  selector: 'app-applications-list',
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Solicitudes de vendedores</h1>
        <p class="page-subtitle">{{ applications.length }} solicitud(es) encontradas</p>
      </div>
      <div class="filter-chips" style="display:flex;gap:.5rem;flex-wrap:wrap;">
        <button *ngFor="let f of statusFilters" class="chip"
          [class.chip-active]="activeStatus === f.value"
          (click)="applyFilter(f.value)">{{ f.label }}</button>
      </div>
    </div>

    <div *ngIf="loading" class="loading-state"><span class="spinner"></span> Cargando…</div>

    <div *ngIf="!loading && applications.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No hay solicitudes con este estado.</p>
    </div>

    <div class="card" *ngIf="!loading && applications.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>Solicitante</th>
            <th>Identificación</th>
            <th>Correo</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let app of applications">
            <td><strong>{{ app.nombres }} {{ app.apellidos }}</strong></td>
            <td><code>{{ app.identificacion }}</code></td>
            <td>{{ app.correo }}</td>
            <td>{{ app.fechaSolicitud | date:'dd/MM/yyyy' }}</td>
            <td>
              <span class="badge" [ngClass]="statusClass(app.status)">{{ app.status }}</span>
            </td>
            <td>
              <a [routerLink]="['/director/applications', app.id]"
                class="btn btn-sm btn-outline">Ver →</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .chip       { border:2px solid #e5e7eb; background:#fff; border-radius:20px;
                  padding:.3rem .9rem; font-size:.82rem; cursor:pointer; }
    .chip-active{ background:#F4623A; border-color:#F4623A; color:#fff; font-weight:700; }
    .data-table th { text-align:left; }
  `]
})
export class ApplicationsListComponent implements OnInit {
  applications: ApplicationSummaryResponse[] = [];
  loading = true;
  activeStatus = '';

  statusFilters = [
    { label: 'Todas',       value: '' },
    { label: 'Pendiente',   value: 'PENDIENTE' },
    { label: 'En revisión', value: 'EN_REVISION' },
    { label: 'Aprobadas',   value: 'APROBADA' },
    { label: 'Rechazadas',  value: 'RECHAZADA' },
    { label: 'Devueltas',   value: 'DEVUELTA' },
  ];

  constructor(private sellerSvc: SellerService) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    const filters = this.activeStatus ? { status: this.activeStatus } : undefined;
    this.sellerSvc.getApplications(filters).subscribe({
      next: (apps) => { this.applications = apps; this.loading = false; },
      error: ()     => { this.loading = false; }
    });
  }

  applyFilter(status: string): void {
    this.activeStatus = status;
    this.loadApplications();
  }

  statusClass(status: ApplicationStatus): string {
    const map: Record<ApplicationStatus, string> = {
      PENDIENTE:   'badge-warning',
      EN_REVISION: 'badge-info',
      APROBADA:    'badge-success',
      RECHAZADA:   'badge-danger',
      DEVUELTA:    'badge-secondary',
    };
    return map[status] ?? 'badge-secondary';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ApplicationDetailComponent — Detalle y decisión de solicitud (Director)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Muestra el detalle completo de una solicitud y permite al Director
 * tomar una decisión: APROBADA, RECHAZADA o DEVUELTA.
 *
 * Endpoint: GET /sellers/applications/{id}
 *           POST /sellers/applications/{id}/decision
 * Ruta:     /director/applications/:id
 * Rol:      DIRECTOR | ADMIN
 */
@Component({
  selector: 'app-application-detail',
  template: `
    <div class="page-header">
      <a routerLink="/director/applications" class="btn btn-outline btn-sm">← Volver</a>
      <div>
        <h1 class="page-title">Detalle de solicitud</h1>
        <p class="page-subtitle" *ngIf="app">{{ app.nombres }} {{ app.apellidos }}</p>
      </div>
    </div>

    <div *ngIf="loading" class="loading-state"><span class="spinner"></span> Cargando…</div>

    <ng-container *ngIf="!loading && app">
      <div class="detail-grid">
        <!-- Información del solicitante -->
        <div class="card">
          <h3 class="card-title">Información personal</h3>
          <div class="detail-row"><span class="detail-label">Nombres</span><span>{{ app!.nombres }} {{ app!.apellidos }}</span></div>
          <div class="detail-row"><span class="detail-label">Identificación</span><span>{{ app!.tipoPersona }} — {{ app!.identificacion }}</span></div>
          <div class="detail-row"><span class="detail-label">Correo</span><span>{{ app!.correo }}</span></div>
          <div class="detail-row"><span class="detail-label">Teléfono</span><span>{{ app!.telefono }}</span></div>
          <div class="detail-row"><span class="detail-label">Ubicación</span><span>{{ app!.ciudad }}, {{ app!.pais }}</span></div>
          <div class="detail-row"><span class="detail-label">Estado</span>
            <span class="badge" [ngClass]="statusClass(app!.status)">{{ app!.status }}</span>
          </div>
          <div class="detail-row" *ngIf="app!.motivoRechazo">
            <span class="detail-label">Motivo</span><span>{{ app!.motivoRechazo }}</span>
          </div>
          <div class="detail-row"><span class="detail-label">Solicitud</span><span>{{ app!.fechaSolicitud | date:'dd/MM/yyyy' }}</span></div>
          <div class="detail-row" *ngIf="app!.fechaDecision">
            <span class="detail-label">Decisión</span><span>{{ app!.fechaDecision | date:'dd/MM/yyyy' }}</span>
          </div>
        </div>

        <!-- Documentos -->
        <div class="card">
          <h3 class="card-title">Documentos adjuntos</h3>
          <div *ngIf="app!.documentos.length === 0" class="empty-state">
            <p>Sin documentos adjuntos.</p>
          </div>
          <ul class="doc-list">
            <li *ngFor="let doc of app!.documentos" class="doc-item">📎 {{ doc }}</li>
          </ul>
        </div>
      </div>

      <!-- Panel de decisión -->
      <div class="card decision-panel" *ngIf="app!.status === 'PENDIENTE' || app!.status === 'EN_REVISION'">
        <h3 class="card-title">Tomar decisión</h3>
        <div *ngIf="errorMsg" class="alert alert-danger">❌ {{ errorMsg }}</div>
        <div *ngIf="successMsg" class="alert alert-success">✅ {{ successMsg }}</div>

        <div class="form-group">
          <label class="form-label">Motivo (requerido para RECHAZAR o DEVOLVER)</label>
          <textarea class="form-control" [(ngModel)]="motivo" rows="3"
            placeholder="Explica el motivo si vas a rechazar o devolver…"></textarea>
        </div>

        <div class="decision-actions">
          <button class="btn btn-success" (click)="decide('APROBADA')" [disabled]="deciding">
            ✅ Aprobar
          </button>
          <button class="btn btn-warning" (click)="decide('DEVUELTA')" [disabled]="deciding || !motivo">
            ↩ Devolver
          </button>
          <button class="btn btn-danger" (click)="decide('RECHAZADA')" [disabled]="deciding || !motivo">
            ✖ Rechazar
          </button>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .detail-grid    { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:1.5rem; }
    .detail-row     { display:flex; gap:1rem; padding:.6rem 0; border-bottom:1px solid #f3f4f6;
                      font-size:.9rem; }
    .detail-label   { width:120px; font-weight:600; color:#6b7280; flex-shrink:0; }
    .doc-list       { list-style:none; padding:0; }
    .doc-item       { padding:.5rem 0; border-bottom:1px solid #f3f4f6; font-size:.9rem; }
    .decision-panel { margin-top:1.5rem; }
    .decision-actions { display:flex; gap:.75rem; margin-top:1rem; flex-wrap:wrap; }
    .btn-success    { background:#059669; color:#fff; border-color:#059669; }
    .btn-warning    { background:#D97706; color:#fff; border-color:#D97706; }
    .btn-danger     { background:#EF4444; color:#fff; border-color:#EF4444; }
    .alert          { padding:.75rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:.88rem; }
    .alert-danger   { background:#FEF2F2; color:#991B1B; border:1px solid #FECACA; }
    .alert-success  { background:#ECFDF5; color:#065F46; border:1px solid #6EE7B7; }
    @media (max-width:768px) { .detail-grid { grid-template-columns:1fr; } }
  `]
})
export class ApplicationDetailComponent implements OnInit {
  app?: ApplicationDetailResponse;
  loading = true;
  deciding = false;
  motivo = '';
  errorMsg = '';
  successMsg = '';

  constructor(
    private sellerSvc: SellerService,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.sellerSvc.getApplicationById(id).subscribe({
      next: (a) => { this.app = a; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  decide(decision: DecisionType): void {
    if (!this.app) return;
    if ((decision !== 'APROBADA') && !this.motivo) return;
    this.deciding = true;
    this.errorMsg = '';
    this.sellerSvc.decide(this.app.id, {
      decision,
      motivo:    this.motivo || undefined,
      directorId: this.auth.getUserId(),
    }).subscribe({
      next: (updated) => {
        this.app       = updated;
        this.successMsg = `Solicitud ${decision.toLowerCase()} correctamente.`;
        this.deciding  = false;
      },
      error: () => {
        this.errorMsg  = 'No se pudo registrar la decisión. Intenta de nuevo.';
        this.deciding  = false;
      }
    });
  }

  statusClass(status: ApplicationStatus): string {
    const map: Record<ApplicationStatus, string> = {
      PENDIENTE:   'badge-warning',
      EN_REVISION: 'badge-info',
      APROBADA:    'badge-success',
      RECHAZADA:   'badge-danger',
      DEVUELTA:    'badge-secondary',
    };
    return map[status] ?? 'badge-secondary';
  }
}
