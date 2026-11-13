// Clases Tailwind comunes (cards, inputs, tablas, botones), con los estilos del monitor original.
// Van en un archivo aparte de los componentes para no romper el Fast Refresh de Vite.

export const CARD =
  'rounded-[14px] bg-white/70 dark:bg-slate-900/60 shadow-md dark:shadow-none px-4 py-[18px] sm:px-[22px]';
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
