// Decisión de Calidad sobre cada lote: aprobado o rechazado (con comentario).
//
// PROVISORIO: la API (lotes.php) todavía no guarda aprobaciones, así que se
// guardan en este navegador (localStorage). Cuando exista el endpoint, cambiar
// registrarDecision / quitarDecision / leer por llamadas a la API.

import { DEMO } from '@/modules/monitoreo/lib/demo';
import { decisionesLotesDemo } from './demo';

// En modo demo (?demo) se usa otra clave, sembrada con decisiones de ejemplo
const CLAVE = DEMO ? 'sph-aprobaciones-demo' : 'sph-aprobaciones';

const leer = () => {
  try {
    const guardado = localStorage.getItem(CLAVE);
    // En demo, la primera vez se siembran las decisiones de ejemplo
    if (guardado === null && DEMO) {
      const semilla = decisionesLotesDemo();
      localStorage.setItem(CLAVE, JSON.stringify(semilla));
      return semilla;
    }
    return JSON.parse(guardado || '{}');
  } catch {
    return DEMO ? decisionesLotesDemo() : {};
  }
};

const guardar = (datos) => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    /* sin storage */
  }
};

// decision: 'aprobado' | 'rechazado'
export function registrarDecision(id, { decision, comentario = '' }, usuario) {
  const datos = leer();
  datos[id] = { decision, comentario: comentario.trim(), usuario, fecha: new Date().toISOString() };
  guardar(datos);
}

export function quitarDecision(id) {
  const datos = leer();
  delete datos[id];
  guardar(datos);
}

export const aprobarLote = (id, usuario) => registrarDecision(id, { decision: 'aprobado' }, usuario);
export const quitarAprobacion = quitarDecision;

// Pone el estado de la decisión ("aprobado"/"rechazado") y guarda el estado original
export function aplicarAprobacion(lote) {
  if (!lote) return lote;
  const original = lote.estado_original ?? lote.estado;
  const a = leer()[lote.id];
  if (!a) {
    const sinDecision = { ...lote, estado: original };
    delete sinDecision.estado_original;
    delete sinDecision.calidad;
    return sinDecision;
  }
  return {
    ...lote,
    estado: a.decision || 'aprobado',
    estado_original: original,
    calidad: {
      decision: a.decision || 'aprobado',
      comentario: a.comentario || '',
      usuario: a.usuario,
      fecha: a.fecha,
    },
  };
}

export const aplicarAprobaciones = (filas) =>
  Array.isArray(filas) ? filas.map(aplicarAprobacion) : filas;
