import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../core/services/services';
import { SellerService } from '../../../core/services/seller.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartLocalService } from '../../../core/services/cart-local.service';
import { Product, ProductSearchParams } from '../../../core/models';

// ─────────────────────────────────────────────────────────────────────────────
// Product Catalog (Vitrina pública)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CatalogComponent — Vitrina pública de productos.
 *
 * Endpoint: GET /products/search?nombre=&categoria=&precioMin=&precioMax=&palabra=
 * No requiere autenticación.
 *
 * Ruta: /products
 */
@Component({
  selector: 'app-catalog',
  template: `
    <div class="catalog-wrapper">
      <!-- Hero buscador -->
      <div class="catalog-hero">
        <div class="container">
          <div class="catalog-hero__nav">
            <span class="catalog-hero__brand">🛒 KONRAD</span>
            <div class="catalog-hero__actions">
              <a routerLink="/buyers/register" class="btn-hero-outline">Registrarse</a>
              <a routerLink="/auth/login" class="btn-hero-primary">Iniciar sesión</a>
            </div>
          </div>
          <h1 class="catalog-hero__title">Descubre los mejores productos</h1>
          <p class="catalog-hero__sub">Miles de productos de vendedores verificados en Colombia</p>
          <div class="catalog-hero__search">
            <div class="search-bar" style="max-width:580px; margin:0 auto; background:white;">
              <span class="search-icon">🔍</span>
              <input
                [(ngModel)]="searchParams.palabra"
                (keyup.enter)="search()"
                placeholder="Busca productos, categorías, marcas..."
                style="font-size:1rem;"
              />
              <button class="btn btn-primary" (click)="search()">Buscar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="container" style="padding-top:2rem; padding-bottom:3rem;">
        <div class="catalog-layout">
          <!-- Filtros laterales -->
          <aside class="catalog-filters card">
            <h3 style="font-family:var(--font-display);margin-bottom:1.25rem;">Filtros</h3>

            <div class="form-group">
              <label>Categoría</label>
              <select class="form-control" [(ngModel)]="searchParams.categoria" (change)="search()">
                <option value="">Todas</option>
                <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Precio mínimo (COP)</label>
              <input type="number" class="form-control" [(ngModel)]="searchParams.precioMin" placeholder="$0" />
            </div>

            <div class="form-group">
              <label>Precio máximo (COP)</label>
              <input type="number" class="form-control" [(ngModel)]="searchParams.precioMax" placeholder="Sin límite" />
            </div>

            <button class="btn btn-primary btn-block" (click)="search()">Aplicar filtros</button>
            <button class="btn btn-ghost btn-block mt-1" (click)="clearFilters()">Limpiar</button>
          </aside>

          <!-- Grid de productos -->
          <div class="catalog-main">
            <div class="catalog-count" *ngIf="!loading">
              {{ products.length }} productos encontrados
            </div>

            <!-- Skeleton cargando -->
            <div class="product-grid" *ngIf="loading">
              <div *ngFor="let _ of [1,2,3,4,5,6]" class="skeleton skeleton-rect" style="height:280px; border-radius:20px;"></div>
            </div>

            <!-- Productos -->
            <div class="product-grid" *ngIf="!loading">
              <div
                *ngFor="let p of products"
                class="product-card"
                (click)="viewProduct(p)"
              >
                <div class="product-card__image">🛍️</div>
                <div class="product-card__body">
                  <div class="product-card__category">{{ p.categoria }}</div>
                  <div class="product-card__name">{{ p.nombre }}</div>
                  <div class="product-card__price">{{ p.valor | currency:'COP':'$':'1.0-0' }}</div>
                  <div class="product-card__seller">por {{ p.nombreVendedor ?? 'Vendedor Konrad' }}</div>
                  <div class="flex items-center gap-1 mt-1">
                    <span class="badge badge-success" *ngIf="(p?.stock ?? 0) > 0">Stock: {{ p?.stock }}</span>
                  </div>
                </div>
              </div>

              <div *ngIf="products.length === 0" class="catalog-empty">
                <div class="catalog-empty__icon">🔍</div>
                <p>No encontramos productos con esos filtros.</p>
                <button class="btn btn-outline btn-sm" (click)="clearFilters()">Ver todos</button>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Modal detalle producto -->
    <div class="modal-overlay" *ngIf="selectedProduct" (click)="closeProduct()">
      <div class="modal-product" (click)="$event.stopPropagation()">
        <button class="modal-close" (click)="closeProduct()">✕</button>
        <div class="modal-product__image">🛍️</div>
        <div class="modal-product__body">
          <span class="badge badge-secondary">{{ selectedProduct.categoria }}</span>
          <h2 class="modal-product__name">{{ selectedProduct.nombre }}</h2>
          <div class="modal-product__price">{{ selectedProduct.valor | currency:'COP':'$':'1.0-0' }}</div>
          <div class="modal-product__meta">
            <div><strong>Marca:</strong> {{ selectedProduct.marca }}</div>
            <div><strong>Color:</strong> {{ selectedProduct.color }}</div>
            <div *ngIf="selectedProduct.talla"><strong>Talla:</strong> {{ selectedProduct.talla }}</div>
            <div><strong>Stock:</strong> {{ selectedProduct?.stock }} unidades</div>
            <div><strong>Peso:</strong> {{ selectedProduct.peso }} kg</div>
          </div>
          <div style="display:flex; gap:.5rem; margin-top:.75rem;">
            <span class="badge badge-success" *ngIf="selectedProduct.nuevo">Nuevo</span>
            <span class="badge badge-info" *ngIf="selectedProduct.original">Original</span>
          </div>
          <div class="modal-product__actions">
            <div *ngIf="!isBuyer">
              <a routerLink="/auth/login" class="btn btn-primary">🔑 Iniciar sesión para comprar</a>
            </div>
            <div *ngIf="isBuyer" style="display:flex; flex-direction:column; gap:.75rem;">
              <div style="display:flex; align-items:center; gap:.75rem;">
                <button class="btn btn-outline btn-sm" (click)="decreaseQty()">−</button>
                <span style="font-weight:700; font-size:1.1rem;">{{ qty }}</span>
                <button class="btn btn-outline btn-sm" (click)="increaseQty()">+</button>
              </div>
              <button class="btn btn-primary" (click)="addToCart()">
                🛒 Agregar al carrito
              </button>
              <div *ngIf="addedMsg" class="alert alert-success" style="margin:0; padding:.5rem .75rem; font-size:.85rem;">
                ✅ {{ addedMsg }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  `,
  styles: [`
    .catalog-wrapper { min-height: 100vh; padding-top: var(--spacing-navbar); }
    .catalog-hero {
      background: linear-gradient(160deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
      padding: 4rem 0 3rem; text-align: center;
    }
    .catalog-hero__nav { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
    .catalog-hero__brand { font-size:1.3rem; font-weight:800; color:#fff; }
    .catalog-hero__actions { display:flex; gap:.75rem; }
    .btn-hero-outline { border:2px solid rgba(255,255,255,.6); color:#fff; background:transparent;
      border-radius:8px; padding:.45rem 1.1rem; font-size:.88rem; font-weight:600;
      text-decoration:none; transition:.2s; }
    .btn-hero-outline:hover { background:rgba(255,255,255,.1); }
    .btn-hero-primary { background:#F4623A; color:#fff; border:none;
      border-radius:8px; padding:.45rem 1.1rem; font-size:.88rem; font-weight:600;
      text-decoration:none; transition:.2s; }
    .btn-hero-primary:hover { background:#e05530; }
    .catalog-hero__title { font-family: var(--font-display); font-size: 2.25rem; font-weight: 800; color: white; margin-bottom: 0.75rem; }
    .catalog-hero__sub   { color: rgba(255,255,255,0.7); font-size: 1.0625rem; margin-bottom: 2rem; }
    .catalog-hero__search { display: flex; justify-content: center; }

    .catalog-layout { display: grid; grid-template-columns: 260px 1fr; gap: 2rem; }
    .catalog-filters { height: fit-content; position: sticky; top: calc(var(--spacing-navbar) + 1rem); }
    .catalog-count { font-size: 0.9375rem; color: var(--text-muted); margin-bottom: 1rem; }

    .catalog-empty { grid-column: 1/-1; text-align: center; padding: 3rem; }
    .catalog-empty__icon { font-size: 3rem; margin-bottom: 1rem; }

    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:1000;
      display:flex; align-items:center; justify-content:center; padding:1rem; }
    .modal-product { background:#fff; border-radius:16px; max-width:480px; width:100%;
      padding:2rem; position:relative; max-height:90vh; overflow-y:auto; }
    .modal-close { position:absolute; top:1rem; right:1rem; background:none; border:none;
      font-size:1.2rem; cursor:pointer; color:#6b7280; }
    .modal-product__image { font-size:4rem; text-align:center; margin-bottom:1rem; }
    .modal-product__name { font-size:1.3rem; font-weight:800; color:#0D1B2A; margin:.5rem 0; }
    .modal-product__price { font-size:1.5rem; font-weight:800; color:#F4623A; margin-bottom:1rem; }
    .modal-product__meta { display:flex; flex-direction:column; gap:.4rem; font-size:.9rem;
      color:#4b5563; margin-bottom:1rem; }
    .modal-product__actions { margin-top:1.5rem; }
    .modal-product__actions .btn { width:100%; text-align:center; }

    @media (max-width: 768px) { .catalog-layout { grid-template-columns: 1fr; } .catalog-filters { position: static; } }
  `]
})
export class CatalogComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  searchParams: ProductSearchParams = {};
  selectedProduct: Product | null = null;
  qty = 1;
  addedMsg = '';

  get isBuyer(): boolean { return this.auth.currentState.role === 'BUYER'; }

  categories = ['Ropa', 'Electrónica', 'Hogar', 'Deportes', 'Belleza', 'Libros', 'Alimentos', 'Juguetes'];

  constructor(
    private productSvc: ProductService,
    private router: Router,
    private auth: AuthService,
    private cartSvc: CartLocalService
  ) {}

  ngOnInit(): void { this.search(); }

  search(): void {
    this.loading = true;
    this.productSvc.search(this.searchParams).subscribe({
      next: p => { this.products = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  clearFilters(): void {
    this.searchParams = {};
    this.search();
  }

  viewProduct(product: Product): void {
    this.selectedProduct = product;
    this.qty = 1;
    this.addedMsg = '';
  }

  closeProduct(): void { this.selectedProduct = null; }

  increaseQty(): void { this.qty++; }
  decreaseQty(): void { if (this.qty > 1) this.qty--; }

  addToCart(): void {
    if (!this.selectedProduct) return;
    const p = this.selectedProduct;
    this.cartSvc.addItem({
      productoId: p.id ?? '',
      nombre: p.nombre,
      precio: p.valor ?? p.precio ?? 0,
      cantidad: this.qty,
      sellerId: p.sellerId,
      categoria: p.categoria,
    });
    this.addedMsg = `${this.qty} producto(s) agregado(s) al carrito`;
    setTimeout(() => { this.addedMsg = ''; }, 2000);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Seller Registration Form (público)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SellerRegisterComponent — Formulario público de solicitud de vendedor.
 *
 * Endpoint: POST /sellers/apply (sin JWT)
 * Cualquier persona puede enviar una solicitud.
 * Después de enviar, muestra el ID de solicitud para hacer seguimiento.
 *
 * Ruta: /sellers/apply
 */
@Component({
  selector: 'app-seller-register',
  template: `
    <div class="form-page">
      <div class="form-page__wrapper">
        <!-- Sin registrar -->
        <ng-container *ngIf="!submitted">
          <div class="form-page__header">
            <div class="form-page__back">
              <a routerLink="/home">← Volver al inicio</a>
            </div>
            <h1 class="form-page__title">Solicitar ser Vendedor</h1>
            <p class="form-page__sub">Completa el formulario y el Director Comercial revisará tu solicitud en 48 horas.</p>
          </div>

          <div class="card">
            <form [formGroup]="form" (ngSubmit)="submit()">
              <h3 class="section-title">Datos personales</h3>
              <div class="form-row">
                <div class="form-group">
                  <label>Nombres *</label>
                  <input class="form-control" formControlName="nombres" [class.is-invalid]="submitted2 && form.get('nombres')?.invalid" />
                  <div class="form-error" *ngIf="submitted2 && form.get('nombres')?.hasError('required')">Campo requerido</div>
                </div>
                <div class="form-group">
                  <label>Apellidos *</label>
                  <input class="form-control" formControlName="apellidos" [class.is-invalid]="submitted2 && form.get('apellidos')?.invalid" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Número de identificación *</label>
                  <input class="form-control" formControlName="identificacion" />
                </div>
                <div class="form-group">
                  <label>Tipo de persona *</label>
                  <select class="form-control" formControlName="tipoPersona">
                    <option value="NATURAL">Natural</option>
                    <option value="JURIDICA">Jurídica</option>
                  </select>
                </div>
              </div>

              <h3 class="section-title mt-2">Información de contacto</h3>
              <div class="form-group">
                <label>Correo electrónico *</label>
                <input type="email" class="form-control" formControlName="correo" [class.is-invalid]="submitted2 && form.get('correo')?.invalid" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>País *</label>
                  <input class="form-control" formControlName="pais" />
                </div>
                <div class="form-group">
                  <label>Ciudad *</label>
                  <input class="form-control" formControlName="ciudad" />
                </div>
              </div>
              <div class="form-group">
                <label>Teléfono *</label>
                <input class="form-control" formControlName="telefono" />
              </div>

              <h3 class="section-title mt-2">Documentos</h3>
              <div class="alert alert-info">
                📎 En el entorno actual, los documentos se registran por nombre. En producción se subiría el archivo.
              </div>
              <div class="form-group">
                <label>Documentos adjuntos</label>
                <div class="docs-list">
                  <div *ngFor="let doc of defaultDocs" class="doc-chip">
                    <span>✅</span> {{ doc }}
                  </div>
                </div>
              </div>

              <div *ngIf="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>

              <div class="flex justify-between items-center mt-2">
                <a routerLink="/home" class="btn btn-ghost">Cancelar</a>
                <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading">
                  <span *ngIf="!loading">Enviar solicitud →</span>
                  <span *ngIf="loading"><span class="spinner"></span> Enviando...</span>
                </button>
              </div>
            </form>
          </div>
        </ng-container>

        <!-- Confirmación -->
        <div class="card success-panel" *ngIf="submitted">
          <div class="success-icon">🎉</div>
          <h2>¡Solicitud enviada exitosamente!</h2>
          <p class="text-secondary">El Director Comercial revisará tu información y te notificará por correo en máximo 48 horas.</p>
          <div class="application-id-box">
            <p class="text-sm text-muted">Tu número de solicitud</p>
            <p class="application-id">{{ applicationId }}</p>
            <p class="text-xs text-muted">Guarda este código para hacer seguimiento</p>
          </div>
          <div class="flex gap-2 justify-content-center mt-2">
            <a routerLink="/sellers/status" class="btn btn-outline">Consultar estado</a>
            <a routerLink="/home" class="btn btn-primary">Volver al inicio</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-page { min-height: 100vh; padding: calc(var(--spacing-navbar) + 2rem) 1.5rem 3rem; background: var(--color-bg); }
    .form-page__wrapper { max-width: 720px; margin: 0 auto; }
    .form-page__header { margin-bottom: 2rem; }
    .form-page__back { margin-bottom: 1rem; a { color: var(--text-muted); font-size: 0.875rem; } }
    .form-page__title { font-family: var(--font-display); font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; }
    .form-page__sub { color: var(--text-secondary); }
    .section-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--color-navy); padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-orange); margin-bottom: 1.25rem; }
    .docs-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .doc-chip { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.875rem; background: var(--color-bg); border-radius: var(--radius-sm); font-size: 0.9375rem; }
    .success-panel { text-align: center; padding: 3rem; }
    .success-icon { font-size: 4rem; margin-bottom: 1rem; }
    h2 { font-family: var(--font-display); font-size: 1.625rem; margin-bottom: 0.75rem; }
    .application-id-box { background: var(--color-bg); border-radius: var(--radius-md); padding: 1.25rem; margin: 1.5rem 0; }
    .application-id { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--color-orange); letter-spacing: 0.05em; }
  `]
})
export class SellerRegisterComponent {
  form: FormGroup;
  loading = false;
  submitted = false;
  submitted2 = false;
  errorMsg = '';
  applicationId = '';

  defaultDocs = ['Fotocopia cédula', 'RUT', 'Cámara de comercio'];

  constructor(private fb: FormBuilder, private sellerSvc: SellerService) {
    this.form = this.fb.group({
      nombres:       ['', Validators.required],
      apellidos:     ['', Validators.required],
      identificacion:['', Validators.required],
      tipoPersona:   ['NATURAL', Validators.required],
      correo:        ['', [Validators.required, Validators.email]],
      pais:          ['Colombia', Validators.required],
      ciudad:        ['', Validators.required],
      telefono:      ['', Validators.required],
    });
  }

  submit(): void {
    this.submitted2 = true;
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    this.sellerSvc.apply({ ...this.form.value, documentos: this.defaultDocs }).subscribe({
      next: res => {
        this.loading = false;
        this.applicationId = res.applicationId;
        this.submitted = true;
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err.error?.message ?? 'Error al enviar la solicitud. Intenta de nuevo.';
      }
    });
  }
}
