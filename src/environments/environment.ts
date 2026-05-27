/**
 * environments/environment.ts — Configuración LOCAL (desarrollo)
 *
 * El apiUrl apunta al Spring Cloud Gateway (único punto de entrada público).
 * En producción (Azure), reemplazar con la URL del ingress externo del gateway.
 *
 * Uso en servicios:
 *   import { environment } from '@env/environment';
 *   this.http.get(`${environment.apiUrl}/products`)
 */
export const environment = {
  production: false,
  apiUrl: 'https://gateway-service.happyplant-87f36f23.eastus.azurecontainerapps.io',
  tokenKey: 'konrad_token',
  appName: 'KONRAD',
};
