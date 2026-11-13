// Cliente HTTP común para todas las APIs del MES.
// Centraliza base URL, JSON y errores; los api.js de cada módulo lo usan.

import { CONFIG_APP } from '@/app/config';

export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje || 'HTTP ' + status);
    this.status = status;
  }
}

async function pedir(metodo, path, cuerpo) {
  const r = await fetch(CONFIG_APP.API_BASE + path, {
    method: metodo,
    cache: 'no-store',
    headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  if (!r.ok) throw new ErrorHttp(r.status);
  return r.status === 204 ? null : r.json();
}

export const http = {
  get: (path) => pedir('GET', path),
  post: (path, cuerpo) => pedir('POST', path, cuerpo),
  put: (path, cuerpo) => pedir('PUT', path, cuerpo),
  del: (path) => pedir('DELETE', path),
};
