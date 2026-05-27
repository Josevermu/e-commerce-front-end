import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthState } from '../../../core/models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <button class="collapse-btn" (click)="collapsed = !collapsed">
        {{ collapsed ? '→' : '←' }}
      </button>

      <nav class="sidebar-nav">
        <a
          *ngFor="let item of navItems"
          [routerLink]="item.route"
          routerLinkActive="active"
          class="nav-item"
          [title]="item.label">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label" *ngIf="!collapsed">{{ item.label }}</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 220px;
      min-height: calc(100vh - 60px);
      background: var(--primary, #0D1B2A);
      padding: 1rem 0;
      transition: width .25s;
      position: relative;
      flex-shrink: 0;
    }
    .sidebar.collapsed { width: 56px; }

    .collapse-btn {
      position: absolute;
      top: .75rem;
      right: -12px;
      width: 24px; height: 24px;
      background: var(--accent, #F4623A);
      border: none;
      border-radius: 50%;
      color: #fff;
      font-size: .7rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      z-index: 10;
    }

    .sidebar-nav { display: flex; flex-direction: column; padding: .5rem 0; margin-top: 1rem; }

    .nav-item {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .75rem 1rem;
      color: rgba(255,255,255,.65);
      text-decoration: none;
      font-size: .88rem;
      transition: .2s;
      border-left: 3px solid transparent;
      white-space: nowrap;
      overflow: hidden;
    }
    .nav-item:hover { color: #fff; background: rgba(255,255,255,.07); }
    .nav-item.active {
      color: #fff;
      border-left-color: var(--accent, #F4623A);
      background: rgba(244,98,58,.12);
      font-weight: 600;
    }
    .nav-icon { font-size: 1.1rem; flex-shrink: 0; }
    .nav-label { overflow: hidden; text-overflow: ellipsis; }
  `]
})
export class SidebarComponent implements OnInit {
  @Input() authState: Partial<AuthState> = {};
  collapsed = false;
  navItems: NavItem[] = [];

  private navByRole: Record<string, NavItem[]> = {
    BUYER: [
      { label: 'Dashboard',  icon: '🏠', route: '/buyer/dashboard' },
      { label: 'Catálogo',   icon: '🛍️', route: '/products' },
      { label: 'Mi carrito', icon: '🛒', route: '/buyer/cart' },
      { label: 'Mis pedidos',icon: '📦', route: '/buyer/orders' },
      { label: 'Mi perfil',  icon: '👤', route: '/buyer/profile' },
    ],
    SELLER: [
      { label: 'Dashboard',  icon: '🏠', route: '/seller/dashboard' },
      { label: 'Productos',  icon: '📦', route: '/seller/products' },
      { label: 'Ventas',     icon: '💰', route: '/seller/orders' },
    ],
    DIRECTOR: [
      { label: 'Dashboard',    icon: '📊', route: '/director/dashboard' },
      { label: 'Solicitudes',  icon: '📋', route: '/director/applications' },
    ],
    ADMIN: [
      { label: 'Dashboard',    icon: '⚙',  route: '/admin/dashboard' },
      { label: 'Usuarios',     icon: '🔐', route: '/admin/users' },
      { label: 'Compradores',  icon: '👥', route: '/admin/buyers' },
      { label: 'Auditoría',    icon: '📋', route: '/admin/audit' },
      { label: 'BAM',          icon: '📊', route: '/director/dashboard' },
    ],
  };

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const role = this.authState?.role ?? '';
    this.navItems = this.navByRole[role] ?? [];
  }
}