/**
 * environments/environment.prod.ts — Configuración PRODUCCIÓN (Azure)
 *
 * Reemplazar 'https://gateway-service.happyplant-87f36f23.eastus.azurecontainerapps.io' con la URL real
 * del ingress externo del gateway-service en Azure Container Apps.
 */
export const environment = {
  production: true,
  apiUrl: 'https://gateway-service.happyplant-87f36f23.eastus.azurecontainerapps.io',
  tokenKey: 'konrad_token',
  appName: 'KONRAD',
};
