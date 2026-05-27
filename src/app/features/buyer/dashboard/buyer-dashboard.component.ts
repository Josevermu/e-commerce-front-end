import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/services';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-buyer-dashboard',
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mi Panel</h1>
        <p class="page-subtitle">Bienvenido de vuelta, {{ buyerName }}</p>
      </div>
      <div style="display:flex; gap:.75rem;">
        <a routerLink="/products" class="btn btn-outline">🛍️ Ver catálogo</a>
        <a routerLink="/buyer/cart" class="btn btn-primary">🛒 Mi carrito</a>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(244,98,58,.12);color:#F4623A;">📦</div>
        <div class="stat-body">
          <div class="stat-value">{{ totalOrders }}</div>
          <div class="stat-label">Pedidos totales</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(251,191,36,.12);color:#D97706;">⏳</div>
        <div class="stat-body">
          <div class="stat-value">{{ pendingOrders }}</div>
          <div class="stat-label">En proceso</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.12);color:#059669;">✅</div>
        <div class="stat-body">
          <div class="stat-value">{{ deliveredOrders }}</div>
          <div class="stat-label">Entregados</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,.12);color:#7C3AED;">💰</div>
        <div class="stat-body">
          <div class="stat-value">{{ totalSpent | currency:'COP':'$':'1.0-0' }}</div>
          <div class="stat-label">Total gastado</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Últimos pedidos</h2>
        <a routerLink="/buyer/orders" style="font-size:.85rem; color:#F4623A; text-decoration:none; font-weight:600;">Ver todos →</a>
      </div>

      <div *ngIf="loading" class="loading-state"><span class="spinner"></span> Cargando…</div>

      <div *ngIf="!loading && recentOrders.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>Aún no tienes pedidos.</p>
        <a routerLink="/products" class="btn btn-primary">Ir al catálogo</a>
      </div>

      <table class="data-table" *ngIf="!loading && recentOrders.length > 0">
        <thead>
          <tr><th>ID Pedido</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of recentOrders">
            <td><code>{{ order.id | slice:0:8 }}…</code></td>
            <td>{{ order.creadoEn | date:'dd/MM/yyyy' }}</td>
            <td>{{ order.total | currency:'COP':'$':'1.0-0' }}</td>
            <td>
              <span class="badge" [ngClass]="statusClass(order.status)">
                {{ statusLabel(order.status) }}
              </span>
            </td>
            <td>
              <a [routerLink]="['/buyer/orders']" class="btn btn-sm btn-outline">Ver</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin-bottom:1.5rem; }
    .stat-card  { background:#fff; border-radius:12px; padding:1.25rem; display:flex; align-items:center; gap:1rem; box-shadow:0 1px 4px rgba(0,0,0,.06); }
    .stat-icon  { font-size:1.6rem; border-radius:10px; padding:.6rem .7rem; }
    .stat-value { font-size:1.6rem; font-weight:800; color:#0D1B2A; }
    .stat-label { font-size:.78rem; color:#6b7280; }
  `]
})
export class BuyerDashboardComponent implements OnInit {
  loading = true;
  recentOrders: Order[] = [];
  buyerName = '';
  buyerId = '';

  get totalOrders()    { return this.recentOrders.length; }
  get pendingOrders()  { return this.recentOrders.filter(o => o.status !== 'ENTREGADO' && o.status !== 'CANCELADO').length; }
  get deliveredOrders(){ return this.recentOrders.filter(o => o.status === 'ENTREGADO').length; }
  get totalSpent()     { return this.recentOrders.reduce((s, o) => s + (o.total || 0), 0); }

  constructor(private orderSvc: OrderService, private auth: AuthService) {}

  ngOnInit(): void {
    const state = this.auth.currentState;
    this.buyerName = state.email?.split('@')[0] ?? 'Comprador';
    this.buyerId   = state.relatedEntityId ?? '';
    this.orderSvc.getOrdersByBuyer(this.buyerId).subscribe({
      next: (orders) => { this.recentOrders = orders.slice(0, 5); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  statusClass(status: string): string {
    const m: Record<string,string> = { PENDIENTE:'badge-warning', CONFIRMADO:'badge-info', ENVIADO:'badge-info', ENTREGADO:'badge-success', CANCELADO:'badge-danger' };
    return m[status] ?? 'badge-secondary';
  }

  statusLabel(status: string): string {
    const l: Record<string,string> = { PENDIENTE:'⏳ Pendiente', CONFIRMADO:'✔ Confirmado', ENVIADO:'🚚 Enviado', ENTREGADO:'✅ Entregado', CANCELADO:'✖ Cancelado' };
    return l[status] ?? status;
  }
}