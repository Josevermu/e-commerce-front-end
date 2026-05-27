import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SellerRegistrationRequest, ApplicationSubmittedResponse,
  ApplicationDetailResponse, ApplicationSummaryResponse,
  ApplicationDecisionRequest, SubscriptionRequest
} from '../models';
import { environment } from '../../../environments/environment';

/**
 * SellerService — Gestión de solicitudes de vendedores.
 *
 * Endpoints públicos (sin JWT):
 *   POST /sellers/apply        → enviar solicitud de registro
 *   GET  /sellers/status?q=   → consultar estado por ID o identificación
 *
 * Endpoints privados (requieren JWT):
 *   GET  /sellers/applications            → listado con filtros (DIRECTOR)
 *   GET  /sellers/applications/{id}       → detalle (DIRECTOR)
 *   POST /sellers/applications/{id}/decision → aprobar/rechazar/devolver (DIRECTOR)
 *   POST /sellers/{id}/rating             → calificar vendedor (BUYER vía order)
 *   POST /sellers/{id}/activate           → activar suscripción (SELLER)
 */
@Injectable({ providedIn: 'root' })
export class SellerService {

  private readonly BASE = `${environment.apiUrl}/sellers`;

  constructor(private http: HttpClient) {}

  // ── Rutas públicas ──────────────────────────────────────────

  /**
   * Enviar solicitud de registro de vendedor.
   * No requiere autenticación.
   */
  apply(req: SellerRegistrationRequest): Observable<ApplicationSubmittedResponse> {
    return this.http.post<ApplicationSubmittedResponse>(`${this.BASE}/apply`, req);
  }

  /**
   * Consultar estado de una solicitud por número de solicitud o identificación.
   * No requiere autenticación.
   */
  checkStatus(q: string): Observable<ApplicationDetailResponse> {
    return this.http.get<ApplicationDetailResponse>(`${this.BASE}/status`, {
      params: { q }
    });
  }

  // ── Rutas del Director Comercial ─────────────────────────────

  /**
   * Listar solicitudes con filtros opcionales.
   * GET /sellers/applications?identificacion=&status=&desde=&hasta=
   */
  getApplications(filters?: {
    identificacion?: string;
    status?: string;
    desde?: string;
    hasta?: string;
  }): Observable<ApplicationSummaryResponse[]> {
    let params = new HttpParams();
    if (filters?.identificacion) params = params.set('identificacion', filters.identificacion);
    if (filters?.status)         params = params.set('status', filters.status);
    if (filters?.desde)          params = params.set('desde', filters.desde);
    if (filters?.hasta)          params = params.set('hasta', filters.hasta);
    return this.http.get<ApplicationSummaryResponse[]>(`${this.BASE}/applications`, { params });
  }

  /**
   * Obtener detalle completo de una solicitud.
   * GET /sellers/applications/{id}
   */
  getApplicationById(id: string): Observable<ApplicationDetailResponse> {
    return this.http.get<ApplicationDetailResponse>(`${this.BASE}/applications/${id}`);
  }

  /**
   * Registrar decisión del Director: APROBADA | RECHAZADA | DEVUELTA.
   * POST /sellers/applications/{id}/decision
   */
  decide(id: string, req: ApplicationDecisionRequest): Observable<ApplicationDetailResponse> {
    return this.http.post<ApplicationDetailResponse>(
      `${this.BASE}/applications/${id}/decision`, req
    );
  }

  // ── Rutas de vendedor ────────────────────────────────────────

  /**
   * Activar suscripción del vendedor tras realizar el pago.
   * POST /sellers/{id}/activate
   */
  activateSubscription(sellerId: string, req: SubscriptionRequest): Observable<void> {
    return this.http.post<void>(`${this.BASE}/${sellerId}/activate`, req);
  }

  /** Alias sin parámetro de body — SellerActivationComponent procesa el pago antes de llamar esto */
  activate(sellerId: string): Observable<void> {
    return this.http.post<void>(`${this.BASE}/${sellerId}/activate`, {});
  }

  /**
   * Actualizar calificación de un vendedor.
   * POST /sellers/{id}/rating?rating={n}
   */
  rateVendor(sellerId: string, rating: number): Observable<void> {
    return this.http.post<void>(`${this.BASE}/${sellerId}/rating`, null, {
      params: { rating: rating.toString() }
    });
  }
}
