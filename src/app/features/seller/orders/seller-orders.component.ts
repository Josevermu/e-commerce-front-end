import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderService, PaymentService } from '../../../core/services/services';
import { SellerService } from '../../../core/services/seller.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order, PaymentRequest } from '../../../core/models';

@Component({
  selector: 'app-seller-orders',
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mis Ventas</h1>
        <p class="page-subtitle">Pedidos recibidos en tu tienda</p>
      </div>
      <button class="btn btn-primary" (click)="showActivation = !showActivation">
        🔑 Activar suscripción
      </button>
    </div>

    <app-seller-activation
      *ngIf="showActivation"
      [sellerId]="sellerId"
      (activated)="showActivation = false">
    </app-seller-activation>

    <div class="filter-bar card" style="margin-bottom:1.5rem; padding:1rem 1.25rem;">
      <span class="filter-label">Estado:</span>
      <div class="filter-chips">
        <button *ngFor="let f of filters" class="chip"
          [class.chip-active]="activeFilter === f.value"
          (click)="activeFilter = f.value">{{ f.label }}</button>
      </div>
    </div>

    <div *ngIf="loading" class="loading-state">
      <span class="spinner"></span> Cargando ventas…
    </div>

    <div *ngIf="!loading && filtered.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p>No tienes pedidos con este estado.</p>
    </div>

    <div class="order-list" *ngIf="!loading && filtered.length > 0">
      <div class="order-card" *ngFor="let order of filtered">
        <div class="order-header">
          <div>
            <span class="order-id">#{{ order.id | slice:0:8 }}</span>
            <span class="order-date">{{ order.creadoEn | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <span class="badge" [ngClass]="statusClass(order.status)">{{ order.status }}</span>
        </div>
        <div class="order-items" *ngIf="order.items?.length">
          <div class="order-item" *ngFor="let item of order.items">
            <span class="item-name">{{ item.nombre }}</span>
            <span class="item-qty">×{{ item.cantidad }}</span>
            <span class="item-price">{{ item.precioUnitario | currency:'COP':'$':'1.0-0' }}</span>
          </div>
        </div>
        <div class="order-footer">
          <div *ngIf="order.entregaDomicilio">📍 {{ order.ciudadEntrega }}</div>
          <strong>Total: {{ order.total | currency:'COP':'$':'1.0-0' }}</strong>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar   { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
    .filter-label { font-size:.85rem; font-weight:600; color:#6b7280; }
    .filter-chips { display:flex; gap:.5rem; flex-wrap:wrap; }
    .chip         { border:2px solid #e5e7eb; background:#fff; border-radius:20px;
                    padding:.3rem .9rem; font-size:.82rem; cursor:pointer; }
    .chip-active  { background:#F4623A; border-color:#F4623A; color:#fff; font-weight:700; }
    .order-list   { display:flex; flex-direction:column; gap:1rem; }
    .order-card   { background:#fff; border-radius:12px; box-shadow:0 1px 4px rgba(0,0,0,.07); }
    .order-header { display:flex; justify-content:space-between; align-items:center;
                    padding:1rem 1.25rem; border-bottom:1px solid #f3f4f6; }
    .order-id     { font-weight:700; font-family:monospace; display:block; }
    .order-date   { font-size:.78rem; color:#9ca3af; }
    .order-items  { padding:.75rem 1.25rem; border-bottom:1px solid #f3f4f6; }
    .order-item   { display:flex; gap:.5rem; padding:.25rem 0; font-size:.88rem; }
    .item-name    { flex:1; color:#374151; }
    .item-qty     { color:#9ca3af; }
    .item-price   { font-weight:600; }
    .order-footer { display:flex; align-items:center; justify-content:space-between;
                    padding:.85rem 1.25rem; font-size:.9rem; }
  `]
})
export class SellerOrdersComponent implements OnInit {
  loading = true;
  orders: Order[] = [];
  activeFilter = 'ALL';
  showActivation = false;
  sellerId = '';

  filters = [
    { label: 'Todos', value: 'ALL' }, { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Confirmado', value: 'CONFIRMADO' }, { label: 'Enviado', value: 'ENVIADO' },
    { label: 'Entregado', value: 'ENTREGADO' }, { label: 'Cancelado', value: 'CANCELADO' },
  ];

  get filtered(): Order[] {
    return this.activeFilter === 'ALL'
      ? this.orders
      : this.orders.filter((o: Order) => o.status === this.activeFilter);
  }

  constructor(private orderSvc: OrderService, private auth: AuthService) {}

  ngOnInit(): void {
    this.sellerId = this.auth.currentState.relatedEntityId ?? '';
    this.orderSvc.getOrdersBySeller(this.sellerId).subscribe({
      next: (o: Order[]) => { this.orders = o; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  statusClass(status: string): string {
    const m: Record<string, string> = {
      PENDIENTE:'badge-warning', CONFIRMADO:'badge-info',
      ENVIADO:'badge-info', ENTREGADO:'badge-success', CANCELADO:'badge-danger',
    };
    return m[status] ?? 'badge-secondary';
  }
}

// ── SellerActivationComponent ─────────────────────────────────

@Component({
  selector: 'app-seller-activation',
  template: `
    <div class="activation-panel card">
      <h3 class="card-title">Activar / Renovar Suscripción</h3>
      <p style="color:#6b7280; margin-bottom:1.25rem; line-height:1.6; font-size:.9rem;">
        Realiza el pago para activar tu cuenta de vendedor.
      </p>
      <div *ngIf="successMsg" class="alert alert-success">✅ {{ successMsg }}</div>
      <div *ngIf="errorMsg"   class="alert alert-danger">❌ {{ errorMsg }}</div>
      <form [formGroup]="form" (ngSubmit)="activate()">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Monto (COP) *</label>
            <input class="form-control" type="number" formControlName="monto" />
          </div>
          <div class="form-group">
            <label class="form-label">Método de pago *</label>
            <select class="form-control" formControlName="metodoPago">
              <option value="PSE">PSE</option>
              <option value="CREDIT_CARD">Tarjeta crédito</option>
              <option value="CONSIGNATION">Consignación</option>
            </select>
          </div>
        </div>
        <div style="display:flex; gap:.75rem; justify-content:flex-end; margin-top:1rem;">
          <button type="button" class="btn btn-outline" (click)="cancel()">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || paying">
            {{ paying ? 'Procesando…' : '💳 Pagar y activar' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .activation-panel { padding:1.5rem; margin-bottom:1.5rem;
      border:2px solid #F4623A; border-radius:12px; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .alert { padding:.75rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:.88rem; }
    .alert-success { background:#ECFDF5; color:#065F46; border:1px solid #6EE7B7; }
    .alert-danger  { background:#FEF2F2; color:#991B1B; border:1px solid #FECACA; }
  `]
})
export class SellerActivationComponent {
  @Input()  sellerId = '';
  @Output() activated = new EventEmitter<void>();

  paying = false; successMsg = ''; errorMsg = '';
  form: FormGroup;

  constructor(
    private paymentSvc: PaymentService,
    private sellerSvc: SellerService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      monto:      [50000, [Validators.required, Validators.min(1)]],
      metodoPago: ['PSE', Validators.required],
    });
  }

  activate(): void {
    if (this.form.invalid) return;
    this.paying = true; this.successMsg = ''; this.errorMsg = '';
    const payReq: PaymentRequest = {
      entityId: this.sellerId,
      entityType: 'SELLER',
      monto: this.form.value.monto,
      metodoPago: this.form.value.metodoPago,
    };
    this.paymentSvc.process(payReq).subscribe({
      next: () => {
        this.sellerSvc.activate(this.sellerId).subscribe({
          next: () => {
            this.successMsg = '¡Suscripción activada!';
            this.paying = false;
            setTimeout(() => this.activated.emit(), 1500);
          },
          error: () => { this.errorMsg = 'Pago procesado pero no se activó. Contacta soporte.'; this.paying = false; }
        });
      },
      error: () => { this.errorMsg = 'No se pudo procesar el pago.'; this.paying = false; }
    });
  }

  cancel(): void { this.activated.emit(); }
}