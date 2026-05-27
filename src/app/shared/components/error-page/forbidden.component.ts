import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-forbidden',
  template: `
    <div class="error-page">
      <div class="error-card">
        <div class="error-icon">🚫</div>
        <h1 class="error-code">403</h1>
        <h2 class="error-title">Acceso denegado</h2>
        <p class="error-desc">No tienes permisos para acceder a esta sección.</p>
        <button class="btn btn-primary" (click)="goHome()">Ir a mi dashboard</button>
      </div>
    </div>
  `,
  styles: [`
    .error-page { min-height:100vh; display:flex; align-items:center;
      justify-content:center; background:#F5F6FA; padding:2rem; }
    .error-card { text-align:center; background:#fff; border-radius:16px;
      padding:3rem 2.5rem; box-shadow:0 4px 24px rgba(0,0,0,.08); max-width:400px; width:100%; }
    .error-icon  { font-size:3.5rem; margin-bottom:.5rem; }
    .error-code  { font-size:4rem; font-weight:800; color:#0D1B2A; margin:0; }
    .error-title { font-size:1.4rem; font-weight:700; margin:.5rem 0 1rem; color:#0D1B2A; }
    .error-desc  { color:#6b7280; line-height:1.6; margin-bottom:2rem; }
    .btn { padding:.65rem 1.5rem; border-radius:10px; border:none; cursor:pointer;
      font-weight:600; font-size:.95rem; }
    .btn-primary { background:#F4623A; color:#fff; }
  `]
})
export class ForbiddenComponent {
  constructor(private auth: AuthService, private router: Router) {}
  goHome(): void { this.auth.redirectByRole(); }
}