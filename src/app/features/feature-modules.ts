import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule }       from '../shared/shared.module';

// ─── AUTH ────────────────────────────────────────────────────
import { LoginComponent } from './auth/login/login.component';
const authRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
@NgModule({
  declarations: [LoginComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(authRoutes), SharedModule],
})
export class AuthModule {}

// ─── PUBLIC ──────────────────────────────────────────────────
import { CatalogComponent, SellerRegisterComponent } from './public/catalog/catalog.component';
import { BuyerRegisterComponent } from './buyer/register/buyer-register.component';
const publicRoutes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products',        component: CatalogComponent },
  { path: 'sellers/apply',   component: SellerRegisterComponent },
  { path: 'buyers/register', component: BuyerRegisterComponent },
];
@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    RouterModule.forChild(publicRoutes), SharedModule,
    BuyerRegisterComponent,
  ],
  declarations: [CatalogComponent, SellerRegisterComponent],
})
export class PublicModule {}

// ─── BUYER ───────────────────────────────────────────────────
import { BuyerDashboardComponent } from './buyer/dashboard/buyer-dashboard.component';
import { CartComponent, CheckoutComponent } from './buyer/cart/cart.component';
import { BuyerOrdersComponent } from './buyer/orders/buyer-orders.component';
import { BuyerProfileComponent } from './buyer/profile/buyer-profile.component';
const buyerRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: BuyerDashboardComponent },
  { path: 'cart',      component: CartComponent },
  { path: 'checkout',  component: CheckoutComponent },
  { path: 'orders',    component: BuyerOrdersComponent },
  { path: 'profile',   component: BuyerProfileComponent },
];
@NgModule({
  declarations: [BuyerDashboardComponent, CartComponent, CheckoutComponent, BuyerOrdersComponent, BuyerProfileComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(buyerRoutes), SharedModule],
})
export class BuyerModule {}

// ─── SELLER ──────────────────────────────────────────────────
import { SellerDashboardComponent } from './seller/dashboard/seller-dashboard.component';
import { SellerProductsComponent }  from './seller/products/seller-products.component';
import { SellerOrdersComponent, SellerActivationComponent } from './seller/orders/seller-orders.component';
const sellerRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: SellerDashboardComponent },
  { path: 'products',  component: SellerProductsComponent },
  { path: 'orders',    component: SellerOrdersComponent },
];
@NgModule({
  declarations: [SellerDashboardComponent, SellerProductsComponent, SellerOrdersComponent, SellerActivationComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(sellerRoutes), SharedModule],
})
export class SellerModule {}

// ─── DIRECTOR ────────────────────────────────────────────────
import { DirectorDashboardComponent } from './director/dashboard/director-dashboard.component';
import { ApplicationsListComponent }  from './director/applications/applications.component';
import { ApplicationDetailComponent } from './director/applications/applications.component';
const directorRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',        component: DirectorDashboardComponent },
  { path: 'applications',     component: ApplicationsListComponent },
  { path: 'applications/:id', component: ApplicationDetailComponent },
];
@NgModule({
  declarations: [DirectorDashboardComponent, ApplicationsListComponent, ApplicationDetailComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(directorRoutes), SharedModule],
})
export class DirectorModule {}

// ─── ADMIN ───────────────────────────────────────────────────
import { AdminDashboardComponent, AdminUsersComponent, AdminBuyersComponent, AdminAuditComponent } from './admin/dashboard/admin-dashboard.component';
const adminRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'users',     component: AdminUsersComponent },
  { path: 'buyers',    component: AdminBuyersComponent },
  { path: 'audit',     component: AdminAuditComponent },
];
@NgModule({
  declarations: [AdminDashboardComponent, AdminUsersComponent, AdminBuyersComponent, AdminAuditComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(adminRoutes), SharedModule],
})
export class AdminModule {}