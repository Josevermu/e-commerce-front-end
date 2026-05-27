import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { BuyerService, BamService } from '../../../core/services/services';
import { BuyerProfileResponse, AuditEntry } from '../../../core/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="page-header">
      <div><h1 class="page-title">Panel Administrador</h1><p class="page-subtitle">Control total del sistema KONRAD</p></div>
    </div>
    <div *ngIf="loading" class="loading-state"><span class="spinner"></span> Cargando…</div>
    <ng-container *ngIf="!loading">
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon" style="background:rgba(244,98,58,.12);color:#F4623A;">👥</div><div class="stat-body"><div class="stat-value">{{ buyers.length }}</div><div class="stat-label">Compradores</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:rgba(13,27,42,.08);color:#0D1B2A;">🔐</div><div class="stat-body"><div class="stat-value">{{ authUsers.length }}</div><div class="stat-label">Usuarios sistema</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:rgba(16,185,129,.12);color:#059669;">📋</div><div class="stat-body"><div class="stat-value">{{ auditLog.length }}</div><div class="stat-label">Entradas auditoría</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:rgba(139,92,246,.12);color:#7C3AED;">🌐</div><div class="stat-body"><div class="stat-value">{{ kpiSummary }}</div><div class="stat-label">Vendedores activos</div></div></div>
      </div>
      <div class="quick-links">
        <a routerLink="/admin/users"   class="quick-card"><span class="quick-icon">🔐</span><span class="quick-label">Gestionar usuarios</span></a>
        <a routerLink="/admin/buyers"  class="quick-card"><span class="quick-icon">👥</span><span class="quick-label">Ver compradores</span></a>
        <a routerLink="/admin/audit"   class="quick-card"><span class="quick-icon">📋</span><span class="quick-label">Log de auditoría</span></a>
        <a routerLink="/director/dashboard" class="quick-card"><span class="quick-icon">📊</span><span class="quick-label">Dashboard BAM</span></a>
      </div>
      <div class="card">
        <div class="card-header"><h2 class="card-title">Actividad reciente</h2><a routerLink="/admin/audit" style="font-size:.85rem;color:#F4623A;text-decoration:none;font-weight:600;">Ver todo →</a></div>
        <table class="data-table" *ngIf="auditLog.length > 0">
          <thead><tr><th>Fecha</th><th>Hora</th><th>Usuario</th><th>Entidad</th><th>Acción</th></tr></thead>
          <tbody>
            <tr *ngFor="let entry of auditLog.slice(0,8)">
              <td>{{ entry.fecha }}</td>
              <td>{{ entry.hora }}</td>
              <td><code>{{ entry.usuario }}</code></td>
              <td><span class="badge badge-secondary">{{ entry.entidad }}</span></td>
              <td>{{ entry.accion }}</td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="auditLog.length === 0" class="empty-state"><p>No hay entradas de auditoría.</p></div>
      </div>
    </ng-container>
  `,
  styles: [`
    .stats-grid  { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin-bottom:1.5rem; }
    .stat-card   { background:#fff; border-radius:12px; padding:1.25rem; display:flex; align-items:center; gap:1rem; box-shadow:0 1px 4px rgba(0,0,0,.06); }
    .stat-icon   { font-size:1.6rem; border-radius:10px; padding:.6rem .7rem; }
    .stat-value  { font-size:1.6rem; font-weight:800; color:#0D1B2A; }
    .stat-label  { font-size:.78rem; color:#6b7280; }
    .quick-links { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:1rem; margin-bottom:1.5rem; }
    .quick-card  { background:#fff; border-radius:12px; padding:1.5rem 1rem; text-align:center; text-decoration:none; box-shadow:0 1px 4px rgba(0,0,0,.06); border:2px solid transparent; transition:.2s; }
    .quick-card:hover { border-color:#F4623A; }
    .quick-icon  { display:block; font-size:2rem; margin-bottom:.5rem; }
    .quick-label { font-size:.85rem; font-weight:600; color:#0D1B2A; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  buyers: BuyerProfileResponse[] = [];
  authUsers: any[] = [];
  auditLog: AuditEntry[] = [];
  kpiSummary = 0;

  constructor(private buyerSvc: BuyerService, private bamSvc: BamService, private authSvc: AuthService) {}

  ngOnInit(): void {
    forkJoin({ buyers: this.buyerSvc.getAll(), audit: this.bamSvc.getAudit(), users: this.authSvc.getUsers(), dashboard: this.bamSvc.getDashboard() }).subscribe({
      next: ({ buyers, audit, users, dashboard }) => {
        this.buyers = buyers; this.auditLog = audit; this.authUsers = users;
        this.kpiSummary = dashboard?.resumenGeneral?.totalVendedoresActivos ?? 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}

@Component({
  selector: 'app-admin-users',
  template: `
    <div class="page-header"><div><h1 class="page-title">Usuarios del Sistema</h1></div></div>
    <div class="card">
      <input class="form-control" [(ngModel)]="query" placeholder="🔍 Buscar por email o rol…" style="max-width:400px; margin-bottom:1rem;" />
      <div *ngIf="loading" class="loading-state"><span class="spinner"></span></div>
      <table class="data-table" *ngIf="!loading">
        <thead><tr><th>Email</th><th>Rol</th><th>ID Entidad</th></tr></thead>
        <tbody>
          <tr *ngFor="let u of filtered">
            <td>{{ u.email }}</td>
            <td><span class="badge" [ngClass]="roleBadge(u.role)">{{ u.role }}</span></td>
            <td><code>{{ (u.relatedEntityId || '') | slice:0:10 }}</code></td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loading && filtered.length === 0" class="empty-state"><p>No se encontraron usuarios.</p></div>
    </div>
  `,
  styles: []
})
export class AdminUsersComponent implements OnInit {
  loading = true; users: any[] = []; query = '';
  get filtered() { const q = this.query.toLowerCase(); return this.users.filter((u: any) => u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)); }
  constructor(private authSvc: AuthService) {}
  ngOnInit(): void { this.authSvc.getUsers().subscribe({ next: (u) => { this.users = u; this.loading = false; }, error: () => { this.loading = false; } }); }
  roleBadge(role: string): string { return ({ ADMIN:'badge-danger', DIRECTOR:'badge-info', SELLER:'badge-warning', BUYER:'badge-success' } as Record<string,string>)[role] ?? 'badge-secondary'; }
}

@Component({
  selector: 'app-admin-buyers',
  template: `
    <div class="page-header"><div><h1 class="page-title">Compradores</h1></div></div>
    <div class="card">
      <input class="form-control" [(ngModel)]="query" placeholder="🔍 Buscar…" style="max-width:400px; margin-bottom:1rem;" />
      <div *ngIf="loading" class="loading-state"><span class="spinner"></span></div>
      <table class="data-table" *ngIf="!loading && filtered.length > 0">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Ciudad</th></tr></thead>
        <tbody>
          <tr *ngFor="let b of filtered">
            <td>{{ b.nombres }} {{ b.apellidos }}</td>
            <td>{{ b.correo }}</td>
            <td>{{ b.ciudad || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loading && filtered.length === 0" class="empty-state"><p>No se encontraron compradores.</p></div>
    </div>
  `,
  styles: []
})
export class AdminBuyersComponent implements OnInit {
  loading = true; buyers: BuyerProfileResponse[] = []; query = '';
  get filtered() { const q = this.query.toLowerCase(); return this.buyers.filter((b: BuyerProfileResponse) => b.nombres?.toLowerCase().includes(q) || b.correo?.toLowerCase().includes(q)); }
  constructor(private buyerSvc: BuyerService) {}
  ngOnInit(): void { this.buyerSvc.getAll().subscribe({ next: (b) => { this.buyers = b; this.loading = false; }, error: () => { this.loading = false; } }); }
}

@Component({
  selector: 'app-admin-audit',
  template: `
    <div class="page-header"><div><h1 class="page-title">Log de Auditoría</h1></div></div>
    <div class="card" style="margin-bottom:1.5rem; padding:1.25rem;">
      <div style="display:flex; gap:1rem; flex-wrap:wrap;">
        <div class="form-group" style="flex:1;">
          <label class="form-label">Por usuario</label>
          <div style="display:flex; gap:.5rem;">
            <input class="form-control" [(ngModel)]="filterUser" placeholder="email…" />
            <button class="btn btn-outline btn-sm" (click)="searchByUser()">Buscar</button>
          </div>
        </div>
        <div class="form-group" style="flex:1;">
          <label class="form-label">Por entidad</label>
          <div style="display:flex; gap:.5rem;">
            <input class="form-control" [(ngModel)]="filterEntity" placeholder="ORDER, SELLER…" />
            <button class="btn btn-outline btn-sm" (click)="searchByEntity()">Buscar</button>
          </div>
        </div>
        <div style="align-self:flex-end;"><button class="btn btn-outline" (click)="loadAll()">Limpiar</button></div>
      </div>
    </div>
    <div class="card">
      <div *ngIf="loading" class="loading-state"><span class="spinner"></span></div>
      <table class="data-table" *ngIf="!loading && entries.length > 0">
        <thead><tr><th>Fecha</th><th>Hora</th><th>Usuario</th><th>Entidad</th><th>Acción</th></tr></thead>
        <tbody>
          <tr *ngFor="let e of entries">
            <td>{{ e.fecha }}</td><td>{{ e.hora }}</td>
            <td><code>{{ e.usuario }}</code></td>
            <td><span class="badge badge-secondary">{{ e.entidad }}</span></td>
            <td>{{ e.accion }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="!loading && entries.length === 0" class="empty-state"><p>No se encontraron entradas.</p></div>
    </div>
  `,
  styles: []
})
export class AdminAuditComponent implements OnInit {
  loading = true; entries: AuditEntry[] = []; filterUser = ''; filterEntity = '';
  constructor(private bamSvc: BamService) {}
  ngOnInit(): void { this.loadAll(); }
  loadAll(): void { this.loading = true; this.filterUser = ''; this.filterEntity = ''; this.bamSvc.getAudit().subscribe({ next: (e) => { this.entries = e; this.loading = false; }, error: () => { this.loading = false; } }); }
  searchByUser(): void { if (!this.filterUser) return; this.loading = true; this.bamSvc.getAuditByUser(this.filterUser).subscribe({ next: (e) => { this.entries = e; this.loading = false; }, error: () => { this.loading = false; } }); }
  searchByEntity(): void { if (!this.filterEntity) return; this.loading = true; this.bamSvc.getAuditByEntity(this.filterEntity).subscribe({ next: (e) => { this.entries = e; this.loading = false; }, error: () => { this.loading = false; } }); }
}