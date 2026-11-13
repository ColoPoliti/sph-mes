// Registro de módulos del MES.
// Agregar un módulo = sumar una entrada acá + su carpeta en src/modules/<key> con routes.jsx.
// El TopBar (pestañas), el Sidebar (menú) y la pantalla de inicio se arman solos con esta lista.
import {
  faCartShopping,
  faClipboardCheck,
  faClockRotateLeft,
  faFileInvoiceDollar,
  faFlaskVial,
  faGaugeHigh,
  faHouse,
  faIndustry,
  faListCheck,
  faTruckRampBox,
  faBoxesStacked,
  faTruckField,
} from '@fortawesome/free-solid-svg-icons';

/**
 * key        primer segmento de la ruta (/monitoreo, /calidad, /compras)
 * permiso    permiso necesario para entrar (null = público). Ver PERMISOS en shared/lib/auth.js
 * menu       ítems del sidebar: { to, label, sub, icono, end }
 * menuSalas  true: el sidebar agrega el árbol de salas/PLC (en vivo) debajo de los ítems
 */
export const MODULOS = [
  {
    key: 'monitoreo',
    label: 'Monitoreo',
    descripcion: 'Salas y PLC en vivo, receta en curso e historial de elaboraciones.',
    icono: faIndustry,
    permiso: null,
    menuSalas: true,
    menu: [
      { to: '/monitoreo/historial', label: 'Historial de elaboraciones', sub: 'Todas las salas', icono: faClockRotateLeft },
    ],
  },
  {
    key: 'calidad',
    label: 'Calidad',
    descripcion: 'Liberación de lotes de producción e inspección de materia prima recibida.',
    icono: faClipboardCheck,
    permiso: 'calidad.ver',
    menu: [
      { to: '/calidad', label: 'Panel de calidad', sub: 'Indicadores', icono: faGaugeHigh, end: true },
      { to: '/calidad/pendientes', label: 'Lotes a liberar', sub: 'Producción sin revisar', icono: faListCheck },
      { to: '/calidad/ingresos', label: 'Ingresos de MP', sub: 'Recepciones a inspeccionar', icono: faFlaskVial },
      { to: '/calidad/decisiones', label: 'Registro de decisiones', sub: 'Aprobados y rechazados', icono: faClockRotateLeft },
    ],
  },
  {
    key: 'compras',
    label: 'Compras',
    descripcion: 'Órdenes de compra, proveedores y stock de materias primas.',
    icono: faCartShopping,
    permiso: 'compras.ver',
    menu: [
      { to: '/compras', label: 'Panel de compras', sub: 'Indicadores', icono: faGaugeHigh, end: true },
      { to: '/compras/ordenes', label: 'Órdenes de compra', sub: 'Alta, aprobación y recepción', icono: faFileInvoiceDollar },
      { to: '/compras/materias-primas', label: 'Materias primas', sub: 'Stock y punto de pedido', icono: faBoxesStacked },
      { to: '/compras/proveedores', label: 'Proveedores', sub: 'Padrón', icono: faTruckField },
      { to: '/compras/recepciones', label: 'Recepciones', sub: 'Ingresos y dictamen de calidad', icono: faTruckRampBox },
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
