# KONRAD — Frontend Angular

Frontend para la plataforma de e-commerce KONRAD, construido con **Angular 17** y comunicado exclusivamente con el **Spring Cloud Gateway** (puerto 8080).

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── models/index.ts              # Interfaces TypeScript (espejo de DTOs backend)
│   │   ├── services/
│   │   │   ├── auth.service.ts          # JWT, login, logout, redirectByRole
│   │   │   ├── services.ts              # ProductService, OrderService, PaymentService, BuyerService, BamService
│   │   │   └── seller.service.ts        # SellerService (solicitudes, aplicaciones, activación)
│   │   └── interceptors/
│   │       └── jwt.interceptor.ts       # JwtInterceptor + AuthGuard + RoleGuard
│   ├── features/
│   │   ├── auth/login/                  # LoginComponent (usuarios de prueba mock incluidos)
│   │   ├── public/catalog/             # CatalogComponent + SellerRegisterComponent
│   │   ├── buyer/
│   │   │   ├── dashboard/              # BuyerDashboardComponent
│   │   │   ├── cart/                   # CartComponent + CheckoutComponent
│   │   │   ├── orders/                 # BuyerOrdersComponent (con calificación)
│   │   │   ├── profile/               # BuyerProfileComponent (edición + eliminación)
│   │   │   └── register/              # BuyerRegisterComponent (standalone, público)
│   │   ├── seller/
│   │   │   ├── dashboard/             # SellerDashboardComponent
│   │   │   ├── products/              # SellerProductsComponent + ProductFormComponent
│   │   │   └── orders/                # SellerOrdersComponent + SellerActivationComponent
│   │   ├── director/
│   │   │   ├── dashboard/             # DirectorDashboardComponent (KPIs BAM)
│   │   │   └── applications/          # ApplicationsListComponent + ApplicationDetailComponent
│   │   ├── admin/
│   │   │   └── dashboard/             # AdminDashboardComponent + AdminUsersComponent +
│   │   │                              # AdminBuyersComponent + AdminAuditComponent
│   │   └── feature-modules.ts         # Todos los NgModules de feature con sus rutas
│   ├── shared/
│   │   ├── shared.module.ts           # SharedModule (re-exporta Angular + Navbar + Sidebar)
│   │   └── components/
│   │       ├── navbar/                # NavbarComponent (responsive, por rol)
│   │       ├── sidebar/               # SidebarComponent (navegación por rol)
│   │       └── error-page/            # ForbiddenComponent (403) + NotFoundComponent (404)
│   ├── app-routing.module.ts          # Rutas raíz con lazy loading
│   ├── app.module.ts                  # Root module
│   └── app.component.ts              # Shell (layout público vs autenticado)
├── environments/
│   ├── environment.ts                 # LOCAL → http://localhost:8080
│   └── environment.prod.ts           # PROD  → URL del gateway en Azure
└── styles.scss                       # Design system global (CSS vars, componentes)
```

---

## Requisitos

- Node.js ≥ 18
- Angular CLI ≥ 17: `npm install -g @angular/cli`
- Gateway corriendo en `http://localhost:8080`

---

## Instalación y arranque local

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar en modo desarrollo (con proxy al gateway en :8080)
npm start
# → http://localhost:4200

# 3. Build de producción
npm run build:prod
```

El `proxy.conf.json` reenvía todas las rutas del API (`/auth`, `/sellers`, `/products`, `/orders`, `/cart`, `/payments`, `/buyers`, `/bam`) al gateway en `localhost:8080`, evitando CORS en local.

---

## Usuarios de prueba (mock backend)

El `LoginComponent` incluye botones de acceso rápido con las credenciales de prueba predefinidas:

| Rol      | Email                  | Contraseña |
|----------|------------------------|------------|
| ADMIN    | admin@konrad.com       | Admin123!  |
| DIRECTOR | director@konrad.com    | Director1! |
| SELLER   | vendedor@konrad.com    | Seller123! |
| BUYER    | comprador@konrad.com   | Buyer123!  |

---

## Flujos principales

### Comprador
1. Registro público → `/buyers/register`
2. Login → redirección a `/buyer/dashboard`
3. Explorar catálogo → agregar al carrito → checkout (PSE / Tarjeta / Consignación)
4. Ver pedidos y calificar entregas

### Vendedor
1. Solicitud de registro → `/sellers/apply`
2. Esperar aprobación del Director → notificación con credenciales
3. Login → activar suscripción → publicar productos
4. Ver ventas y gestionar catálogo propio

### Director Comercial
1. Login → `/director/dashboard` con KPIs BAM en tiempo real
2. Gestionar solicitudes de vendedores (aprobar / rechazar / devolver)

### Administrador
1. Login → `/admin/dashboard`
2. Gestión de usuarios del sistema, compradores y log de auditoría completo

---

## Configuración para producción (Azure)

En `src/environments/environment.prod.ts`, reemplaza la URL del gateway:

```typescript
apiUrl: 'https://TU-GATEWAY.azurecontainerapps.io',
```

Luego construye con:
```bash
npm run build:prod
```

Los artefactos quedan en `dist/konrad-frontend/` listos para Azure Static Web Apps o cualquier CDN/servidor estático.
