import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AuthState } from '../../../core/models';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <span class="brand-logo">K</span>
        <span class="brand-name">KONRAD</span>
      </div>
      <div class="navbar-center" *ngIf="authState?.role">
        <span class="role-badge">{{ roleLabel }}</span>
      </div>
      <div class="navbar-end">
        <ng-container *ngIf="authState?.role; else publicNav">
          <span class="user-email">{{ authState?.email }}</span>
          <button class="btn-outline btn-sm" (click)="logout()">Cerrar sesión</button>
        </ng-container>
        <ng-template #publicNav>
          <a routerLink="/auth/login" class="btn-primary btn-sm">Iniciar sesión</a>
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { display:flex; align-items:center; justify-content:space-between;
      padding:0 1.5rem; height:60px; background:#0D1B2A; color:#fff;
      position:sticky; top:0; z-index:100; box-shadow:0 2px 8px rgba(0,0,0,.2); }
    .navbar-brand { display:flex; align-items:center; gap:.6rem; }
    .brand-logo { width:32px; height:32px; background:#F4623A; border-radius:8px;
      display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1rem; }
    .brand-name { font-weight:800; font-size:1.1rem; }
    .role-badge { background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2);
      border-radius:20px; padding:.25rem .9rem; font-size:.78rem; font-weight:600; }
    .navbar-end { display:flex; align-items:center; gap:1rem; }
    .user-email { font-size:.82rem; color:rgba(255,255,255,.7); }
    .btn-sm { padding:.35rem .85rem; font-size:.82rem; border-radius:8px; cursor:pointer; }
    .btn-outline { border:1.5px solid rgba(255,255,255,.4); color:#fff; background:transparent; }
    .btn-outline:hover { background:rgba(255,255,255,.1); }
    .btn-primary { background:#F4623A; color:#fff; border:none; text-decoration:none;
      display:inline-flex; align-items:center; }
  `]
})
export class NavbarComponent implements OnInit {
  @Input() authState: Partial<AuthState> = {};

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {}

  get roleLabel(): string {
    const labels: Record<string, string> = {
      ADMIN: '⚙ Administrador', DIRECTOR: '📊 Director',
      SELLER: '🏪 Vendedor', BUYER: '🛒 Comprador',
    };
    return labels[this.authState?.role ?? ''] ?? '';
  }

  logout(): void { this.auth.logout(); }
}