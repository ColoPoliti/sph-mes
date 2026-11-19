// Datos de demo de Calidad (?demo en la URL). En modo demo las decisiones se guardan con otra
// clave de localStorage, así nunca se mezclan con las reales; la primera vez se siembran con:
//   - decisiones sobre los lotes simulados de Monitoreo (ids 1001 a 1060): los más viejos ya
//     revisados, la mayoría aprobados y algunos rechazados; los más nuevos quedan sin revisar;
//   - revisiones de las órdenes simuladas de Programación (números 24051 a 24062);
//   - recetas del maestro de tolvas para los productos de las órdenes demo (una queda sin receta).

const hace = (horas) => new Date(Date.now() - horas * 3600e3).toISOString();

const MOTIVOS_RECHAZO = [
  'Esencia fuera de tolerancia.',
  'Dosificación incompleta: falta glicerina.',
  'Color fuera de estándar.',
];

/** Decisiones sobre lotes: { [id]: { decision, comentario, usuario, fecha } }. */
export function decisionesLotesDemo() {
  const datos = {};
  // Lote 1001 es el más viejo; de 1001 a 1035 ya están revisados
  for (let id = 1001; id <= 1035; id++) {
    const rechazado = id % 9 === 0;
    datos[id] = {
      decision: rechazado ? 'rechazado' : 'aprobado',
      comentario: rechazado ? MOTIVOS_RECHAZO[id % MOTIVOS_RECHAZO.length] : '',
      usuario: 'calidad',
      // Una hora después de que se elaboró el lote (el demo genera uno cada ~2,7 h)
      fecha: hace((1060 - id) * 2.7 - 1),
    };
  }
  return datos;
}

/** Revisiones de órdenes: { [numero]: { decision, comentario, usuario, fecha } }. */
export function revisionesOrdenesDemo() {
  const r = (decision, horas, comentario = '') => ({ decision, comentario, usuario: 'calidad', fecha: hace(horas) });
  return {
    24051: r('aprobado', 20),
    24052: r('aprobado', 18),
    24055: r('aprobado', 6),
    24056: r('rechazado', 5, 'La cantidad no coincide con el plan semanal: corregir en Bejerman.'),
    24059: r('aprobado', 3),
    24060: r('aprobado', 2),
  };
}

// Receta base para 1000 kg: [alcohol, colorante, glicerina, agua, esencia] en kg (colorante en kg, se ve en ml)
const RECETAS = [
  ['7790000000101', 'Aromatizante Lavanda', 'ARO-LAV', [420, 1.2, 80, 470, 28.8]],
  ['7790000000102', 'Aromatizante Citrus', 'ARO-CIT', [430, 1.0, 75, 460, 34]],
  ['7790000000103', 'Textil Bebé', 'TEX-BEB', [300, 0.5, 120, 560, 19.5]],
  ['7790000000104', 'Aerosol Vainilla', 'AER-VAI', [520, 0.8, 60, 390, 29.2]],
  ['7790000000106', 'Aromatizante Jazmín', 'ARO-JAZ', [410, 1.1, 85, 472, 31.9]],
  // Difusor Bambú (7790000000105) queda sin receta, para ver el caso "Sin receta en el maestro"
];
const CODIGOS_MP = ['MP-101', 'MP-205', 'MP-310', 'MP-001', 'MP-412'];

/** Recetas del maestro de tolvas. `insumos`: [{ etapa, nombre, unidad }] de administracion/lib/api. */
export function recetasDemo(insumos) {
  return RECETAS.map(([codigo, nombre, sku, sps], i) => ({
    id: i + 1,
    codigo_barra: codigo,
    base_kg: 1000,
    producto: { nombre, sku },
    insumos: insumos.map((ins) => ({ etapa: ins.etapa, nombre: ins.nombre, codigo_mp: CODIGOS_MP[ins.etapa], sp: sps[ins.etapa] })),
    modificado: { usuario: 'admin', fecha: hace(24 * (10 - i)) },
  }));
}
