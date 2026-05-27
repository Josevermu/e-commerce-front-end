import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService, ProductService } from '../../../core/services/services';
import { AuthService } from '../../../core/services/auth.service';
import { Order, Product } from '../../../core/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-seller-dashboard',
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mi Tienda</h1>
        <p class="page-subtitle">Resumen de tu actividad como vendedor</p>
      </div>
      <a routerLink="/seller/products" class="btn btn-primary">➕ Publicar producto</a>
    </div>

    <div *ngIf="loading" class="loading-state"><span class="spinner"></span> Cargando…</div>

    <ng-container *ngIf="!loading">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(244,98,58,.12);color:#F4623A;">🛍️</div>
          <div class="stat-body"><div class="stat-value">{{ products.length }}</div><div class="stat-label">Productos publicados</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,.12);color:#059669;">📦</div>
          <div class="stat-body"><div class="stat-value">{{ orders.length }}</div><div class="stat-label">Pedidos recibidos</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(251,191,36,.12);color:#D97706;">⏳</div>
          <div class="stat-body"><div class="stat-value">{{ pendingOrders }}</div><div class="stat-label">Pendientes</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(139,92,246,.12);color:#7C3AED;">💰</div>
          <div class="stat-body"><div class="stat-value">{{ totalRevenue | currency:'COP':'$':'1.0-0' }}</div><div class="stat-label">Ventas totales</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Últimas ventas</h2>
          <a routerLink="/seller/orders" style="font-size:.85rem;color:#F4623A;text-decoration:none;font-weight:600;">Ver todas →</a>
        </div>
        <div *ngIf="recentOrders.length === 0" class="empty-state"><p>Aún no tienes pedidos.</p></div>
        <table class="data-table" *ngIf="recentOrders.length > 0">
          <thead><tr><th>Pedido</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
          <tbody>
            <tr *ngFor="let order of recentOrders">
              <td><code>{{ order.id | slice:0:8 }}</code></td>
              <td>{{ order.creadoEn | date:'dd/MM/yy' }}</td>
              <td>{{ order.total | currency:'COP':'$':'1.0-0' }}</td>
              <td><span class="badge" [ngClass]="statusClass(order.status)">{{ order.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card" style="margin-top:1.5rem;">
        <div class="card-header">
          <h2 class="card-title">Mis productos</h2>
          <a routerLink="/seller/products" style="font-size:.85rem;color:#F4623A;text-decoration:none;font-weight:600;">Gestionar →</a>
        </div>
        <div *ngIf="products.length === 0" class="empty-state">
          <p>No tienes productos publicados.</p>
          <a routerLink="/seller/products" class="btn btn-primary">Publicar ahora</a>
        </div>
        <div class="product-grid" *ngIf="products.length > 0">
          <div class="product-mini" *ngFor="let p of products.slice(0, 6)">
            <div class="product-mini-name">{{ p.nombre }}</div>
            <div class="product-mini-price">{{ p.precio | currency:'COP':'$':'1.0-0' }}</div>
            <div class="product-mini-cat">{{ p.categoria }}</div>
            <span class="badge" [ngClass]="p.activo ? 'badge-success' : 'badge-secondary'">
              {{ p.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .stats-grid   { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin-bottom:1.5rem; }
    .stat-card    { background:#fff; border-radius:12px; padding:1.25rem; display:flex; align-items:center; gap:1rem; box-shadow:0 1px 4px rgba(0,0,0,.06); }
    .stat-icon    { font-size:1.6rem; border-radius:10px; padding:.6rem .7rem; }
    .stat-value   { font-size:1.6rem; font-weight:800; color:#0D1B2A; }
    .stat-label   { font-size:.78rem; color:#6b7280; }
    .product-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:1rem; }
    .product-mini { background:#f9fafb; border-radius:10px; padding:1rem; }
    .product-mini-name { font-weight:600; font-size:.9rem; margin-bottom:.25rem; color:#0D1B2A; }
    .product-mini-price{ font-size:1rem; font-weight:800; color:#F4623A; }
    .product-mini-cat  { font-size:.75rem; color:#9ca3af; margin:.25rem 0 .5rem; }
  `]
})
export class SellerDashboardComponent implements OnInit {
  loading = true;
  orders: Order[] = [];
  products: Product[] = [];

  get recentOrders()  { return this.orders.slice(0, 5); }
  get pendingOrders() { return this.orders.filter((o: Order) => o.status === 'PENDIENTE_PAGO').length; }
  get totalRevenue()  { return this.orders.filter((o: Order) => o.status === 'ENTREGADO').reduce((s, o) => s + (o.total || 0), 0); }

  constructor(private orderSvc: OrderService, private productSvc: ProductService, private auth: AuthService) {}

  ngOnInit(): void {
    const sellerId = this.auth.currentState.relatedEntityId ?? '';
    forkJoin({ orders: this.orderSvc.getOrdersBySeller(sellerId), products: this.productSvc.getProductsBySeller(sellerId) }).subscribe({
      next: ({ orders, products }) => { this.orders = orders; this.products = products; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  statusClass(s: string): string {
    return ({ PENDIENTE_PAGO:'badge-warning', PAGADO:'badge-info', EN_PROCESO:'badge-info', ENVIADO:'badge-info', ENTREGADO:'badge-success', CANCELADO:'badge-danger' } as Record<string,string>)[s] ?? 'badge-secondary';
  }
}