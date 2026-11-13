// API del módulo Compras.
//
// PROVISORIO: todavía no hay backend, los datos viven en localStorage (shared/lib/almacen.js).
// Todas las funciones devuelven Promesas con la misma forma que tendrá la API real:
// para conectarla, reemplazar el cuerpo de cada función por http.get/post/put
// (shared/lib/http.js) sin tocar las pantallas.
import { ahoraISO, crearColeccion, numerar } from '@/shared/lib/almacen';
import {
  materiasPrimasSemilla,
  ordenesSemilla,
  proveedoresSemilla,
  recepcionesSemilla,
} from '../data/semilla';

const proveedores = crearColeccion('compras.proveedores', proveedoresSemilla);
const materias = crearColeccion('compras.materias', materiasPrimasSemilla);
const ordenes = crearColeccion('compras.ordenes', ordenesSemilla);
const recepciones = crearColeccion('compras.recepciones', recepcionesSemilla);

const hoy = () => new Date().toISOString().slice(0, 10);

// ---------- Proveedores ----------
export const getProveedores = () => proveedores.listar();
export const getProveedor = (id) => proveedores.obtener(id);
export const guardarProveedor = (p) => proveedores.guardar(p);

// ---------- Materias primas ----------
export const getMateriasPrimas = () => materias.listar();
export const guardarMateriaPrima = (mp) => materias.guardar(mp);
export const bajoMinimo = (mp) => Number(mp.stock) < Number(mp.stockMinimo);

async function sumarStock(codigo, cantidad) {
  const [mp] = await materias.listar((m) => m.codigo === codigo);
  if (mp) await materias.guardar({ ...mp, stock: Number(mp.stock) + Number(cantidad) });
}

// ---------- Órdenes de compra ----------
export const totalOrden = (oc) =>
  (oc.items || []).reduce((t, i) => t + Number(i.cantidad || 0) * Number(i.precio || 0), 0);

export const getOrdenes = () =>
  ordenes.listar().then((l) => l.sort((a, b) => b.id - a.id));
export const getOrden = (id) => ordenes.obtener(id);

/** Alta o modificación (solo en borrador). enviar=true la pasa a "pendiente de aprobación". */
export async function guardarOrden(oc, usuario, { enviar = false } = {}) {
  const nueva = oc.id == null;
  if (!nueva) {
    const previa = await ordenes.obtener(oc.id);
    if (previa.estado !== 'borrador') throw new Error('Solo se puede editar una orden en borrador');
  }
  const total = await ordenes.listar();
  const base = nueva
    ? { numero: numerar('OC', total.length + 1), fecha: hoy(), creadoPor: usuario, historial: [] }
    : await ordenes.obtener(oc.id);
  const historial = [
    ...(base.historial || []),
    { fecha: ahoraISO(), usuario, accion: nueva ? 'Creada' : 'Modificada' },
    ...(enviar ? [{ fecha: ahoraISO(), usuario, accion: 'Enviada a aprobación' }] : []),
  ];
  return ordenes.guardar({ ...base, ...oc, estado: enviar ? 'pendiente' : 'borrador', historial });
}

// Transiciones permitidas: estado actual -> acción -> estado nuevo
export const TRANSICIONES = {
  borrador: { enviar: 'pendiente', cancelar: 'cancelada' },
  pendiente: { aprobar: 'aprobada', rechazar: 'borrador', cancelar: 'cancelada' },
  aprobada: { recibir: 'recibida', cancelar: 'cancelada' },
  recibida: {},
  cancelada: {},
};

const TEXTO_ACCION = {
  enviar: 'Enviada a aprobación',
  aprobar: 'Aprobada',
  rechazar: 'Devuelta a borrador',
  cancelar: 'Cancelada',
  recibir: 'Recibida',
};

/**
 * Cambia el estado de una OC. Al recibirla genera una recepción por ítem,
 * que queda pendiente de inspección de Calidad (el stock suma recién cuando Calidad aprueba).
 * datos.lotes: { [codigo]: loteProveedor } (solo para "recibir"). datos.comentario: opcional.
 */
export async function cambiarEstadoOrden(id, accion, usuario, datos = {}) {
  const oc = await ordenes.obtener(id);
  const nuevo = TRANSICIONES[oc.estado]?.[accion];
  if (!nuevo) throw new Error(`No se puede "${accion}" una orden ${oc.estado}`);

  if (accion === 'recibir') {
    let n = (await recepciones.listar()).length;
    for (const item of oc.items) {
      n += 1;
      await recepciones.guardar({
        numero: numerar('REC', n),
        ordenId: oc.id,
        codigo: item.codigo,
        cantidad: Number(item.cantidad),
        loteProveedor: datos.lotes?.[item.codigo] || '',
        fecha: ahoraISO(),
        recibidoPor: usuario,
        estado: 'pendiente',
        calidad: null,
      });
    }
  }

  const accionTxt = TEXTO_ACCION[accion] + (datos.comentario ? ` · ${datos.comentario}` : '');
  return ordenes.guardar({
    ...oc,
    estado: nuevo,
    historial: [...(oc.historial || []), { fecha: ahoraISO(), usuario, accion: accionTxt }],
  });
}

// ---------- Recepciones (ingreso de materia prima) ----------
export const getRecepciones = (filtro) =>
  recepciones.listar(filtro).then((l) => l.sort((a, b) => b.id - a.id));

/**
 * Dictamen de Calidad sobre una recepción. decision: 'aprobado' | 'rechazado' | 'quitar'.
 * Aprobar suma el stock; quitar una aprobación lo descuenta.
 */
export async function dictaminarRecepcion(id, { decision, comentario = '' }, usuario) {
  const rec = await recepciones.obtener(id);
  if (rec.estado === 'aprobado' && decision !== 'aprobado') await sumarStock(rec.codigo, -rec.cantidad);
  if (rec.estado !== 'aprobado' && decision === 'aprobado') await sumarStock(rec.codigo, rec.cantidad);

  return recepciones.guardar({
    ...rec,
    estado: decision === 'quitar' ? 'pendiente' : decision,
    calidad: decision === 'quitar' ? null : { usuario, fecha: ahoraISO(), comentario: comentario.trim() },
  });
}

// ---------- Datos de ejemplo ----------
export async function reiniciarDatosCompras() {
  await Promise.all([proveedores, materias, ordenes, recepciones].map((c) => c.reiniciar()));
}
