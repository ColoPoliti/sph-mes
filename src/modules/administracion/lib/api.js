// API del maestro de tolvas (dato maestro / receta).
//
// Según el relevamiento: es una base que, a partir de un código, devuelve la receta
// (cantidades de alcohol, agua, glicerina, colorante, esencia). Hoy está en Excel y la idea
// es pasarlo a base de datos, administrado desde el perfil admin. Son las recetas de las
// tolvas de acero inoxidable que se usan en Fabricación.
//
// La receta tiene la misma forma que la que ya recibe el monitor por MQTT (AREA/SALA/receta):
//   { codigo_barra, producto: { nombre, sku }, insumos: [{ etapa, nombre, codigo_mp, sp }] }
// sp en kg (el colorante se carga y se muestra en ml, como en el monitor).
//
// Tolvas de 250 o 1000 kg: se carga UNA receta por producto, para 1000 kg (BASE_KG), y la
// de 250 kg se calcula proporcionalmente. El tamaño de tolva lo define Programación en la orden.
//
// PENDIENTE: endpoint de recetas en la API PHP (y que la query que hoy trae los líquidos
// para el PLC lea de esta tabla). PROVISORIO: se guardan en este navegador (localStorage),
// sin datos de ejemplo. Para conectar la API, reemplazar el cuerpo de cada función por
// http.get/post/put/del (shared/lib/http.js) sin tocar las pantallas.
import { recetasDemo } from '@/modules/calidad/lib/demo';
import { areaDe } from '@/modules/monitoreo/config';
import { DEMO } from '@/modules/monitoreo/lib/demo';
import { crearColeccion } from '@/shared/lib/almacen';

// Insumos de la receta = etapas de dosificación de Elaboración (0 a 4; la 5 es etiqueta y agitado)
const ELABORACION = areaDe('elaboracion');
export const INSUMOS = ELABORACION.etapas.slice(0, 5).map((nombre, etapa) => ({
  etapa,
  nombre,
  unidad: ELABORACION.unidades[etapa] || 'kg',
}));

// En modo demo (?demo) es otra colección, sembrada con recetas de ejemplo para los productos de las órdenes demo
const recetas = DEMO ? crearColeccion('admin.recetas.demo', () => recetasDemo(INSUMOS)) : crearColeccion('admin.recetas');

// Cantidad en la unidad de pantalla <-> kg (sp)
const FACTOR = { ml: 1000, kg: 1 };
export const aPantalla = (sp, unidad) =>
  sp === null || sp === undefined || sp === '' ? '' : Number(sp) * (FACTOR[unidad] || 1);
export const aKg = (v, unidad) => Number(v) / (FACTOR[unidad] || 1);

// Tamaños de tolva (kg) y tamaño para el que se carga la receta
export const TAMANOS_TOLVA = [250, 1000];
export const BASE_KG = 1000;

/** Insumos de la receta escalados a una tolva de `kg` (sp en kg). */
export const escalar = (receta, kg = BASE_KG) => {
  const f = Number(kg) / Number(receta?.base_kg || BASE_KG);
  return (receta?.insumos || []).map((i) => ({ ...i, sp: Number(i.sp || 0) * f }));
};

/** Suma de los insumos en kg. */
export const totalKg = (insumos) => (insumos || []).reduce((t, i) => t + Number(i.sp || 0), 0);

const normalizar = (c) => String(c ?? '').trim();

export const getRecetas = () =>
  recetas.listar().then((l) => l.sort((a, b) => a.codigo_barra.localeCompare(b.codigo_barra, 'es', { numeric: true })));

export const getReceta = (id) => recetas.obtener(id);

/** Receta correspondiente a un código (lo que va a consultar Fabricación). */
export const getRecetaPorCodigo = (codigo) =>
  recetas.listar((r) => r.codigo_barra === normalizar(codigo)).then((l) => l[0] || null);

/** Alta o modificación. El código no se puede repetir. */
export async function guardarReceta(receta, usuario) {
  const codigo = normalizar(receta.codigo_barra);
  if (!codigo) throw new Error('Falta el código.');
  if (!normalizar(receta.producto?.nombre)) throw new Error('Falta el nombre del producto.');
  const repetida = await getRecetaPorCodigo(codigo);
  if (repetida && String(repetida.id) !== String(receta.id)) {
    throw new Error(`Ya existe una receta con el código ${codigo}.`);
  }
  return recetas.guardar({
    ...receta,
    codigo_barra: codigo,
    base_kg: BASE_KG,
    producto: { nombre: normalizar(receta.producto.nombre), sku: normalizar(receta.producto.sku) },
    modificado: { usuario, fecha: new Date().toISOString() },
  });
}

export const eliminarReceta = (id) => recetas.eliminar(id);
