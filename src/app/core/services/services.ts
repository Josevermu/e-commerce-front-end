// ============================================================
// KONRAD — Servicios HTTP adicionales
// product.service | order.service | payment.service |
// buyer.service   | bam.service
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Product, ProductSearchParams,
  Cart, CartItem, Order, RatingRequest,
  PaymentRequest, PaymentResponse,
  BuyerRegistrationRequest, BuyerRegistrationResponse,
  BuyerProfileResponse, BuyerUpdateRequest,
  DashboardResponse, TopProductResponse, TopCategoryResponse,
  SubscriptionTrendResponse, AuditEntry
} from '../models';
import { environment } from '../../../environments/environment';

// ─────────────────────────────────────────────────────────────
// ProductService
// ─────────────────────────────────────────────────────────────

/**
 * ProductService — Gestión del catálogo de productos.
 *
 * Endpoints públicos (sin JWT):
 *   GET /products/search?...   → búsqueda con filtros
 *   GET /products/{id}         → detalle de producto
 *
 * Endpoints privados (SELLER):
 *   POST   /products           → publicar producto
 *   PUT    /products/{id}      → actualizar
 *   DELETE /products/{id}      → desactivar
 *   GET    /products/seller/{id} → mis productos
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly BASE = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) {}

  /** Búsqueda pública con filtros (punto 8 del backend) */
  search(params?: ProductSearchParams): Observable<Product[]> {
    let p = new HttpParams();
    if (params?.nombre)       p = p.set('nombre', params.nombre);
    if (params?.categoria)    p = p.set('categoria', params.categoria);
    if (params?.subcategoria) p = p.set('subcategoria', params.subcategoria);
    if (params?.precioMin)    p = p.set('precioMin', params.precioMin.toString());
    if (params?.precioMax)    p = p.set('precioMax', params.precioMax.toString());
    if (params?.palabra)      p = p.set('palabra', params.palabra);
    return this.http.get<Product[]>(`${this.BASE}/search`, { params: p });
  }

  /** Detalle de un producto */
  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.BASE}/${id}`);
  }

  /** Publicar un nuevo producto (SELLER) */
  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.BASE, product);
  }

  /** Actualizar producto existente (SELLER) */
  update(id: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.BASE}/${id}`, product);
  }

  /** Desactivar producto (SELLER) */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  /** Productos del vendedor autenticado */
  getBySeller(sellerId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.BASE}/seller/${sellerId}`);
  }

  /** Alias para SellerDashboardComponent */
  getProductsBySeller(sellerId: string): Observable<Product[]> { return this.getBySeller(sellerId); }
}

// ─────────────────────────────────────────────────────────────
// OrderService
// ─────────────────────────────────────────────────────────────

/**
 * OrderService — Carrito de compras y órdenes.
 *
 * Flujo: ver carrito → agregar ítems → elegir entrega → pagar → checkout
 *
 * Endpoints (todos requieren JWT BUYER):
 *   GET  /cart/{buyerId}           → ver carrito
 *   POST /cart/{buyerId}/items     → agregar producto
 *   PUT  /cart/{buyerId}/delivery  → elegir entrega o domicilio
 *   POST /orders/checkout/{buyerId}?paymentId= → confirmar orden
 *   POST /orders/{orderId}/rating  → calificar transacción 1-10
 *   GET  /orders/{id}              → detalle de orden
 *   GET  /orders/buyer/{buyerId}   → historial del comprador
 *   GET  /orders/seller/{sellerId} → ventas del vendedor
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly BASE = `${environment.apiUrl}`;
  constructor(private http: HttpClient) {}

  getCart(buyerId: string): Observable<Cart> {
    return this.http.get<Cart>(`${this.BASE}/cart/${buyerId}`);
  }

  addItem(buyerId: string, item: CartItem): Observable<Cart> {
    return this.http.post<Cart>(`${this.BASE}/cart/${buyerId}/items`, item);
  }

  setDelivery(buyerId: string, domicilio: boolean, ciudad?: string): Observable<Cart> {
    let p = new HttpParams().set('domicilio', domicilio.toString());
    if (ciudad) p = p.set('ciudad', ciudad);
    return this.http.put<Cart>(`${this.BASE}/cart/${buyerId}/delivery`, null, { params: p });
  }

  checkout(buyerId: string, paymentId: string): Observable<Order> {
    return this.http.post<Order>(
      `${this.BASE}/orders/checkout/${buyerId}`,
      null,
      { params: { paymentId } }
    );
  }

  rate(orderId: string, req: RatingRequest): Observable<Order> {
    return this.http.post<Order>(`${this.BASE}/orders/${orderId}/rating`, req);
  }

  getById(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.BASE}/orders/${orderId}`);
  }

  getByBuyer(buyerId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.BASE}/orders/buyer/${buyerId}`);
  }

  getBySeller(sellerId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.BASE}/orders/seller/${sellerId}`);
  }

  // ── Aliases de nombrado para componentes ───────────────────
  getOrdersByBuyer(buyerId: string)   { return this.getByBuyer(buyerId); }
  getOrdersBySeller(sellerId: string) { return this.getBySeller(sellerId); }

  /** Calificar pedido entregado — POST /orders/{orderId}/rating */
  rateOrder(orderId: string, req: { calificacion: number; comentario?: string }): Observable<Order> {
    return this.http.post<Order>(`${this.BASE}/orders/${orderId}/rating`, req);
  }
}

// ─────────────────────────────────────────────────────────────
// PaymentService
// ─────────────────────────────────────────────────────────────

/**
 * PaymentService — Procesamiento de pagos multi-método.
 *
 * El backend usa Patrón Strategy: selecciona PSE, Tarjeta o Consignación
 * automáticamente según el campo "metodoPago" del request.
 *
 * Endpoints (requieren JWT):
 *   POST /payments/process         → procesar pago
 *   GET  /payments/entity/{id}     → historial por entidad (orden/suscripción)
 *   GET  /payments                 → todos los pagos (ADMIN/DIRECTOR)
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly BASE = `${environment.apiUrl}/payments`;
  constructor(private http: HttpClient) {}

  /** Procesar pago — el campo metodoPago decide la estrategia */
  process(req: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.BASE}/process`, req);
  }

  /** Historial de pagos para una orden o suscripción */
  getByEntity(entityId: string): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.BASE}/entity/${entityId}`);
  }

  /** Todos los pagos — solo ADMIN o DIRECTOR */
  getAll(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(this.BASE);
  }
}

// ─────────────────────────────────────────────────────────────
// BuyerService
// ─────────────────────────────────────────────────────────────

/**
 * BuyerService — Registro y gestión del perfil del comprador.
 *
 * Endpoint público:
 *   POST /buyers/register  → registro sin autenticación previa
 *
 * Endpoints privados:
 *   GET    /buyers/{id}             → perfil propio o ADMIN
 *   PATCH  /buyers/{id}             → actualizar ciudad/dirección/teléfono/RRSS
 *   DELETE /buyers/{id}             → desactivar cuenta
 *   GET    /buyers/by-email?email=  → buscar por correo (ADMIN)
 *   GET    /buyers                  → todos los compradores (ADMIN)
 */
@Injectable({ providedIn: 'root' })
export class BuyerService {
  private readonly BASE = `${environment.apiUrl}/buyers`;
  constructor(private http: HttpClient) {}

  /** Registro público de comprador (sin JWT) */
  register(req: BuyerRegistrationRequest): Observable<BuyerRegistrationResponse> {
    return this.http.post<BuyerRegistrationResponse>(`${this.BASE}/register`, req);
  }

  getById(id: string): Observable<BuyerProfileResponse> {
    return this.http.get<BuyerProfileResponse>(`${this.BASE}/${id}`);
  }

  getByEmail(email: string): Observable<BuyerProfileResponse> {
    return this.http.get<BuyerProfileResponse>(`${this.BASE}/by-email`, { params: { email } });
  }

  getAll(): Observable<BuyerProfileResponse[]> {
    return this.http.get<BuyerProfileResponse[]>(this.BASE);
  }

  update(id: string, req: BuyerUpdateRequest): Observable<BuyerProfileResponse> {
    return this.http.patch<BuyerProfileResponse>(`${this.BASE}/${id}`, req);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  /** Alias para el ProfileComponent que usa delete() */
  delete(id: string): Observable<void> { return this.deactivate(id); }
}

// ─────────────────────────────────────────────────────────────
// BamService
// ─────────────────────────────────────────────────────────────

/**
 * BamService — Business Activity Monitoring.
 * Tablero del Director Comercial con KPIs y auditoría.
 *
 * Todos los endpoints requieren rol DIRECTOR o ADMIN.
 *
 * Endpoints:
 *   GET  /bam/dashboard             → tablero completo (KPIs + resumen)
 *   GET  /bam/kpi/top-product       → producto más vendido del mes
 *   GET  /bam/kpi/top-category      → categoría más consultada de la semana
 *   GET  /bam/kpi/subscriptions     → tendencia suscripciones por semestre
 *   GET  /bam/audit                 → log completo de auditoría
 *   GET  /bam/audit/by-user         → auditoría filtrada por usuario
 *   GET  /bam/audit/by-entity       → auditoría filtrada por entidad
 */
@Injectable({ providedIn: 'root' })
export class BamService {
  private readonly BASE = `${environment.apiUrl}/bam`;
  constructor(private http: HttpClient) {}

  /** Tablero completo con todos los KPIs y resumen general */
  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.BASE}/dashboard`);
  }

  getTopProduct(): Observable<TopProductResponse> {
    return this.http.get<TopProductResponse>(`${this.BASE}/kpi/top-product`);
  }

  getTopCategory(): Observable<TopCategoryResponse> {
    return this.http.get<TopCategoryResponse>(`${this.BASE}/kpi/top-category`);
  }

  getSubscriptionTrend(): Observable<SubscriptionTrendResponse[]> {
    return this.http.get<SubscriptionTrendResponse[]>(`${this.BASE}/kpi/subscriptions`);
  }

  /** Log completo de auditoría */
  getAuditLog(): Observable<AuditEntry[]> {
    return this.http.get<AuditEntry[]>(`${this.BASE}/audit`);
  }

  /** Auditoría filtrada por usuario */
  getAuditByUser(usuario: string): Observable<AuditEntry[]> {
    return this.http.get<AuditEntry[]>(`${this.BASE}/audit/by-user`, { params: { usuario } });
  }

  /** Auditoría filtrada por entidad (ORDER, SELLER, PRODUCT, BUYER) */
  getAuditByEntity(entidad: string): Observable<AuditEntry[]> {
    return this.http.get<AuditEntry[]>(`${this.BASE}/audit/by-entity`, { params: { entidad } });
  }

  /** Alias corto usado por AdminAuditComponent */
  getAudit(): Observable<AuditEntry[]> { return this.getAuditLog(); }
}
