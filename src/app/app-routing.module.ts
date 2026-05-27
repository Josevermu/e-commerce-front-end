import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from './core/interceptors/jwt.interceptor';

const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/feature-modules').then(m => m.AuthModule),
  },
  {
    path: '',
    loadChildren: () => import('./features/feature-modules').then(m => m.PublicModule),
  },
  {
    path: 'buyer',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['BUYER'] },
    loadChildren: () => import('./features/feature-modules').then(m => m.BuyerModule),
  },
  {
    path: 'seller',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SELLER'] },
    loadChildren: () => import('./features/feature-modules').then(m => m.SellerModule),
  },
  {
    path: 'director',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['DIRECTOR', 'ADMIN'] },
    loadChildren: () => import('./features/feature-modules').then(m => m.DirectorModule),
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () => import('./features/feature-modules').then(m => m.AdminModule),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./shared/components/error-page/forbidden.component').then(c => c.ForbiddenComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/error-page/not-found.component').then(c => c.NotFoundComponent),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}