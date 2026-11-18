// Semáforo de Cuarentena: cuánto hace que la tolva terminó de elaborarse y espera a Calidad.
//
// Según el relevamiento: Calidad necesita ver qué tolvas están preparadas, con un temporizador
// del tiempo que pasa y colores tipo semáforo según la demora. "Si es la primera de la OT,
// no más de 5 min".
//
// Cortes acordados: verde < 5 min, amarillo de 5 a 10 min, rojo > 10 min, iguales para todas
// las tolvas. PENDIENTE: distinguir la primera tolva de cada OT cuando los lotes traigan el
// número de orden de producción (integración con el PLC).

export const SEMAFORO_MIN = { amarillo: 5, rojo: 10 };

export const NIVELES = {
  verde: {
    texto: 'En tiempo',
    chip: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
    punto: 'bg-emerald-500 dark:bg-emerald-400',
  },
  amarillo: {
    texto: 'Demorada',
    chip: 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
    punto: 'bg-yellow-500 dark:bg-yellow-400',
  },
  rojo: {
    texto: 'Muy demorada',
    chip: 'bg-red-500/15 text-red-700 dark:bg-red-400/15 dark:text-red-300',
    punto: 'bg-red-500 dark:bg-red-400',
  },
};

// '2026-11-06 14:02:11' (hora local de la planta) -> ms
const aMs = (ts) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(ts || '');
  return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime() : null;
};

/** Segundos que lleva en cuarentena (desde el fin de la elaboración), o null si no terminó. */
export const esperaSeg = (lote, ahora = Date.now()) => {
  const fin = aMs(lote.fin);
  return fin === null ? null : Math.max(0, Math.floor((ahora - fin) / 1000));
};

export const nivel = (seg) => {
  if (seg === null) return null;
  if (seg >= SEMAFORO_MIN.rojo * 60) return 'rojo';
  if (seg >= SEMAFORO_MIN.amarillo * 60) return 'amarillo';
  return 'verde';
};

// 75 -> '01:15'; 3900 -> '1 h 05 min'
export const duracion = (seg) => {
  if (seg === null) return '—';
  if (seg < 3600) return `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;
  const h = Math.floor(seg / 3600);
  const min = Math.floor((seg % 3600) / 60);
  return h >= 48 ? `${Math.floor(h / 24)} días` : `${h} h ${String(min).padStart(2, '0')} min`;
};
