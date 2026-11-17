// Formato de los datos de las órdenes de producción (Programación y Calidad).

// 'YYYY-MM-DD' (o con hora) -> dd/mm/aaaa; cualquier otro formato se muestra tal cual
export const fecha = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v || '—';
};

export const cantidad = (v) =>
  v === null || v === undefined || v === '' || !Number.isFinite(Number(v))
    ? v ?? '—'
    : Number(v).toLocaleString('es-AR', { maximumFractionDigits: 3 });
