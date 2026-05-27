import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

/**
 * SharedModule — Re-exporta módulos Angular comunes y declara
 * componentes compartidos (Navbar, Sidebar) para que cualquier
 * feature module los pueda usar sin importar los módulos base.
 *
 * Uso:
 *   imports: [..., SharedModule]
 */
@NgModule({
  declarations: [
    NavbarComponent,
    SidebarComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    // Módulos reutilizables
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    // Componentes compartidos
    NavbarComponent,
    SidebarComponent,
  ]
})
export class SharedModule {}
