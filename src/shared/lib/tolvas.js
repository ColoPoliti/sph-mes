// Ciclo de vida de las tolvas físicas (las de acero inoxidable), compartido por Elaboración y
// Producción (Línea).
//
//   elaboracion  el elaborador escaneó la tolva y la asignó a una orden (se elabora y queda en
//                cuarentena hasta que Calidad apruebe el lote)
//   linea        Línea la conectó (cambio de tolva), validando que sea la que sigue en prioridad
//   sucia        Línea la vació: queda sucia con la esencia que tenía (aviso a Elaboración)
//
// Cada uso de una tolva (de la asignación hasta que se vacía) es un "ciclo". Al reasignarla,
// el ciclo anterior se archiva en tolva.ciclos: así Auditoría puede controlar cada uno.
//
// Regla de lavado (PDF): si la tolva está sucia con la misma esencia que la orden que sigue,
// no se lava; si la esencia es distinta, se lava.
//
// SUPUESTOS (a confirmar):
//   - No hay padrón de tolvas: la tolva es el código que se escanea, y ese código es el mismo
//     número de tolva que informa el PLC en cada lote (lote.tolva). Así se vincula la tolva con
//     el lote que aprueba Calidad.
//   - La esencia se identifica por el código MP de la esencia en la receta del maestro.
//   - Auditoría controla después y no bloquea el uso (confirmado).
//
// PROVISORIO: se guarda en este navegador (localStorage). Cuando exista el endpoint, reemplazar
// el cuerpo de estas funciones por llamadas a la API sin tocar las pantallas.
import { crearColeccion } from './almacen';

const tolvas = crearColeccion('tolvas');

export const ESTADOS_TOLVA = {
  elaboracion: { tipo: 'curso', texto: 'En elaboración' },
  linea: { tipo: 'ok', texto: 'En línea' },
  sucia: { tipo: 'inc', texto: 'Vacía / sucia' },
};

const ahora = () => new Date().toISOString();
const norm = (c) => String(c ?? '').trim();

export const getTolvas = () => tolvas.listar();

const buscar = async (codigo) => (await tolvas.listar((t) => t.codigo === norm(codigo)))[0] || null;

/** Código MP de la esencia de una receta (etapa 4), o '' si no está cargado. */
export const esenciaDe = (receta) => norm(receta?.insumos?.find((i) => i.etapa === 4)?.codigo_mp);

/**
 * Qué hacer con una tolva antes de usarla para una receta:
 * 'nueva' (nunca se usó) · 'no_lavar' (misma esencia) · 'lavar' (otra esencia, o sin dato para comparar).
 */
export function evaluarLavado(tolva, receta) {
  if (!tolva || !tolva.esencia) return tolva ? 'lavar' : 'nueva';
  const sigue = esenciaDe(receta);
  return sigue && sigue === tolva.esencia ? 'no_lavar' : 'lavar';
}

const conHistorial = (t, usuario, accion) => [...(t?.historial || []), { fecha: ahora(), usuario, accion }];

/**
 * Elaboración: asigna la tolva escaneada a una orden. Falla si la tolva está en uso.
 * lavada: true si se lavó antes de usarla.
 */
export async function asignarTolva(codigo, { orden, receta }, usuario, { lavada = false } = {}) {
  const c = norm(codigo);
  if (!c) throw new Error('Escaneá o escribí el código de la tolva.');
  const previa = await buscar(c);
  if (previa && previa.estado !== 'sucia') {
    throw new Error(`La tolva ${c} está ${ESTADOS_TOLVA[previa.estado].texto.toLowerCase()} (orden ${previa.orden}).`);
  }
  const accion = `Asignada a la orden ${orden.numero}${lavada ? ' (lavada)' : ''}`;
  // El ciclo anterior (si lo hubo) queda archivado
  const ciclos = previa ? [...(previa.ciclos || []), datosCiclo(previa)] : [];
  return tolvas.guardar({
    ...(previa || {}),
    ciclos,
    conectada: null,
    vaciada: null,
    lavada,
    codigo: c,
    estado: 'elaboracion',
    orden: orden.numero,
    linea: orden.linea,
    producto: orden.producto || '',
    kg: orden.tolva_kg || null,
    esencia: esenciaDe(receta),
    asignada: ahora(),
    historial: conHistorial(previa, usuario, accion),
  });
}

// Datos de un ciclo (sin historial ni ciclos archivados)
const CAMPOS_CICLO = ['codigo', 'orden', 'linea', 'producto', 'kg', 'esencia', 'lavada', 'asignada', 'conectada', 'vaciada', 'estado'];
const datosCiclo = (t) => Object.fromEntries(CAMPOS_CICLO.map((k) => [k, t[k] ?? null]));

/** Id único de un ciclo de tolva: código + fecha de asignación. */
export const idCiclo = (c) => `${c.codigo}@${c.asignada}`;

/** Todos los ciclos de todas las tolvas (archivados y el actual), con su id. */
export const ciclosDe = (lista) =>
  (lista || []).flatMap((t) => [...(t.ciclos || []), datosCiclo(t)].map((c) => ({ ...c, id: idCiclo(c) })));

/** Línea: conecta la tolva (cambio de tolva). La validación de prioridad la hace la pantalla. */
export async function conectarTolva(codigo, usuario) {
  const t = await buscar(codigo);
  return tolvas.guardar({ ...t, estado: 'linea', conectada: ahora(), historial: conHistorial(t, usuario, 'Conectada en la línea') });
}

/** Línea: la tolva se vació; queda sucia con su esencia (aviso a Elaboración). */
export async function vaciarTolva(codigo, usuario) {
  const t = await buscar(codigo);
  return tolvas.guardar({ ...t, estado: 'sucia', vaciada: ahora(), historial: conHistorial(t, usuario, 'Vacía') });
}

// '2026-11-06 14:02:11' (hora local de la planta) -> ms
const aMs = (ts) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(ts || '');
  return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime() : null;
};

/**
 * Lote del PLC elaborado en esta tolva desde que se asignó (mismo número de tolva, inicio
 * posterior a la asignación). Los lotes ya traen la decisión de Calidad aplicada.
 */
export function loteDeTolva(tolva, lotes) {
  const desde = tolva.asignada ? new Date(tolva.asignada).getTime() : 0;
  // Un ciclo archivado termina cuando la tolva se vació
  const hasta = tolva.vaciada ? new Date(tolva.vaciada).getTime() : Infinity;
  return (
    (lotes || [])
      .filter((l) => {
        const ini = aMs(l.inicio) ?? 0;
        return norm(l.tolva) === tolva.codigo && ini >= desde && ini <= hasta;
      })
      .sort((a, b) => (aMs(b.inicio) ?? 0) - (aMs(a.inicio) ?? 0))[0] || null
  );
}

/** Estado de Calidad de la tolva: 'aprobado' | 'rechazado' | 'pendiente' | 'sin_lote'. */
export function calidadDeTolva(tolva, lotes) {
  const l = loteDeTolva(tolva, lotes);
  if (!l) return 'sin_lote';
  if (l.estado === 'aprobado' || l.estado === 'rechazado') return l.estado;
  return 'pendiente';
}

export const CALIDAD_TOLVA = {
  sin_lote: { tipo: 'neutro', texto: 'Sin lote del PLC' },
  pendiente: { tipo: 'inc', texto: 'En cuarentena' },
  aprobado: { tipo: 'calidad', texto: 'Aprobada' },
  rechazado: { tipo: 'mal', texto: 'Rechazada' },
};
