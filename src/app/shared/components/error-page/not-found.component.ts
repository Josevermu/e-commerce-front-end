import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * NotFoundComponent — Página 404
 *
 * Wildcard route (**) la captura cuando ninguna otra ruta coincide.
 */
@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-not-found',
  template: `
    <div class="error-page">
      <div class="error-card">
        <div class="error-icon">🔍</div>
        <h1 class="error-code">404</h1>
        <h2 class="error-title">Página no encontrada</h2>
        <p class="error-desc">
          La URL que buscas no existe o fue movida.
        </p>
        <div class="error-actions">
          <a routerLink="/products" class="btn btn-primary">
            Ir al catálogo
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-page, #F5F6FA);
      padding: 2rem;
    }
    .error-card {
      text-align: center;
      background: #fff;
      border-radius: 16px;
      padding: 3rem 2.5rem;
      box-shadow: 0 4px 24px rgba(0,0,0,.08);
      max-width: 400px;
      width: 100%;
    }
    .error-icon  { font-size: 3.5rem; margin-bottom: .5rem; }
    .error-code  { font-size: 4rem; font-weight: 800; color: var(--primary, #0D1B2A); margin: 0; }
    .error-title { font-size: 1.4rem; font-weight: 700; margin: .5rem 0 1rem; color: var(--primary, #0D1B2A); }
    .error-desc  { color: #6b7280; line-height: 1.6; margin-bottom: 2rem; }
  `]
})
export class NotFoundComponent {}
