// Órdenes de producción simuladas para el modo demo (?demo en la URL), con la misma forma
// que se espera de ordenes_produccion.php (Bejerman):
//   [{ numero, producto, codigo_barras, cantidad, linea, lote, vencimiento, tamano_tolva? }]
// Siempre son las mismas; los vencimientos se calculan desde hoy para que nunca queden viejos.
// Algunas no traen tamano_tolva, para probar la asignación de tolva en el MES.

const PRODUCTOS = [
  { nombre: 'Aromatizante Lavanda', codigo: '7790000000101' },
  { nombre: 'Aromatizante Citrus', codigo: '7790000000102' },
  { nombre: 'Textil Bebé', codigo: '7790000000103' },
  { nombre: 'Aerosol Vainilla', codigo: '7790000000104' },
  { nombre: 'Difusor Bambú', codigo: '7790000000105' },
  { nombre: 'Aromatizante Jazmín', codigo: '7790000000106' },
];

// [producto, cantidad (kg), línea, tamaño de tolva o null]
const FILAS = [
  [0, 1000, '1', 1000],
  [1, 750, '1', 1000],
  [5, 250, '1', 250],
  [0, 500, '1', null],
  [2, 250, '2', 250],
  [2, 1000, '2', 1000],
  [4, 180, '2', 250],
  [1, 900, '2', null],
  [3, 600, '3', 1000],
  [3, 240, '3', 250],
  [5, 1000, '3', 1000],
  [4, 120, '3', null],
];

const isoEnDias = (dias) => new Date(Date.now() + dias * 864e5).toLocaleDateString('sv-SE');

let cache = null;

/** Órdenes de producción de ejemplo. */
export function ordenesDemo() {
  if (cache) return cache;
  const anio = String(new Date().getFullYear()).slice(-2);
  cache = FILAS.map(([p, cantidad, linea, tolva], i) => {
    const prod = PRODUCTOS[p];
    const numero = String(24051 + i);
    return {
      numero,
      producto: prod.nombre,
      codigo_barras: prod.codigo,
      cantidad,
      linea,
      lote: `L${anio}-${String(310 + i).padStart(4, '0')}`,
      // Vencimiento a 18 meses; uno sin dato, como puede venir de Bejerman
      vencimiento: i === 6 ? null : isoEnDias(540 + i * 3),
      tamano_tolva: tolva,
    };
  });
  return cache;
}
