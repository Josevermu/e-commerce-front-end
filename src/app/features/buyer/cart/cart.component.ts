import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/services';
import { PaymentService } from '../../../core/services/services';
import { AuthService } from '../../../core/services/auth.service';
import {
  Cart, CartItem, MetodoPago, PaymentRequest, Order
} from '../../../core/models';

/**
 * CartComponent — Carrito de compras del comprador.
 *
 * Flujo:
 *   1. Ver productos en el carrito (GET /cart/{buyerId})
 *   2. Elegir modalidad de entrega (PUT /cart/{buyerId}/delivery)
 *   3. Ir al checkout
 *
 * Ruta: /buyer/cart
 * Rol:  BUYER
 */
@Component({
  selector: 'app-cart',
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Mi Carrito</h1>
          <p class="page-header__sub" *ngIf="cart">{{ cart.items.length }} producto(s)</p>
        </div>
        <a routerLink="/products" class="btn btn-outline btn-sm">+ Agregar más</a>
      </div>

      <div *ngIf="loading" class="skeleton skeleton-rect" style="height:300px; border-radius:20px;"></div>

      <div class="cart-layout" *ngIf="!loading && cart">
        <!-- Items del carrito -->
        <div>
          <div *ngIf="cart.items.length === 0" class="card text-center" style="padding:3rem;">
            <div style="font-size:3rem; margin-bottom:1rem;">🛒</div>
            <p class="text-muted">Tu carrito está vacío.</p>
            <a routerLink="/products" class="btn btn-primary mt-2">Ver productos</a>
          </div>

          <div class="cart-items" *ngIf="cart.items.length > 0">
            <div *ngFor="let item of cart.items" class="cart-item card">
              <div class="cart-item__image">{{ getCategoryEmoji(item.categoria) }}</div>
              <div class="cart-item__info">
                <div class="cart-item__name">{{ item.nombre }}</div>
                <div class="cart-item__category text-muted text-sm">{{ item.categoria }}</div>
                <div *ngIf="item.aplicaIVA" class="badge badge-warning mt-1">IVA incluido</div>
              </div>
              <div class="cart-item__price-col">
                <div class="cart-item__unit">{{ item.precioUnitario | currency:'COP':'symbol-narrow':'1.0-0' }} c/u</div>
                <div class="cart-item__qty">x{{ item.cantidad }}</div>
                <div class="cart-item__total">{{ item.precioUnitario * item.cantidad | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
              </div>
            </div>
          </div>

          <!-- Entrega -->
          <div class="card mt-2" *ngIf="cart.items.length > 0">
            <div class="card-header"><span class="card-title">Modalidad de entrega</span></div>
            <div class="delivery-options">
              <div
                class="delivery-option"
                [class.delivery-option--selected]="!cart.entregaDomicilio"
                (click)="setDelivery(false)"
              >
                <span class="delivery-option__icon">🏪</span>
                <div>
                  <div class="font-bold">Retiro en tienda</div>
                  <div class="text-sm text-muted">Sin costo adicional</div>
                </div>
              </div>
              <div
                class="delivery-option"
                [class.delivery-option--selected]="cart.entregaDomicilio"
                (click)="setDelivery(true)"
              >
                <span class="delivery-option__icon">🚚</span>
                <div>
                  <div class="font-bold">Envío a domicilio</div>
                  <div class="text-sm text-muted">Costo calculado en checkout</div>
                </div>
              </div>
            </div>
            <div class="form-group mt-1" *ngIf="cart.entregaDomicilio">
              <label>Ciudad de entrega</label>
              <input class="form-control" [(ngModel)]="deliveryCity" placeholder="Ej: Bogotá" />
            </div>
          </div>
        </div>

        <!-- Resumen y checkout -->
        <div class="cart-summary card">
          <div class="card-header"><span class="card-title">Resumen de orden</span></div>

          <div class="summary-line" *ngFor="let item of cart.items">
            <span class="truncate">{{ item.nombre }} x{{ item.cantidad }}</span>
            <span>{{ item.precioUnitario * item.cantidad | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
          </div>

          <div class="divider"></div>
          <div class="summary-line">
            <span>Subtotal</span>
            <span>{{ subtotal | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
          </div>
          <div class="summary-line" *ngIf="cart.entregaDomicilio">
            <span>Envío estimado</span>
            <span>{{ 15000 | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
          </div>
          <div class="divider"></div>
          <div class="summary-total">
            <span>Total estimado</span>
            <span>{{ (subtotal + (cart.entregaDomicilio ? 15000 : 0)) | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
          </div>

          <button
            class="btn btn-primary btn-block btn-lg mt-2"
            [disabled]="cart.items.length === 0"
            (click)="goToCheckout()"
          >
            Proceder al pago →
          </button>
          <p class="text-xs text-muted text-center mt-1">
            🔒 Pago seguro con PSE, tarjeta o consignación
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: flex-start; }
    .cart-items { display: flex; flex-direction: column; gap: 1rem; }
    .cart-item { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; }
    .cart-item__image { font-size: 2.5rem; flex-shrink: 0; }
    .cart-item__info { flex: 1; }
    .cart-item__name { font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem; }
    .cart-item__price-col { text-align: right; flex-shrink: 0; }
    .cart-item__unit { font-size: 0.8125rem; color: var(--text-muted); }
    .cart-item__qty  { font-size: 0.875rem; color: var(--text-secondary); }
    .cart-item__total { font-family: var(--font-display); font-weight: 700; font-size: 1.0625rem; color: var(--color-orange); }

    .delivery-options { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .delivery-option {
      border: 2px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem;
      cursor: pointer; display: flex; align-items: center; gap: 0.75rem;
      transition: all var(--transition-fast);
      &:hover { border-color: var(--color-orange); }
      &--selected { border-color: var(--color-orange); background: #FFF0EB; }
    }
    .delivery-option__icon { font-size: 1.5rem; }

    .summary-line { display: flex; justify-content: space-between; align-items: center; padding: 0.375rem 0; font-size: 0.9375rem; }
    .summary-total { display: flex; justify-content: space-between; align-items: center; padding: 0.375rem 0; font-family: var(--font-display); font-weight: 700; font-size: 1.125rem; }

    @media (max-width: 768px) { .cart-layout { grid-template-columns: 1fr; } }
  `]
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = true;
  deliveryCity = '';

  constructor(
    private orderSvc: OrderService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orderSvc.getCart(this.auth.getRelatedEntityId()).subscribe({
      next: c => { this.cart = c; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get subtotal(): number {
    return this.cart?.items.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0) ?? 0;
  }

  setDelivery(domicilio: boolean): void {
    if (!this.cart) return;
    const buyerId = this.auth.getRelatedEntityId();
    this.orderSvc.setDelivery(buyerId, domicilio, domicilio ? this.deliveryCity : undefined)
      .subscribe(c => this.cart = c);
  }

  getCategoryEmoji(cat?: string): string {
    const map: Record<string, string> = { 'Electrónica': '💻', Ropa: '👕', Hogar: '🏠', Deportes: '⚽', Belleza: '💄' };
    return map[cat ?? ''] ?? '📦';
  }

  goToCheckout(): void { this.router.navigate(['/buyer/checkout']); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout & Payment Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CheckoutComponent — Proceso de pago del comprador.
 *
 * Flujo:
 *   1. Seleccionar método de pago: PSE | CREDIT_CARD | CONSIGNATION
 *   2. Completar datos específicos del método
 *   3. POST /payments/process → obtener paymentId
 *   4. POST /orders/checkout/{buyerId}?paymentId=... → confirmar orden
 *
 * Ruta: /buyer/checkout
 * Rol:  BUYER
 */
@Component({
  selector: 'app-checkout',
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <button class="btn btn-ghost btn-sm mb-2" routerLink="/buyer/cart">← Volver al carrito</button>
          <h1 class="page-header__title">Checkout</h1>
        </div>
      </div>

      <div class="checkout-layout">
        <!-- Método de pago -->
        <div>
          <!-- Selector de método -->
          <div class="card mb-3">
            <div class="card-header"><span class="card-title">Método de pago</span></div>
            <div class="payment-methods">
              <div
                *ngFor="let m of paymentMethods"
                class="payment-method"
                [class.payment-method--selected]="selectedMethod === m.value"
                (click)="selectMethod(m.value)"
              >
                <span class="payment-method__icon">{{ m.icon }}</span>
                <div>
                  <div class="font-bold">{{ m.label }}</div>
                  <div class="text-xs text-muted">{{ m.desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Formulario PSE -->
          <div class="card" *ngIf="selectedMethod === 'PSE'" [formGroup]="pseForm">
            <div class="card-header"><span class="card-title">Datos PSE</span></div>
            <div class="form-group">
              <label>Entidad bancaria</label>
              <select class="form-control" formControlName="entidadBancaria">
                <option value="">Selecciona tu banco</option>
                <option *ngFor="let b of banks" [value]="b">{{ b }}</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Identificación del pagador</label>
                <input class="form-control" formControlName="pagadorIdentificacion" />
              </div>
              <div class="form-group">
                <label>Tipo de persona</label>
                <select class="form-control" formControlName="pagadorTipo">
                  <option value="NATURAL">Natural</option>
                  <option value="JURIDICA">Jurídica</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Formulario Tarjeta -->
          <div class="card" *ngIf="selectedMethod === 'CREDIT_CARD'" [formGroup]="cardForm">
            <div class="card-header"><span class="card-title">Datos de tarjeta</span></div>
            <div class="form-group">
              <label>Número de tarjeta</label>
              <input class="form-control" formControlName="numeroTarjeta" placeholder="•••• •••• •••• ••••" maxlength="19" />
            </div>
            <div class="form-group">
              <label>Nombre del titular</label>
              <input class="form-control" formControlName="nombreTitularTarjeta" placeholder="Como aparece en la tarjeta" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Fecha de vencimiento</label>
                <input class="form-control" formControlName="fechaVencimientoTarjeta" placeholder="MM/AA" />
              </div>
              <div class="form-group">
                <label>CVV</label>
                <input class="form-control" formControlName="cvv" placeholder="•••" maxlength="4" type="password" />
              </div>
            </div>
          </div>

          <!-- Consignación -->
          <div class="card" *ngIf="selectedMethod === 'CONSIGNATION'">
            <div class="card-header"><span class="card-title">Consignación bancaria</span></div>
            <div class="alert alert-info">
              💳 Realiza una consignación a la cuenta Bancolombia N° <strong>001-234567-89</strong>
              a nombre de <strong>Konrad E-Commerce SAS</strong> y adjunta el comprobante.
            </div>
            <div class="form-group">
              <label>Número de comprobante</label>
              <input class="form-control" [(ngModel)]="consignationRef" placeholder="Ej: 20240001234" />
            </div>
          </div>
        </div>

        <!-- Resumen del pago -->
        <div class="card cart-summary">
          <div class="card-header"><span class="card-title">Resumen de pago</span></div>
          <div class="summary-line"><span>Subtotal</span><span>{{ monto | currency:'COP':'symbol-narrow':'1.0-0' }}</span></div>
          <div class="summary-line"><span>Envío</span><span>{{ 15000 | currency:'COP':'symbol-narrow':'1.0-0' }}</span></div>
          <div class="summary-line"><span>IVA</span><span>{{ iva | currency:'COP':'symbol-narrow':'1.0-0' }}</span></div>
          <div class="divider"></div>
          <div class="summary-total"><span>TOTAL</span><span>{{ totalFinal | currency:'COP':'symbol-narrow':'1.0-0' }}</span></div>

          <div *ngIf="paymentResult" class="alert alert-success mt-2">
            ✅ Pago aprobado: {{ paymentResult.numeroAprobacion }}
          </div>
          <div *ngIf="errorMsg" class="alert alert-danger mt-2">⚠️ {{ errorMsg }}</div>

          <button
            class="btn btn-primary btn-block btn-lg mt-2"
            [disabled]="processing"
            (click)="processPayment()"
          >
            <span *ngIf="!processing">🔒 Pagar {{ totalFinal | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
            <span *ngIf="processing"><span class="spinner"></span> Procesando pago...</span>
          </button>
          <p class="text-xs text-muted text-center mt-1">Pago seguro garantizado por KONRAD</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: flex-start; }
    .payment-methods { display: flex; flex-direction: column; gap: 0.75rem; }
    .payment-method {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem 1.25rem; border: 2px solid var(--color-border);
      border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast);
      &:hover { border-color: var(--color-orange); }
      &--selected { border-color: var(--color-orange); background: #FFF0EB; }
    }
    .payment-method__icon { font-size: 1.75rem; flex-shrink: 0; }
    .summary-line { display: flex; justify-content: space-between; padding: 0.375rem 0; font-size: 0.9375rem; }
    .summary-total { display: flex; justify-content: space-between; font-family: var(--font-display); font-weight: 700; font-size: 1.25rem; padding: 0.375rem 0; }
    @media (max-width: 768px) { .checkout-layout { grid-template-columns: 1fr; } }
  `]
})
export class CheckoutComponent {
  selectedMethod: MetodoPago = 'PSE';
  processing = false;
  paymentResult: any = null;
  errorMsg = '';
  consignationRef = '';

  monto = 703000;
  iva = 47500;
  totalFinal = this.monto + 15000 + this.iva;

  paymentMethods = [
    { value: 'PSE' as MetodoPago, label: 'PSE', icon: '🏦', desc: 'Débito bancario directo' },
    { value: 'CREDIT_CARD' as MetodoPago, label: 'Tarjeta de crédito/débito', icon: '💳', desc: 'Visa, Mastercard, Amex' },
    { value: 'CONSIGNATION' as MetodoPago, label: 'Consignación', icon: '🧾', desc: 'Transferencia o consignación' },
  ];

  banks = ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA', 'Scotiabank Colpatria', 'Banco Popular'];

  pseForm: FormGroup;
  cardForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private paymentSvc: PaymentService,
    private orderSvc: OrderService,
    private auth: AuthService,
    private router: Router
  ) {
    this.pseForm = this.fb.group({
      pagadorIdentificacion: ['', Validators.required],
      pagadorTipo: ['NATURAL'],
      entidadBancaria: ['', Validators.required],
    });
    this.cardForm = this.fb.group({
      numeroTarjeta: ['', Validators.required],
      nombreTitularTarjeta: ['', Validators.required],
      fechaVencimientoTarjeta: ['', Validators.required],
      cvv: ['', Validators.required],
    });
  }

  selectMethod(m: MetodoPago): void { this.selectedMethod = m; this.errorMsg = ''; }

  processPayment(): void {
    this.processing = true;
    this.errorMsg = '';

    const buyerId = this.auth.getRelatedEntityId();

    const req: PaymentRequest = {
      entityId: buyerId + '-cart',
      entityType: 'ORDER',
      monto: this.totalFinal,
      metodoPago: this.selectedMethod,
      ...(this.selectedMethod === 'PSE' ? this.pseForm.value : {}),
      ...(this.selectedMethod === 'CREDIT_CARD' ? this.cardForm.value : {}),
    };

    this.paymentSvc.process(req).subscribe({
      next: payment => {
        if (payment.estado === 'APROBADO') {
          // Confirmar la orden con el paymentId
          this.orderSvc.checkout(buyerId, payment.paymentId).subscribe({
            next: order => {
              this.processing = false;
              this.paymentResult = payment;
              setTimeout(() => this.router.navigate(['/buyer/orders']), 2000);
            },
            error: () => { this.processing = false; this.errorMsg = 'Error al confirmar la orden.'; }
          });
        } else {
          this.processing = false;
          this.errorMsg = 'El pago fue rechazado. Verifica los datos e intenta nuevamente.';
        }
      },
      error: err => {
        this.processing = false;
        this.errorMsg = err.error?.message ?? 'Error al procesar el pago.';
      }
    });
  }
}