import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { AuthState } from './core/models';

@Component({
  selector: 'app-root',
  template: `
    <ng-container *ngIf="!isLoggedIn; else authenticated">
      <!-- Layout público sin navbar -->
      <router-outlet></router-outlet>
    </ng-container>

    <ng-template #authenticated>
      <!-- Layout autenticado: navbar siempre visible -->
      <div class="app-shell">
        <app-navbar [authState]="authState"></app-navbar>
        <div class="app-body">
          <app-sidebar [authState]="authState"></app-sidebar>
          <main class="app-main">
            <div class="page-container">
              <router-outlet></router-outlet>
            </div>
          </main>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .app-shell  { display: flex; flex-direction: column; min-height: 100vh; }
    .app-body   { display: flex; flex: 1; overflow: hidden; }
    .app-main   { flex: 1; overflow-y: auto; background: #F5F6FA; }
    .page-container { padding: 2rem; max-width: 1280px; margin: 0 auto; }
    @media (max-width: 768px) { .page-container { padding: 1rem; } }
  `],
})
export class AppComponent implements OnInit {
  authState: Partial<AuthState> = {};
  isLoggedIn = false;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    // Verificar estado inicial
    this.isLoggedIn = this.auth.isLoggedIn();
    this.authState  = this.auth.currentState;

    // Actualizar en cada navegación
    this.router.events.pipe(
      filter((e: Event): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.isLoggedIn = this.auth.isLoggedIn();
      this.authState  = this.auth.currentState;
    });
  }
}