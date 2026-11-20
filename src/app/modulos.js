// Registro de módulos del MES.
// Agregar un módulo = sumar una entrada acá + su carpeta en src/modules/<key> con routes.jsx.
// Las solapas / selector de módulos (ModuloNav), el Sidebar (menú) y la pantalla de inicio se arman solos con esta lista.
import {
  // faCartShopping, // (Compras, oculto)
  faClipboardList,
  faFlask,
  faGears,
  faWarehouse,
  faUserCheck,
  faScrewdriverWrench,
  faClipboardCheck,
  faClockRotateLeft,
  // faFileInvoiceDollar, // (Compras, oculto)
  faFlaskVial,
  faGaugeHigh,
  faHouse,
  faIndustry,
  faListCheck,
  // faTruckRampBox, // (Compras, oculto)
  // faBoxesStacked, // (Compras, oculto)
  // faTruckField, // (Compras, oculto)
} from '@fortawesome/free-solid-svg-icons';
import { CONFIG } from '@/modules/monitoreo/config';
import { iconoArea } from '@/modules/monitoreo/lib/rooms';

// Ítems del menú de Elaboración: un acceso por PLC de cada área (Elaboración y Aerosoles)
const menuPlcs = () =>
  CONFIG.AREAS.flatMap((a) =>
    a.plcs.map((plc) => ({
      to: `/elaboracion/${a.key}/${plc}`,
      label: `PLC ${plc} · ${a.label}`,
      sub: `Últimas elaboraciones de ${a.label} ${plc}`,
      icono: iconoArea(a.key),
    })),
  );

/**
 * corta      descripción breve (globo de "Entrar" en inicio y tooltip de las solapas)
 * key        primer segmento de la ruta (/programacion, /calidad, /elaboracion, /monitoreo, /produccion, /auditoria, /compras, /administracion)
 * permiso    permiso necesario para entrar (null = público). Ver PERMISOS en shared/lib/auth.js
 * menu       ítems del sidebar: { to, label, sub, icono, end }
 * menuSalas  true: el sidebar agrega el árbol de salas/PLC (en vivo) debajo de los ítems
 */
export const MODULOS = [
  {
    key: 'programacion',
    label: 'Programación',
    descripcion: 'Órdenes de producción leídas de Bejerman y su prioridad por línea.',
    corta: 'Órdenes y prioridad por línea',
    icono: faClipboardList,
    permiso: 'programacion.ver',
    menu: [
      { to: '/programacion', label: 'Órdenes de producción', sub: 'Prioridad por línea', icono: faClipboardList, end: true },
    ],
  },
  {
    key: 'calidad',
    label: 'Calidad',
    descripcion: 'Revisión de cantidades de las órdenes, liberación de lotes elaborados e inspección de materia prima.',
    corta: 'Revisión y liberación de lotes',
    icono: faClipboardCheck,
    permiso: 'calidad.ver',
    menu: [
      { to: '/calidad', label: 'Panel de calidad', sub: 'Indicadores', icono: faGaugeHigh, end: true },
      { to: '/calidad/ordenes', label: 'Órdenes a revisar', sub: 'Cantidades antes de elaborar', icono: faClipboardList },
      { to: '/calidad/pendientes', label: 'Lotes a liberar', sub: 'Producción sin revisar', icono: faListCheck },
      { to: '/calidad/ingresos', label: 'Ingresos de MP', sub: 'Recepciones a inspeccionar', icono: faFlaskVial },
      { to: '/calidad/decisiones', label: 'Registro de decisiones', sub: 'Aprobados y rechazados', icono: faClockRotateLeft },
    ],
  },
  {
    key: 'elaboracion',
    label: 'Elaboración',
    descripcion: 'Elaboraciones de cada PLC (Elaboración y Aerosoles), historial y etiqueta digital de cada lote.',
    corta: 'Elaboraciones por PLC',
    icono: faGears,
    permiso: 'elaboracion.ver',
    menu: [
      { to: '/elaboracion', label: 'Todos los PLC', sub: 'Últimas elaboraciones', icono: faGears, end: true },
      ...menuPlcs(),
      { to: '/elaboracion/historial', label: 'Historial de elaboraciones', sub: 'Todos los PLC', icono: faClockRotateLeft },
    ],
  },
  {
    key: 'monitoreo',
    label: 'Monitoreo',
    descripcion: 'Salas y PLC en vivo y receta en curso.',
    corta: 'Salas y PLC en vivo',
    icono: faIndustry,
    permiso: null,
    menuSalas: true,
    menu: [],
  },
  {
    key: 'produccion',
    label: 'Producción',
    descripcion: 'Tolvas de cada línea: en uso, en espera por prioridad y cambio de tolva con lectura del código.',
    corta: 'Tolvas y cambio de tolva',
    icono: faWarehouse,
    permiso: 'produccion.ver',
    menu: [
      { to: '/produccion', label: 'Tolvas por línea', sub: 'Cambio de tolva', icono: faWarehouse, end: true },
    ],
  },
  {
    key: 'auditoria',
    label: 'Auditoría',
    descripcion: 'Control documental de cada tolva aprobada por Calidad que salió a Producción.',
    corta: 'Control documental de tolvas',
    icono: faUserCheck,
    permiso: 'auditoria.ver',
    menu: [
      { to: '/auditoria', label: 'Tolvas a controlar', sub: 'Control documental', icono: faUserCheck, end: true },
    ],
  },
  // Compras: oculto por ahora (no aparece en inicio, solapas ni menú). Las rutas siguen en router.jsx.
  // {
  //   key: 'compras',
  //   label: 'Compras',
  //   descripcion: 'Órdenes de compra, proveedores y stock de materias primas.',
  //   corta: 'Órdenes de compra y stock',
  //   icono: faCartShopping,
  //   permiso: 'compras.ver',
  //   menu: [
  //     { to: '/compras', label: 'Panel de compras', sub: 'Indicadores', icono: faGaugeHigh, end: true },
  //     { to: '/compras/ordenes', label: 'Órdenes de compra', sub: 'Alta, aprobación y recepción', icono: faFileInvoiceDollar },
  //     { to: '/compras/materias-primas', label: 'Materias primas', sub: 'Stock y punto de pedido', icono: faBoxesStacked },
  //     { to: '/compras/proveedores', label: 'Proveedores', sub: 'Padrón', icono: faTruckField },
  //     { to: '/compras/recepciones', label: 'Recepciones', sub: 'Ingresos y dictamen de calidad', icono: faTruckRampBox },
  //   ],
  // },
  {
    key: 'administracion',
    label: 'Administración',
    descripcion: 'Maestro de tolvas: receta de cada producto a partir de su código.',
    corta: 'Recetas del maestro de tolvas',
    icono: faScrewdriverWrench,
    permiso: 'admin.ver',
    menu: [
      { to: '/administracion/tolvas', label: 'Maestro de tolvas', sub: 'Recetas por código', icono: faFlask },
    ],
  },
];

// Menú de la pantalla de inicio (sin módulo activo)
export const MODULO_INICIO = {
  key: 'inicio',
  label: 'Inicio',
  icono: faHouse,
  permiso: null,
  menu: MODULOS.map((m) => ({ to: '/' + m.key, label: m.label, sub: m.descripcion, icono: m.icono })),
};

export const moduloDeRuta = (pathname) =>
  MODULOS.find((m) => pathname === '/' + m.key || pathname.startsWith('/' + m.key + '/')) || MODULO_INICIO;
