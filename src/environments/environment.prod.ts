/**
 * environments/environment.prod.ts — Configuración PRODUCCIÓN (Azure)
 *
 * Reemplazar 'https://your-gateway.azurecontainerapps.io' con la URL real
 * del ingress externo del gateway-service en Azure Container Apps.
 */
export const environment = {
  production: true,
  apiUrl: 'https://your-gateway.azurecontainerapps.io',
  tokenKey: 'konrad_token',
  appName: 'KONRAD',
};
