// API del módulo Programación (órdenes de producción).
//
// Según el relevamiento: las órdenes se cargan en Bejerman (a mano) y el MES NO lo reemplaza,
// las LEE de la base que usa Bejerman. Cada orden trae cantidad de producto, línea de
// elaboración y lote (vencimiento, si está). El código de barras es el del producto.
// La prioridad está dada por la numeración en cada línea; Producción o el administrador
// pueden modificarla o reasignar la orden a otra línea.
// Tamaño de tolva (250 o 1000 kg): lo define Programación en la orden. Si Bejerman lo trae
// (tamano_tolva), se usa ese; si no, se asigna en el MES.
//
// PENDIENTE: el endpoint que consulta la base de Bejerman. Se espera que devuelva un array:
//   [{ numero, producto, codigo_barras, cantidad, linea, lote, vencimiento, tamano_tolva? }]
// numero = número de producción (es el que después se usa para matchear con el PLC).
//
// PROVISORIO: los cambios de prioridad y de línea se guardan en este navegador
// (localStorage) porque todavía no hay dónde persistirlos. Cuando exista el endpoint,
// reemplazar leer/guardar por llamadas a la API sin tocar las pantallas.
import { DEMO } from '@/modules/monitoreo/lib/demo';
import { http } from '@/shared/lib/http';
import { ordenesDemo } from './demo';
import { aplicarRevisiones } from './revision';

const CLAVE = 'sph-programacion';

const leer = () => {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    return { lineas: d?.lineas || {}, orden: d?.orden || {}, tolvas: d?.tolvas || {} };
  } catch {
    return { lineas: {}, orden: {}, tolvas: {} };
  }
};

const guardar = (datos) => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    /* sin storage: los cambios duran lo que la página */
  }
};

const texto = (v) => (v === null || v === undefined ? '' : String(v));

// Orden natural: '2' < '10', 'Línea 2' < 'Línea 10'
export const comparar = (a, b) => texto(a).localeCompare(texto(b), 'es', { numeric: true });

/** Órdenes de producción tal como vienen de Bejerman. En modo demo (?demo) usa órdenes simuladas. */
export const getOrdenesBejerman = () =>
  DEMO ? Promise.resolve(ordenesDemo()) : http.get('/ordenes_produccion.php');

/**
 * Agrupa las órdenes por línea (aplicando las reasignaciones) y las ordena por prioridad:
 * primero el orden que fijó Producción y, para el resto, la numeración.
 * Devuelve [{ linea, ordenes: [{ ...orden, prioridad, linea_bejerman, reasignacion, revision, tolva_kg }] }].
 * tolva_kg: tamaño de tolva asignado (número) o null si todavía no se definió.
 */
export function porLinea(ordenes) {
  const aj = leer();
  const filas = aplicarRevisiones(Array.isArray(ordenes) ? ordenes : []).map((o) => {
    const numero = texto(o.numero);
    const r = aj.lineas[numero] || null;
    const tolva = aj.tolvas[numero] ?? o.tamano_tolva;
    return {
      ...o,
      numero,
      linea_bejerman: texto(o.linea),
      linea: r ? r.linea : texto(o.linea),
      reasignacion: r,
      tolva_kg: tolva === null || tolva === undefined || tolva === '' ? null : Number(tolva),
    };
  });

  const lineas = [...new Set(filas.map((o) => o.linea))].sort(comparar);
  return lineas.map((linea) => {
    const fijado = aj.orden[linea] || [];
    const pos = (n) => {
      const i = fijado.indexOf(n);
      return i === -1 ? Infinity : i;
    };
    const ordenadas = filas
      .filter((o) => o.linea === linea)
      .sort((a, b) => {
        const pa = pos(a.numero);
        const pb = pos(b.numero);
        return pa === pb ? comparar(a.numero, b.numero) : pa - pb;
      });
    return { linea, ordenes: ordenadas.map((o, i) => ({ ...o, prioridad: i + 1 })) };
  });
}

/**
 * Mueve una orden dentro de su línea.
 * numeros: números de la línea en el orden actual. desde/hacia: posiciones (0 = primera).
 */
export async function moverOrden(linea, numeros, desde, hacia) {
  if (hacia < 0 || hacia >= numeros.length) return;
  const lista = [...numeros];
  const [n] = lista.splice(desde, 1);
  lista.splice(hacia, 0, n);
  const aj = leer();
  aj.orden[linea] = lista;
  guardar(aj);
}

/**
 * Reasigna una orden a otra línea; queda última en la cola de la línea destino.
 * numerosDestino: números de la línea destino en el orden actual.
 */
export async function reasignarLinea(orden, nueva, numerosDestino, usuario) {
  const aj = leer();
  for (const l of Object.keys(aj.orden)) aj.orden[l] = aj.orden[l].filter((n) => n !== orden.numero);
  if (nueva === orden.linea_bejerman) delete aj.lineas[orden.numero];
  else aj.lineas[orden.numero] = { linea: nueva, usuario, fecha: new Date().toISOString() };
  aj.orden[nueva] = [...numerosDestino.filter((n) => n !== orden.numero), orden.numero];
  guardar(aj);
}

/** Asigna el tamaño de tolva (kg) de una orden. */
export async function asignarTolva(numero, kg) {
  const aj = leer();
  aj.tolvas[numero] = Number(kg);
  guardar(aj);
}
