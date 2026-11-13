// Cliente de lotes.php (API PHP). En modo demo (?demo) usa lotes simulados.
// A cada lote se le aplica la decisión de Calidad (módulo calidad/lib/aprobaciones).
import { http } from '@/shared/lib/http';
import { aplicarAprobacion, aplicarAprobaciones } from '@/modules/calidad/lib/aprobaciones';
import { DEMO, historialDemo, loteDemo } from './demo';

const lotes = (params) =>
  DEMO
    ? Promise.resolve(historialDemo(Object.fromEntries(params)))
    : http.get('/lotes.php?' + params);

export function getUltimas({ area, sala, limit = 4 }) {
  const params = new URLSearchParams({ area, sala, limit: String(limit) });
  return lotes(params).then(aplicarAprobaciones);
}

export function getHistorial(filtro) {
  const p = new URLSearchParams();
  if (filtro.sector && filtro.sector !== 'todos') p.set('area', filtro.sector);
  if (filtro.plc && filtro.plc !== 'todos') p.set('sala', filtro.plc);
  if (filtro.desde) p.set('desde', filtro.desde);
  if (filtro.hasta) p.set('hasta', filtro.hasta);
  if (filtro.horaD && filtro.horaH && !(filtro.horaD === '00:00' && filtro.horaH === '23:59')) {
    p.set('horaD', filtro.horaD);
    p.set('horaH', filtro.horaH);
  }
  p.set('limit', String(filtro.limit || 500));
  return lotes(p).then(aplicarAprobaciones);
}

export function getLote(id) {
  const pedido = DEMO
    ? Promise.resolve().then(() => loteDemo(id))
    : http.get('/lotes.php?id=' + encodeURIComponent(id));
  return pedido.then((d) => (d && d.lote ? { ...d, lote: aplicarAprobacion(d.lote) } : d));
}
