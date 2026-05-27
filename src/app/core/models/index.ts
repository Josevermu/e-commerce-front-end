// ============================================================
// KONRAD E-COMMERCE — Modelos TypeScript
// Espejo exacto de los DTOs del backend (Spring Boot)
// ============================================================

// ── Auth ─────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'DIRECTOR' | 'SELLER' | 'BUYER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: UserRole;
  userId: string;
  relatedEntityId: string; // sellerId o buyerId según rol
  expiresInMs: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'SELLER' | 'BUYER';
  relatedEntityId?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ── Sellers ───────────────────────────────────────────────────

export type ApplicationStatus =
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'DEVUELTA';

export type TipoPersona = 'NATURAL' | 'JURIDICA';

export interface SellerRegistrationRequest {
  nombres: string;
  apellidos: string;
  identificacion: string;
  tipoPersona: TipoPersona;
  correo: string;
  pais: string;
  ciudad: string;
  telefono: string;
  documentos?: string[]; // nombres de archivo adjuntos
}

export interface ApplicationSubmittedResponse {
  applicationId: string;
  status: ApplicationStatus;
  mensaje: string;
}

export type DecisionType = 'APROBADA' | 'RECHAZADA' | 'DEVUELTA';

export interface ApplicationDecisionRequest {
  decision: DecisionType;
  motivo?: string; // requerido si RECHAZADA o DEVUELTA
  directorId: string;
}

export interface ApplicationSummaryResponse {
  id: string;
  identificacion: string;
  apellidos: string;
  nombres: string;
  correo: string;
  status: ApplicationStatus;
  fechaSolicitud: string;
}

export interface ApplicationDetailResponse {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  tipoPersona: TipoPersona;
  correo: string;
  pais: string;
  ciudad: string;
  telefono: string;
  documentos: string[];
  status: ApplicationStatus;
  motivoRechazo?: string;
  fechaSolicitud: string;
  fechaDecision?: string;
}

export type TipoSuscripcion = 'MENSUAL' | 'SEMESTRAL' | 'ANUAL';

export interface SubscriptionRequest {
  tipo: TipoSuscripcion;
  paymentId: string;
}

// ── Products ──────────────────────────────────────────────────

export interface Product {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  subcategoria?: string;
  stock: number;
  sellerId: string;
  nombreVendedor?: string;
  peso?: number;
  aplicaIVA?: boolean;
  activo?: boolean;
  imagenes?: string[];
  creadoEn?: string;
}

export interface ProductSearchParams {
  nombre?: string;
  categoria?: string;
  subcategoria?: string;
  precioMin?: number;
  precioMax?: number;
  palabra?: string;
}

// ── Orders & Cart ─────────────────────────────────────────────

export interface CartItem {
  productId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  categoria?: string;
  peso?: number;
  aplicaIVA?: boolean;
}

export interface Cart {
  id?: string;
  buyerId: string;
  items: CartItem[];
  entregaDomicilio: boolean;
  ciudadEntrega?: string;
  creadoEn?: string;
}

export type OrderStatus =
  | 'PENDIENTE_PAGO'
  | 'PAGADO'
  | 'EN_PROCESO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  subtotal: number;
  comision: number;
  costoEnvio: number;
  iva: number;
  total: number;
  status: OrderStatus;
  paymentId?: string;
  entregaDomicilio: boolean;
  ciudadEntrega?: string;
  creadoEn: string;
  calificacion?: number;
  comentario?: string;
  items?: CartItem[];
}

export interface RatingRequest {
  calificacion: number; // 1-10
  comentario?: string;
}

// ── Payments ──────────────────────────────────────────────────

export type MetodoPago = 'PSE' | 'CREDIT_CARD' | 'CONSIGNATION';
export type EntityType = 'ORDER' | 'SUBSCRIPTION' | 'SELLER';
export type TipoPagador = 'NATURAL' | 'JURIDICA';
export type PaymentStatus = 'APROBADO' | 'PENDIENTE_BANCO' | 'RECHAZADO';

export interface PaymentRequest {
  entityId: string;
  entityType: EntityType;
  monto: number;
  metodoPago: MetodoPago;
  // PSE
  pagadorIdentificacion?: string;
  pagadorTipo?: TipoPagador;
  entidadBancaria?: string;
  // Tarjeta de crédito
  numeroTarjeta?: string;
  nombreTitularTarjeta?: string;
  fechaVencimientoTarjeta?: string;
  cvv?: string;
}

export interface PaymentResponse {
  paymentId: string;
  entityId: string;
  entityType: EntityType;
  monto: number;
  metodo: MetodoPago;
  estado: PaymentStatus;
  numeroAprobacion?: string;
  fecha: string;
}

// ── Buyers ────────────────────────────────────────────────────

export interface BuyerRegistrationRequest {
  nombres: string;
  apellidos: string;
  identificacion: string;
  correo: string;
  pais: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  twitter?: string;
  instagram?: string;
}

export interface BuyerRegistrationResponse {
  buyerId: string;
  correo: string;
  mensaje: string;
}

export type BuyerProfile = BuyerProfileResponse;

export interface BuyerProfileResponse {
  id: string;
  nombres: string;
  apellidos: string;
  identificacion: string;
  correo: string;
  pais: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  twitter?: string;
  instagram?: string;
  creadoEn: string;
}

export interface BuyerUpdateRequest {
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  twitter?: string;
  instagram?: string;
}

// ── BAM / KPIs ────────────────────────────────────────────────

export interface TopProductResponse {
  productId: string;
  nombre: string;
  categoria: string;
  unidadesVendidas: number;
  ingresoTotal: number;
  periodo: string;
}

export interface TopCategoryResponse {
  categoria: string;
  totalConsultas: number;
  periodo: string;
  productosDestacados: string[];
}

export interface SubscriptionTrendResponse {
  semestre: string;
  nuevasSuscripciones: number;
  cancelaciones: number;
  enMora: number;
  activas: number;
  tasaRetencion: number;
}

export interface DashboardResponse {
  productoMasVendido: TopProductResponse;
  categoriaMasConsultada: TopCategoryResponse;
  tendenciaSuscripciones: SubscriptionTrendResponse[];
  resumenGeneral: {
    totalVendedoresActivos: number;
    totalCompradoresRegistrados: number;
    ordenesUltimoMes: number;
    ingresoUltimoMesCOP: number;
    tasaConversionCarrito: string;
    calificacionPromedioPlataforma: number;
  };
  generadoEn: string;
}

export interface AuditEntry {
  id: string;
  accion: string;    // CREATE | UPDATE | DELETE | LOGIN | PAYMENT
  usuario: string;
  entidad: string;   // ORDER | SELLER | PRODUCT | BUYER
  entidadId: string;
  fecha: string;
  hora: string;
  detalle: string;
}

// ── Auth State (local) ────────────────────────────────────────

export interface AuthState {
  token: string;
  role: UserRole;
  userId: string;
  relatedEntityId: string;
  email?: string;
}