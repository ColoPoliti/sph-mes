// Configuración general del MES (la de las salas/PLC está en modules/monitoreo/config.js).
// Los valores se toman de config.env (servidor) o de .env.local (ver src/app/entorno.js).

import { env } from '@/app/entorno';

export const CONFIG_APP = {
  NOMBRE: 'MES · SPH',
  // API PHP. En desarrollo /api lo redirige el proxy de Vite.
  API_BASE: env('API_BASE', '/api'),
};
