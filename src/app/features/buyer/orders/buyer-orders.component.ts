import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderService } from '../../../core/services/services';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-buyer-orders',
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mis Pedidos</h1>
        <p class="page-subtitle">Historial completo de tus compras</p>
      </div>
    </div>

    <div class="filter-bar card" style="margin-bottom:1.5rem; padding:1rem 1.25rem;">
      <span class="filter-label">Filtrar por estado:</span>
      <div class="filter-chips">
        <button *ngFor="let f of filters" class="chip"
          [class.chip-active]="activeFilter === f.value"
          (click)="setFilter(f.value)">{{ f.label }}</button>
      </div>
    </div>

    <div *ngIf="loading" class="loading-state"><span class="spinner"></span> Cargando…</div>

    <div *ngIf="!loading && filtered.length === 0" class="empty-state">
      <div class="empty-icon">📋</div><p>No tienes pedidos con este estado.</p>
    </div>

    <div class="order-list" *ngIf="!loading && filtered.length > 0">
      <div class="order-card" *ngFor="let order of filtered">
        <div class="order-header">
          <div>
            <span class="order-id">Pedido #{{ order.id | slice:0:8 }}</span>
            <span class="order-date">{{ order.creadoEn | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <span class="badge" [ngClass]="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
        </div>

        <div class="order-items" *ngIf="order.items?.length">
          <div class="order-item" *ngFor="let item of order.items">
            <span class="item-name">{{ item.nombre }}</span>
            <span class="item-qty">x{{ item.cantidad }}</span>
            <span class="item-price">{{ item.precioUnitario | currency:'COP':'$':'1.0-0' }}</span>
          </div>
        </div>

        <div class="order-footer">
          <div *ngIf="order.entregaDomicilio">📍 {{ order.ciudadEntrega }}</div>
          <div>Total: <strong>{{ order.total | currency:'COP':'$':'1.0-0' }}</strong></div>
          <div>
            <button *ngIf="order.status === 'ENTREGADO' && !order.calificacion"
              class="btn btn-sm btn-outline" (click)="openRating(order)">⭐ Calificar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal calificación -->
    <div class="modal-overlay" *ngIf="ratingOrder" (click)="closeRating()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <h3 class="modal-title">Calificar pedido</h3>
        <form [formGroup]="ratingForm" (ngSubmit)="submitRating()">
          <div class="form-group">
            <label class="form-label">Calificación (1–5)</label>
            <div class="star-picker">
              <button type="button" *ngFor="let s of [1,2,3,4,5]"
                class="star-btn" [class.star-active]="ratingForm.value.rating >= s"
                (click)="ratingForm.patchValue({ rating: s })">★</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Comentario (opcional)</label>
            <textarea class="form-control" rows="3" formControlName="comentario"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="closeRating()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="ratingForm.invalid || sending">
              {{ sending ? 'Enviando…' : 'Enviar calificación' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar   { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
    .filter-label { font-size:.85rem; font-weight:600; color:#6b7280; }
    .filter-chips { display:flex; gap:.5rem; flex-wrap:wrap; }
    .chip         { border:2px solid #e5e7eb; background:#fff; border-radius:20px; padding:.3rem .9rem; font-size:.82rem; cursor:pointer; }
    .chip-active  { background:#F4623A; border-color:#F4623A; color:#fff; font-weight:700; }
    .order-list   { display:flex; flex-direction:column; gap:1rem; }
    .order-card   { background:#fff; border-radius:12px; box-shadow:0 1px 4px rgba(0,0,0,.07); }
    .order-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-bottom:1px solid #f3f4f6; }
    .order-id     { font-weight:700; font-family:monospace; display:block; }
    .order-date   { font-size:.78rem; color:#9ca3af; }
    .order-items  { padding:.75rem 1.25rem; border-bottom:1px solid #f3f4f6; }
    .order-item   { display:flex; gap:.5rem; padding:.25rem 0; font-size:.88rem; }
    .item-name    { flex:1; } .item-qty { color:#9ca3af; } .item-price { font-weight:600; }
    .order-footer { display:flex; align-items:center; justify-content:space-between; padding:.85rem 1.25rem; flex-wrap:wrap; gap:.5rem; font-size:.9rem; }
    .star-picker  { display:flex; gap:.25rem; }
    .star-btn     { font-size:2rem; background:none; border:none; cursor:pointer; color:#d1d5db; }
    .star-active  { color:#FBBF24; }
  `]
})
export class BuyerOrdersComponent implements OnInit {
  loading = true;
  orders: Order[] = [];
  activeFilter = 'ALL';
  ratingOrder: Order | null = null;
  ratingForm!: FormGroup;
  sending = false;

  filters = [
    { label: 'Todos', value: 'ALL' }, { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Confirmado', value: 'CONFIRMADO' }, { label: 'Enviado', value: 'ENVIADO' },
    { label: 'Entregado', value: 'ENTREGADO' }, { label: 'Cancelado', value: 'CANCELADO' },
  ];

  get filtered(): Order[] {
    return this.activeFilter === 'ALL' ? this.orders : this.orders.filter((o: Order) => o.status === this.activeFilter);
  }

  constructor(private orderSvc: OrderService, private auth: AuthService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.ratingForm = this.fb.group({ rating: [null, [Validators.required, Validators.min(1)]], comentario: [''] });
    const buyerId = this.auth.currentState.relatedEntityId ?? '';
    this.orderSvc.getOrdersByBuyer(buyerId).subscribe({
      next: (o) => { this.orders = o; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  setFilter(v: string): void { this.activeFilter = v; }
  openRating(order: Order): void { this.ratingOrder = order; this.ratingForm.reset({ rating: null, comentario: '' }); }
  closeRating(): void { this.ratingOrder = null; }

  submitRating(): void {
    if (!this.ratingOrder || this.ratingForm.invalid) return;
    this.sending = true;
    const { rating, comentario } = this.ratingForm.value;
    this.orderSvc.rateOrder(this.ratingOrder.id, { calificacion: rating, comentario }).subscribe({
      next: () => { this.closeRating(); this.sending = false; },
      error: () => { this.sending = false; }
    });
  }

  statusClass(s: string): string {
    return ({ PENDIENTE:'badge-warning', CONFIRMADO:'badge-info', ENVIADO:'badge-info', ENTREGADO:'badge-success', CANCELADO:'badge-danger' } as Record<string,string>)[s] ?? 'badge-secondary';
  }
  statusLabel(s: string): string {
    return ({ PENDIENTE:'⏳ Pendiente', CONFIRMADO:'✔ Confirmado', ENVIADO:'🚚 Enviado', ENTREGADO:'✅ Entregado', CANCELADO:'✖ Cancelado' } as Record<string,string>)[s] ?? s;
  }
}