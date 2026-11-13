// Configuración general del MES (la de las salas/PLC está en modules/monitoreo/config.js).
// Se puede sobrescribir con variables de entorno de Vite (.env.local).

export const CONFIG_APP = {
  NOMBRE: 'MES · SPH',
  // API PHP. En desarrollo /api lo redirige el proxy de Vite.
  API_BASE: import.meta.env.VITE_API_BASE || '/api',
};
