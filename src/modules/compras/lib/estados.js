// Estados de órdenes de compra y recepciones -> chip (colores de shared/lib/estados.js)
import {
  faBan,
  faCircleCheck,
  faCircleXmark,
  faFilePen,
  faHourglassHalf,
  faTruckRampBox,
  faStamp,
} from '@fortawesome/free-solid-svg-icons';

export const ESTADOS_OC = {
  borrador: { tipo: 'neutro', texto: 'Borrador', icono: faFilePen },
  pendiente: { tipo: 'inc', texto: 'Pend. aprobación', icono: faHourglassHalf },
  aprobada: { tipo: 'curso', texto: 'Aprobada', icono: faStamp },
  recibida: { tipo: 'ok', texto: 'Recibida', icono: faTruckRampBox },
  cancelada: { tipo: 'mal', texto: 'Cancelada', icono: faBan },
};

export const ESTADOS_RECEPCION = {
  pendiente: { tipo: 'inc', texto: 'En inspección', icono: faHourglassHalf },
  aprobado: { tipo: 'calidad', texto: 'Liberado', icono: faCircleCheck },
  rechazado: { tipo: 'mal', texto: 'Rechazado', icono: faCircleXmark },
};

export const pesos = (n) =>
  Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export const cantidad = (n, unidad = '') =>
  `${Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}${unidad ? ' ' + unidad : ''}`;

export const fechaAR = (iso) => {
  if (!iso) return '—';
  const d = iso.length <= 10 ? new Date(iso + 'T00:00:00') : new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};
