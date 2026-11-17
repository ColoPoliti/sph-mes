// Revisión de cantidades de las órdenes de producción por Calidad.
//
// Flujo (según el dueño): Programación programa la orden → Calidad revisa que las cantidades
// estén bien y da el OK → recién ahí la orden sale a Elaboración.
//
// SUPUESTOS (a confirmar):
//   - Calidad aprueba o rechaza la orden completa (con comentario si rechaza).
//   - Una orden rechazada vuelve a Programación para corregirla en Bejerman; Calidad puede
//     quitar el rechazo para volver a revisarla.
//
// PROVISORIO: las decisiones se guardan en este navegador (localStorage), por número de
// producción. Cuando exista el endpoint, reemplazar leer/guardar por llamadas a la API.
import { faCircleCheck, faCircleXmark, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';

const CLAVE = 'sph-revision-ordenes';

const leer = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || '{}');
  } catch {
    return {};
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
export function registrarRevision(numero, { decision, comentario = '' }, usuario) {
  const datos = leer();
  datos[String(numero)] = { decision, comentario: comentario.trim(), usuario, fecha: new Date().toISOString() };
  guardar(datos);
}

export function quitarRevision(numero) {
  const datos = leer();
  delete datos[String(numero)];
  guardar(datos);
}

/** Agrega a cada orden su revisión: null (pendiente) o { decision, comentario, usuario, fecha }. */
export function aplicarRevisiones(ordenes) {
  const datos = leer();
  return ordenes.map((o) => ({ ...o, revision: datos[String(o.numero)] || null }));
}

export const estadoRevision = (o) => o.revision?.decision || 'pendiente';

// Estado -> chip
export const ESTADOS_REVISION = {
  pendiente: { tipo: 'inc', texto: 'Pend. calidad', icono: faHourglassHalf },
  aprobado: { tipo: 'calidad', texto: 'Cantidades OK', icono: faCircleCheck },
  rechazado: { tipo: 'mal', texto: 'Rechazada', icono: faCircleXmark },
};
