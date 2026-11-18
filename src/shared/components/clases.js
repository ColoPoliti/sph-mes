// Clases Tailwind comunes (cards, inputs, tablas, botones), con los estilos del monitor original.
// Van en un archivo aparte de los componentes para no romper el Fast Refresh de Vite.

// Sombra y relleno comunes; el fondo y la forma (puntas) los define cada variante.
export const CARD_RELLENO = 'shadow-md dark:shadow-none px-4 py-[18px] sm:px-[22px]';
const CARD_BASE = `bg-white/70 dark:bg-slate-900/60 ${CARD_RELLENO}`;
/** Card estándar, con puntas redondeadas (también los KPI). */
export const CARD = `rounded-md ${CARD_BASE}`;
/**
 * Estados de los KPI: borde de 1 px de la card, círculo y tono del valor.
 * `fondo`: tinte sutil del color del estado, solo en modo claro (en oscuro queda el fondo normal de las cards).
 * ok = verde, alerta = ámbar, error = rojo (mismos colores que el estado de los PLC en el menú);
 * parcial = naranja (ej.: algunos PLC en línea y otros no);
 * activo = violeta de la marca, inactivo = gris neutro (ej.: "Produciendo").
 * El círculo late en los estados ok y activo.
 */
export const ESTADOS_KPI = {
  ok: {
    tono: 'verde',
    borde: 'border border-emerald-500 dark:border-emerald-400/40',
    fondo: 'bg-emerald-50',
    circulo: 'bg-emerald-500 dark:bg-emerald-400',
  },
  alerta: {
    tono: 'ambar',
    borde: 'border border-amber-500 dark:border-amber-400/40',
    fondo: 'bg-amber-50',
    circulo: 'bg-yellow-500 dark:bg-yellow-400',
  },
  error: {
    tono: 'rojo',
    borde: 'border border-red-500 dark:border-red-400/40',
    fondo: 'bg-red-50',
    circulo: 'bg-red-500 dark:bg-red-400',
  },
  parcial: {
    tono: 'naranja',
    borde: 'border border-orange-500 dark:border-orange-400/40',
    fondo: 'bg-orange-50',
    circulo: 'bg-orange-500 dark:bg-orange-400',
  },
  activo: {
    tono: 'violeta',
    borde: 'border border-violet-500 dark:border-violet-400/40',
    fondo: 'bg-violet-50',
    circulo: 'bg-violet-500 dark:bg-violet-400',
  },
  inactivo: {
    tono: 'gris',
    borde: 'border border-gray-400 dark:border-slate-500/40',
    fondo: 'bg-gray-100',
    circulo: 'bg-gray-400 dark:bg-slate-500',
  },
};
export const INPUT =
  'min-h-11 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-200 dark:bg-slate-950 px-3 py-1.5 text-[15px] font-medium text-gray-900 dark:text-white';
export const CAMPO = 'flex min-w-[140px] flex-1 basis-[150px] flex-col gap-1.5';
export const TH =
  'px-1.5 py-2 text-[12px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400';
export const TD = 'px-1.5 py-2 align-middle text-[15px] font-medium';

const BOTON_BASE =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-[18px] py-1.5 text-[15px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50';
export const BOTON = {
  primario: `${BOTON_BASE} border-0 bg-violet-700 text-white hover:opacity-90 dark:bg-violet-300 dark:text-gray-900`,
  secundario: `${BOTON_BASE} border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700`,
  peligro: `${BOTON_BASE} border-0 bg-red-600 text-white hover:opacity-90 dark:bg-red-400 dark:text-gray-900`,
  exito: `${BOTON_BASE} border-0 bg-teal-600 text-white hover:opacity-90 dark:bg-teal-400 dark:text-gray-900`,
  // Degradé de marca (teal → violeta), para la acción principal de una pantalla
  marca: `${BOTON_BASE} border-0 bg-gradient-to-r from-teal-600 to-violet-600 text-white shadow-sm hover:from-teal-700 hover:to-violet-700`,
};
