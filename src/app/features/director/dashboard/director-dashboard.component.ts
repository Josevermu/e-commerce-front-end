import { Component, OnInit } from '@angular/core';
import { BamService } from '../../../core/services/services';
import { DashboardResponse, SubscriptionTrendResponse } from '../../../core/models';

/**
 * DirectorDashboardComponent — Tablero BAM del Director Comercial.
 *
 * Consume GET /bam/dashboard que retorna los 3 KPIs + resumen general:
 *   KPI 1: Producto con mayor venta del último mes
 *   KPI 2: Categoría con más consultas de la última semana
 *   KPI 3: Tendencia de suscripciones por semestre
 *
 * Ruta: /director/dashboard
 * Rol:  DIRECTOR | ADMIN
 */
@Component({
  selector: 'app-director-dashboard',
  template: `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Tablero BAM</h1>
          <p class="page-header__sub">Business Activity Monitoring — actualizado {{ dashboard?.generadoEn | date:'HH:mm' }}</p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn-outline btn-sm" (click)="loadDashboard()">
            🔄 Actualizar
          </button>
          <a routerLink="/director/applications" class="btn btn-primary btn-sm">
            📋 Ver solicitudes
          </a>
        </div>
      </div>

      <!-- Skeleton cargando -->
      <ng-container *ngIf="loading">
        <div class="grid-kpi">
          <div *ngFor="let _ of [1,2,3,4]" class="skeleton skeleton-rect" style="height:120px; border-radius:20px;"></div>
        </div>
      </ng-container>

      <!-- Contenido cargado -->
      <ng-container *ngIf="!loading && dashboard">
        <!-- KPIs resumen general -->
        <div class="grid-kpi">
          <div class="kpi-card">
            <div class="kpi-label">Vendedores activos</div>
            <div class="kpi-value">{{ dashboard!.resumenGeneral.totalVendedoresActivos }}</div>
            <div class="kpi-sub">En la plataforma</div>
            <div class="kpi-icon">🏪</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Compradores registrados</div>
            <div class="kpi-value">{{ dashboard!.resumenGeneral.totalCompradoresRegistrados }}</div>
            <div class="kpi-sub">Total acumulado</div>
            <div class="kpi-icon">👤</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Órdenes último mes</div>
            <div class="kpi-value">{{ dashboard!.resumenGeneral.ordenesUltimoMes }}</div>
            <div class="kpi-sub">Conversión: {{ dashboard!.resumenGeneral.tasaConversionCarrito }}</div>
            <div class="kpi-icon">📦</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ingreso último mes</div>
            <div class="kpi-value">{{ dashboard!.resumenGeneral.ingresoUltimoMesCOP | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
            <div class="kpi-sub">Calificación: ⭐ {{ dashboard!.resumenGeneral.calificacionPromedioPlataforma }}/10</div>
            <div class="kpi-icon">💰</div>
          </div>
        </div>

        <!-- KPIs principales -->
        <div class="grid-2 mb-3">
          <!-- KPI 1: Producto top -->
          <div class="card card--elevated">
            <div class="card-header">
              <span class="card-title">🏆 Producto más vendido</span>
              <span class="badge badge-orange">{{ dashboard!.productoMasVendido.periodo }}</span>
            </div>
            <div class="bam-product">
              <div class="bam-product__name">{{ dashboard!.productoMasVendido.nombre }}</div>
              <div class="bam-product__category">
                <span class="badge badge-info">{{ dashboard!.productoMasVendido.categoria }}</span>
              </div>
              <div class="bam-product__stats">
                <div class="bam-stat">
                  <div class="bam-stat__val">{{ dashboard!.productoMasVendido.unidadesVendidas }}</div>
                  <div class="bam-stat__lbl">unidades vendidas</div>
                </div>
                <div class="bam-stat">
                  <div class="bam-stat__val">{{ dashboard!.productoMasVendido.ingresoTotal | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
                  <div class="bam-stat__lbl">ingreso total</div>
                </div>
              </div>
            </div>
          </div>

          <!-- KPI 2: Categoría top -->
          <div class="card card--elevated">
            <div class="card-header">
              <span class="card-title">🔍 Categoría más consultada</span>
              <span class="badge badge-info">{{ dashboard!.categoriaMasConsultada.periodo }}</span>
            </div>
            <div class="bam-product">
              <div class="bam-product__name">{{ dashboard!.categoriaMasConsultada.categoria }}</div>
              <div class="bam-product__stats">
                <div class="bam-stat">
                  <div class="bam-stat__val">{{ dashboard!.categoriaMasConsultada.totalConsultas | number }}</div>
                  <div class="bam-stat__lbl">búsquedas</div>
                </div>
              </div>
              <div class="bam-highlights">
                <p class="text-sm text-muted mb-1">Productos destacados:</p>
                <div class="flex gap-1" style="flex-wrap:wrap;">
                  <span
                    *ngFor="let p of dashboard!.categoriaMasConsultada.productosDestacados"
                    class="badge badge-gray"
                  >{{ p }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- KPI 3: Suscripciones por semestre -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📈 Tendencia de suscripciones por semestre</span>
          </div>
          <div class="table-container">
            <table class="konrad-table">
              <thead>
                <tr>
                  <th>Semestre</th>
                  <th>Nuevas</th>
                  <th>Cancelaciones</th>
                  <th>En mora</th>
                  <th>Activas</th>
                  <th>Tasa retención</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of dashboard!.tendenciaSuscripciones">
                  <td><strong>{{ row.semestre }}</strong></td>
                  <td><span class="badge badge-success">+{{ row.nuevasSuscripciones }}</span></td>
                  <td><span class="badge badge-danger">-{{ row.cancelaciones }}</span></td>
                  <td><span class="badge badge-warning">{{ row.enMora }}</span></td>
                  <td><strong>{{ row.activas }}</strong></td>
                  <td>
                    <div class="retention-bar">
                      <div class="retention-bar__fill" [style.width.%]="row.tasaRetencion"></div>
                      <span>{{ row.tasaRetencion }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .bam-product__name { font-family: var(--font-display); font-size: 1.375rem; font-weight: 700; margin-bottom: 0.75rem; }
    .bam-product__category { margin-bottom: 1rem; }
    .bam-product__stats { display: flex; gap: 2rem; margin-bottom: 1rem; }
    .bam-stat__val { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--color-orange); }
    .bam-stat__lbl { font-size: 0.8125rem; color: var(--text-muted); }
    .bam-highlights { padding-top: 0.75rem; border-top: 1px solid var(--color-border); }

    .retention-bar {
      display: flex; align-items: center; gap: 0.625rem;
      background: var(--color-bg); border-radius: var(--radius-full);
      height: 24px; padding: 0 0.5rem; position: relative; overflow: hidden;
      min-width: 120px;
    }
    .retention-bar__fill {
      position: absolute; left: 0; top: 0; bottom: 0;
      background: linear-gradient(90deg, var(--color-orange), var(--color-orange-light));
      border-radius: var(--radius-full); opacity: 0.2; transition: width 0.5s ease;
    }
    .retention-bar span { position: relative; font-size: 0.875rem; font-weight: 600; }
  `]
})
export class DirectorDashboardComponent implements OnInit {
  dashboard: DashboardResponse | null = null;
  loading = true;

  constructor(private bam: BamService) {}

  ngOnInit(): void { this.loadDashboard(); }

  loadDashboard(): void {
    this.loading = true;
    this.bam.getDashboard().subscribe({
      next: d => { this.dashboard = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}