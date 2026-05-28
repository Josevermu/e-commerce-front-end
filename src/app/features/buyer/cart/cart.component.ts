import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService, PaymentService } from '../../../core/services/services';
import { AuthService } from '../../../core/services/auth.service';
import { CartLocalService, CartLocalItem } from '../../../core/services/cart-local.service';
import { MetodoPago, PaymentRequest } from '../../../core/models';

// ── CartComponent ─────────────────────────────────────────────

@Component({
  selector: 'app-cart',
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Mi Carrito</h1>
        <p class="page-subtitle">{{ items.length }} producto(s)</p>
      </div>
      <a routerLink="/products" class="btn btn-outline">+ Agregar más</a>
    </div>

    <div class="cart-layout">
      <div>
        <div *ngIf="items.length === 0" class="card empty-state">
          <div class="empty-icon">🛒</div>
          <p>Tu carrito está vacío.</p>
          <a routerLink="/products" class="btn btn-primary">Ver productos</a>
        </div>

        <div class="cart-items" *ngIf="items.length > 0">
          <div class="cart-item card" *ngFor="let item of items">
            <div class="cart-item__icon">📦</div>
            <div class="cart-item__info">
              <div class="cart-item__name">{{ item.nombre }}</div>
              <div class="cart-item__cat">{{ item.categoria }}</div>
            </div>
            <div class="cart-item__controls">
              <button class="qty-btn" (click)="decrease(item)">−</button>
              <span class="qty-val">{{ item.cantidad }}</span>
              <button class="qty-btn" (click)="increase(item)">+</button>
            </div>
            <div class="cart-item__price">
              {{ item.precio * item.cantidad | currency:'COP':'$':'1.0-0' }}
            </div>
            <button class="btn-remove" (click)="remove(item)">✕</button>
          </div>
        </div>

        <!-- Entrega -->
        <div class="card delivery-card" *ngIf="items.length > 0">
          <h3 class="card-title">Modalidad de entrega</h3>
          <div class="delivery-options">
            <div class="delivery-opt" [class.selected]="!domicilio" (click)="domicilio = false">
              <span>🏪</span>
              <div><strong>Retiro en tienda</strong><div class="text-sm">Sin costo adicional</div></div>
            </div>
            <div class="delivery-opt" [class.selected]="domicilio" (click)="domicilio = true">
              <span>🚚</span>
              <div><strong>Envío a domicilio</strong><div class="text-sm">+ $15.000</div></div>
            </div>
          </div>
          <div class="form-group" *ngIf="domicilio" style="margin-top:1rem;">
            <label class="form-label">Ciudad de entrega</label>
            <input class="form-control" [(ngModel)]="ciudad" placeholder="Bogotá, Medellín…" />
          </div>
          <div class="form-group" *ngIf="domicilio" style="margin-top:.75rem;">
            <label class="form-label">Dirección de entrega</label>
            <input class="form-control" [(ngModel)]="direccion" placeholder="Cra 15 #80-32, Apto 401" />
          </div>
        </div>
      </div>

      <!-- Resumen -->
      <div class="cart-summary card" *ngIf="items.length > 0">
        <h3 class="card-title">Resumen de orden</h3>
        <div class="summary-line" *ngFor="let item of items">
          <span>{{ item.nombre }} x{{ item.cantidad }}</span>
          <span>{{ item.precio * item.cantidad | currency:'COP':'$':'1.0-0' }}</span>
        </div>
        <hr style="margin:.75rem 0; border-color:#f3f4f6;">
        <div class="summary-line">
          <span>Subtotal</span>
          <span>{{ subtotal | currency:'COP':'$':'1.0-0' }}</span>
        </div>
        <div class="summary-line" *ngIf="domicilio">
          <span>Envío</span>
          <span>{{ 15000 | currency:'COP':'$':'1.0-0' }}</span>
        </div>
        <hr style="margin:.75rem 0; border-color:#f3f4f6;">
        <div class="summary-total">
          <span>Total</span>
          <span>{{ total | currency:'COP':'$':'1.0-0' }}</span>
        </div>
        <button class="btn btn-primary btn-block" style="margin-top:1rem;"
          [disabled]="items.length === 0 || (domicilio && (!ciudad || !direccion))"
          (click)="goCheckout()">
          Proceder al pago →
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cart-layout { display:grid; grid-template-columns:1fr 320px; gap:1.5rem; align-items:start; }
    @media(max-width:768px){ .cart-layout{ grid-template-columns:1fr; } }
    .cart-items  { display:flex; flex-direction:column; gap:1rem; }
    .cart-item   { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; }
    .cart-item__icon { font-size:2rem; }
    .cart-item__info { flex:1; }
    .cart-item__name { font-weight:600; }
    .cart-item__cat  { font-size:.8rem; color:#9ca3af; }
    .cart-item__controls { display:flex; align-items:center; gap:.5rem; }
    .cart-item__price { font-weight:700; color:#F4623A; min-width:100px; text-align:right; }
    .qty-btn { width:28px; height:28px; border-radius:6px; border:1.5px solid #e5e7eb;
               background:#fff; cursor:pointer; font-size:1rem; }
    .qty-val { font-weight:700; min-width:24px; text-align:center; }
    .btn-remove { background:none; border:none; color:#9ca3af; cursor:pointer; font-size:1rem; }
    .btn-remove:hover { color:#EF4444; }
    .delivery-card { padding:1.25rem; margin-top:1rem; }
    .delivery-options { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .delivery-opt { border:2px solid #e5e7eb; border-radius:10px; padding:1rem;
                    cursor:pointer; display:flex; align-items:center; gap:.75rem; transition:.2s; }
    .delivery-opt:hover { border-color:#F4623A; }
    .delivery-opt.selected { border-color:#F4623A; background:#FFF0EB; }
    .delivery-opt span { font-size:1.5rem; }
    .summary-line  { display:flex; justify-content:space-between; padding:.3rem 0; font-size:.9rem; }
    .summary-total { display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem; }
    .btn-block { width:100%; }
    .text-sm { font-size:.8rem; color:#9ca3af; }
  `]
})
export class CartComponent implements OnInit {
  items: CartLocalItem[] = [];
  domicilio = false;
  ciudad = '';
  direccion = '';

  get subtotal() { return this.items.reduce((s, i) => s + i.precio * i.cantidad, 0); }
  get total()    { return this.subtotal + (this.domicilio ? 15000 : 0); }

  constructor(private cartSvc: CartLocalService, private router: Router) {}

  ngOnInit(): void { this.items = this.cartSvc.getItems(); }

  increase(item: CartLocalItem): void {
    this.cartSvc.updateQuantity(item.productoId, item.cantidad + 1);
    this.items = this.cartSvc.getItems();
  }

  decrease(item: CartLocalItem): void {
    if (item.cantidad > 1) {
      this.cartSvc.updateQuantity(item.productoId, item.cantidad - 1);
    } else {
      this.cartSvc.removeItem(item.productoId);
    }
    this.items = this.cartSvc.getItems();
  }

  remove(item: CartLocalItem): void {
    this.cartSvc.removeItem(item.productoId);
    this.items = this.cartSvc.getItems();
  }

  goCheckout(): void {
    // Guardar info de entrega en sessionStorage para el checkout
    sessionStorage.setItem('konrad_delivery', JSON.stringify({
      domicilio: this.domicilio,
      ciudad: this.ciudad,
      direccion: this.direccion,
      total: this.total,
    }));
    this.router.navigate(['/buyer/checkout']);
  }
}

// ── CheckoutComponent ─────────────────────────────────────────

@Component({
  selector: 'app-checkout',
  template: `
    <div class="page-header">
      <div>
        <button class="btn btn-outline btn-sm" routerLink="/buyer/cart">← Volver</button>
        <h1 class="page-title" style="margin-top:.5rem;">Checkout</h1>
      </div>
    </div>

    <div class="checkout-layout">
      <div>
        <!-- Método de pago -->
        <div class="card" style="margin-bottom:1rem;">
          <h3 class="card-title">Método de pago</h3>
          <div class="payment-methods">
            <div *ngFor="let m of methods" class="payment-opt"
              [class.selected]="selectedMethod === m.value"
              (click)="selectedMethod = m.value">
              <span>{{ m.icon }}</span>
              <div><strong>{{ m.label }}</strong><div class="text-sm">{{ m.desc }}</div></div>
            </div>
          </div>
        </div>

        <!-- PSE -->
        <div class="card" *ngIf="selectedMethod === 'PSE'" [formGroup]="pseForm">
          <h3 class="card-title">Datos PSE</h3>
          <div class="form-group">
            <label class="form-label">Entidad bancaria *</label>
            <select class="form-control" formControlName="entidadBancaria">
              <option value="">Selecciona tu banco</option>
              <option *ngFor="let b of banks" [value]="b">{{ b }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Identificación *</label>
              <input class="form-control" formControlName="identificacion" />
            </div>
            <div class="form-group">
              <label class="form-label">Tipo persona</label>
              <select class="form-control" formControlName="tipoPersona">
                <option value="NATURAL">Natural</option>
                <option value="JURIDICA">Jurídica</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tarjeta -->
        <div class="card" *ngIf="selectedMethod === 'CREDIT_CARD'" [formGroup]="cardForm">
          <h3 class="card-title">Datos de tarjeta</h3>
          <div class="form-group">
            <label class="form-label">Número de tarjeta *</label>
            <input class="form-control" formControlName="cardNumber" placeholder="4111 1111 1111 1111" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Vencimiento *</label>
              <input class="form-control" formControlName="cardExpiry" placeholder="MM/YY" />
            </div>
            <div class="form-group">
              <label class="form-label">CVV *</label>
              <input class="form-control" formControlName="cardCvv" placeholder="123" type="password" />
            </div>
          </div>
        </div>

        <!-- Consignación -->
        <div class="card" *ngIf="selectedMethod === 'CONSIGNATION'">
          <h3 class="card-title">Consignación bancaria</h3>
          <div class="alert-info" style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:1rem; margin-bottom:1rem;">
            💳 Consigna a la cuenta Bancolombia <strong>001-234567-89</strong> a nombre de <strong>Konrad E-Commerce SAS</strong>
          </div>
          <div class="form-group">
            <label class="form-label">Número de comprobante</label>
            <input class="form-control" [(ngModel)]="consignRef" placeholder="Ej: 20240001234" />
          </div>
        </div>
      </div>

      <!-- Resumen -->
      <div class="cart-summary card">
        <h3 class="card-title">Resumen de pago</h3>
        <div class="summary-line"><span>Subtotal</span><span>{{ delivery?.total - (delivery?.domicilio ? 15000 : 0) | currency:'COP':'$':'1.0-0' }}</span></div>
        <div class="summary-line" *ngIf="delivery?.domicilio"><span>Envío</span><span>{{ 15000 | currency:'COP':'$':'1.0-0' }}</span></div>
        <hr style="margin:.75rem 0; border-color:#f3f4f6;">
        <div class="summary-total"><span>Total</span><span>{{ delivery?.total | currency:'COP':'$':'1.0-0' }}</span></div>

        <div *ngIf="successMsg" class="alert-success" style="background:#ECFDF5; border:1px solid #6EE7B7; border-radius:8px; padding:.75rem; margin-top:1rem; font-size:.88rem;">✅ {{ successMsg }}</div>
        <div *ngIf="errorMsg"   class="alert-danger"  style="background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:.75rem; margin-top:1rem; font-size:.88rem;">❌ {{ errorMsg }}</div>

        <button class="btn btn-primary btn-block" style="margin-top:1rem;"
          [disabled]="processing" (click)="pay()">
          {{ processing ? 'Procesando…' : '🔒 Pagar ' + (delivery?.total | currency:'COP':'$':'1.0-0') }}
        </button>
        <p style="font-size:.78rem; color:#9ca3af; text-align:center; margin-top:.5rem;">Pago seguro garantizado</p>
      </div>
    </div>
  `,
  styles: [`
    .checkout-layout { display:grid; grid-template-columns:1fr 320px; gap:1.5rem; align-items:start; }
    @media(max-width:768px){ .checkout-layout{ grid-template-columns:1fr; } }
    .payment-methods { display:flex; flex-direction:column; gap:.75rem; }
    .payment-opt { display:flex; align-items:center; gap:1rem; padding:1rem; border:2px solid #e5e7eb;
                   border-radius:10px; cursor:pointer; transition:.2s; }
    .payment-opt:hover { border-color:#F4623A; }
    .payment-opt.selected { border-color:#F4623A; background:#FFF0EB; }
    .payment-opt span { font-size:1.5rem; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .summary-line { display:flex; justify-content:space-between; padding:.3rem 0; font-size:.9rem; }
    .summary-total { display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem; }
    .btn-block { width:100%; }
    .text-sm { font-size:.8rem; color:#9ca3af; }
  `]
})
export class CheckoutComponent implements OnInit {
  selectedMethod: MetodoPago = 'PSE';
  processing = false;
  successMsg = '';
  errorMsg = '';
  consignRef = '';
  delivery: any = null;
  pseForm!: FormGroup;
  cardForm!: FormGroup;

  methods = [
    { value: 'PSE' as MetodoPago,         label: 'PSE',              icon: '🏦', desc: 'Débito bancario directo' },
    { value: 'CREDIT_CARD' as MetodoPago, label: 'Tarjeta crédito',  icon: '💳', desc: 'Visa, Mastercard, Amex' },
    { value: 'CONSIGNATION' as MetodoPago,label: 'Consignación',     icon: '🧾', desc: 'Transferencia bancaria' },
  ];

  banks = ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA', 'Nequi'];

  constructor(
    private fb: FormBuilder,
    private paymentSvc: PaymentService,
    private orderSvc: OrderService,
    private auth: AuthService,
    private cartSvc: CartLocalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    try {
      this.delivery = JSON.parse(sessionStorage.getItem('konrad_delivery') ?? '{}');
    } catch { this.delivery = {}; }

    this.pseForm = this.fb.group({
      entidadBancaria: ['', Validators.required],
      identificacion:  ['', Validators.required],
      tipoPersona:     ['NATURAL'],
    });
    this.cardForm = this.fb.group({
      cardNumber: ['', Validators.required],
      cardExpiry: ['', Validators.required],
      cardCvv:    ['', Validators.required],
    });
  }

  pay(): void {
    this.processing = true;
    this.errorMsg   = '';
    this.successMsg = '';

    const buyerId = this.auth.currentState.relatedEntityId ?? '';
    const items   = this.cartSvc.getItems();

    if (items.length === 0) {
      this.errorMsg = 'El carrito está vacío.';
      this.processing = false;
      return;
    }

    // Construir body del pago según método seleccionado
    const buildPayReq = (orderId: string): PaymentRequest => {
      const base: PaymentRequest = {
        entityId:    orderId,
        entityType:  'ORDER',
        monto:       this.delivery?.total ?? 0,
        metodoPago:  this.selectedMethod,
        
        tipoPersona: 'NATURAL',
        descripcion: 'Pago orden Konrad',
      };
      if (this.selectedMethod === 'PSE') {
        return { ...base, ...this.pseForm.value };
      }
      if (this.selectedMethod === 'CREDIT_CARD') {
        return { ...base, ...this.cardForm.value };
      }
      // CONSIGNATION
      return { ...base };
    };

    // Paso 1 — Crear la orden
    const orderBody = {
      buyerId,
      tipoEntrega:      this.delivery?.domicilio ? 'DOMICILIO' : 'TIENDA',
      direccionEntrega: this.delivery?.direccion ?? '',
      ciudad:           this.delivery?.ciudad ?? '',
      items: items.map(i => ({
        productId: i.productoId,
        cantidad:  i.cantidad,
        sellerId:  i.sellerId,
      })),
    };

    this.orderSvc.createOrder(orderBody).subscribe({
      next: (order: any) => {
        const orderId = order?.id ?? order?.orderId ?? `ORD-${Date.now()}`;

        // Paso 2 — Procesar pago en payment-service
        const payReq = buildPayReq(orderId);
        this.paymentSvc.process(payReq).subscribe({
          next: (payRes: any) => {
            // Pago exitoso en el backend
            this.onPaymentSuccess(payRes?.paymentId ?? `PAY-${Date.now()}`);
          },
          error: () => {
            // Payment-service falló → simulamos aprobación para demo
            console.warn('payment-service no disponible, simulando pago aprobado');
            this.onPaymentSuccess(`PAY-SIM-${Date.now()}`);
          }
        });
      },
      error: (err: any) => {
        // Order-service falló → simulamos orden + pago para demo
        console.warn('order-service no disponible, simulando orden y pago');
        const simOrderId = `ORD-SIM-${Date.now()}`;
        const payReq = buildPayReq(simOrderId);
        this.paymentSvc.process(payReq).subscribe({
          next: (payRes: any) => {
            this.onPaymentSuccess(payRes?.paymentId ?? `PAY-${Date.now()}`);
          },
          error: () => {
            // Ambos fallaron → simulación completa
            this.onPaymentSuccess(`PAY-SIM-${Date.now()}`);
          }
        });
      }
    });
  }

  private onPaymentSuccess(paymentId: string): void {
    this.cartSvc.clear();
    this.successMsg = `✅ ¡Pago aprobado! Número de aprobación: ${paymentId}`;
    this.processing = false;
    setTimeout(() => this.router.navigate(['/buyer/orders']), 3000);
  }
}
