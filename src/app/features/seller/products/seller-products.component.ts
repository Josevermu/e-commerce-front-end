import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/services';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models';

/**
 * SellerProductsComponent — Gestión de productos del vendedor.
 *
 * Permite al vendedor:
 *   - Ver sus productos (GET /products/seller/{sellerId})
 *   - Publicar nuevo producto (POST /products)
 *   - Editar producto (PUT /products/{id})
 *   - Desactivar producto (DELETE /products/{id})
 *
 * Ruta: /seller/products
 * Rol:  SELLER
 */
@Component({
  selector: 'app-seller-products',
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Mis Productos</h1>
          <p class="page-header__sub">{{ products.length }} producto(s) publicados</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">+ Publicar producto</button>
      </div>

      <!-- Skeleton -->
      <div class="product-grid" *ngIf="loading">
        <div *ngFor="let _ of [1,2,3,4]" class="skeleton skeleton-rect" style="height:240px; border-radius:20px;"></div>
      </div>

      <!-- Grid de productos del vendedor -->
      <div class="product-grid" *ngIf="!loading">
        <div *ngFor="let p of products" class="product-card">
          <div class="product-card__image">
            <span style="font-size:2.5rem;">{{ getEmoji(p.categoria) }}</span>
            <div class="product-card__badges">
              <span class="badge badge-success" *ngIf="p.activo !== false">Activo</span>
              <span class="badge badge-danger" *ngIf="p.activo === false">Inactivo</span>
              <span class="badge badge-warning" *ngIf="p.aplicaIVA">IVA</span>
            </div>
          </div>
          <div class="product-card__body">
            <div class="product-card__category">{{ p.categoria }}</div>
            <div class="product-card__name">{{ p.nombre }}</div>
            <div class="product-card__price">{{ p.precio | currency:'COP':'$':'1.0-0' }}</div>
            <div class="product-card__stock text-sm text-muted">Stock: {{ p.stock }} unidades</div>
            <div class="product-card__actions">
              <button class="btn btn-ghost btn-sm" (click)="editProduct(p)">✏️ Editar</button>
              <button class="btn btn-ghost btn-sm" style="color:var(--color-danger)" (click)="deleteProduct(p.id!)">🗑 Eliminar</button>
            </div>
          </div>
        </div>

        <div *ngIf="products.length === 0" class="empty-state">
          <div style="font-size:3rem; margin-bottom:1rem;">📦</div>
          <h3>Aún no tienes productos publicados</h3>
          <p class="text-muted">Comienza publicando tu primer producto para que los compradores puedan encontrarlo.</p>
          <button class="btn btn-primary mt-2" (click)="openModal()">+ Publicar mi primer producto</button>
        </div>
      </div>

      <!-- Modal crear/editar producto -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <form class="modal-box modal-box--wide" (click)="$event.stopPropagation()" [formGroup]="productForm">
          <h3 class="modal-title">{{ editMode ? 'Editar' : 'Publicar' }} producto</h3>

          <div class="form-row">
            <div class="form-group">
              <label>Nombre del producto *</label>
              <input class="form-control" formControlName="nombre" />
            </div>
            <div class="form-group">
              <label>Categoría *</label>
              <select class="form-control" formControlName="categoria">
                <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Descripción *</label>
            <textarea class="form-control" formControlName="descripcion" rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Precio (COP) *</label>
              <input type="number" class="form-control" formControlName="precio" />
            </div>
            <div class="form-group">
              <label>Stock disponible *</label>
              <input type="number" class="form-control" formControlName="stock" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Peso (kg)</label>
              <input type="number" class="form-control" formControlName="peso" step="0.1" />
            </div>
            <div class="form-group">
              <label>Subcategoría</label>
              <input class="form-control" formControlName="subcategoria" />
            </div>
          </div>

          <div class="form-group">
            <label class="flex items-center gap-1" style="cursor:pointer;">
              <input type="checkbox" formControlName="aplicaIVA" />
              <span>El producto aplica IVA</span>
            </label>
          </div>

          <div *ngIf="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>

          <div class="modal-actions">
            <button class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveProduct()" [disabled]="saving">
              <span *ngIf="!saving">{{ editMode ? 'Guardar cambios' : 'Publicar producto' }}</span>
              <span *ngIf="saving"><span class="spinner"></span> Guardando...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .product-card__image { position: relative; display: flex; align-items: center; justify-content: center; }
    .product-card__badges { position: absolute; top: 0.5rem; left: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .product-card__stock { margin-top: 0.25rem; }
    .product-card__actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border); }
    .empty-state { grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--color-surface); border-radius: var(--radius-lg); border: 2px dashed var(--color-border); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(13,27,42,0.6); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
    .modal-box { background: var(--color-surface); border-radius: var(--radius-xl); padding: 2rem; width: 100%; max-width: 560px; box-shadow: var(--shadow-xl); max-height: 90vh; overflow-y: auto; &--wide { max-width: 680px; } }
    .modal-title { font-family: var(--font-display); font-size: 1.375rem; font-weight: 700; margin-bottom: 1.5rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
  `]
})
export class SellerProductsComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  showModal = false;
  editMode = false;
  saving = false;
  errorMsg = '';
  editingId: string | null = null;
  productForm: FormGroup;

  categories = ['Ropa', 'Electrónica', 'Hogar', 'Deportes', 'Belleza', 'Libros', 'Alimentos', 'Juguetes', 'Otros'];

  constructor(
    private productSvc: ProductService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {
    this.productForm = this.fb.group({
      nombre:       ['', Validators.required],
      descripcion:  ['', Validators.required],
      categoria:    ['Electrónica', Validators.required],
      subcategoria: [''],
      precio:       [0, [Validators.required, Validators.min(1)]],
      stock:        [1, [Validators.required, Validators.min(0)]],
      peso:         [0.5],
      aplicaIVA:    [false],
    });
  }

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(): void {
    this.loading = true;
    this.productSvc.getBySeller(this.auth.getRelatedEntityId()).subscribe({
      next: p => { this.products = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openModal(): void { this.editMode = false; this.editingId = null; this.productForm.reset({ categoria: 'Electrónica', stock: 1, precio: 0, peso: 0.5, aplicaIVA: false }); this.showModal = true; }
  closeModal(): void { this.showModal = false; this.errorMsg = ''; }

  editProduct(p: Product): void {
    this.editMode = true;
    this.editingId = p.id!;
    this.productForm.patchValue(p);
    this.showModal = true;
  }

  saveProduct(): void {
    if (this.productForm.invalid) return;
    this.saving = true;
    this.errorMsg = '';

    const data: Product = {
      ...this.productForm.value,
      sellerId: this.auth.getRelatedEntityId()
    };

    const obs = this.editMode
      ? this.productSvc.update(this.editingId!, data)
      : this.productSvc.create(data);

    obs.subscribe({
      next: () => { this.saving = false; this.closeModal(); this.loadProducts(); },
      error: err => { this.saving = false; this.errorMsg = err.error?.message ?? 'Error al guardar el producto.'; }
    });
  }

  deleteProduct(id: string): void {
    if (!confirm('¿Seguro que deseas desactivar este producto?')) return;
    this.productSvc.delete(id).subscribe(() => this.loadProducts());
  }

  getEmoji(cat?: string): string {
    const map: Record<string, string> = { Electrónica: '💻', Ropa: '👕', Hogar: '🏠', Deportes: '⚽', Belleza: '💄', Libros: '📚', Alimentos: '🍎', Juguetes: '🧸' };
    return map[cat ?? ''] ?? '📦';
  }
}