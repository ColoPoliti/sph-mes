// Colores de estado de las tarjetas de inicio, validados contra el fondo de las cards
// en modo claro y oscuro. Siempre van acompañados de un texto: el color nunca informa solo.
const COLORES = {
  ok: 'bg-emerald-600',
  alerta: 'bg-yellow-500 dark:bg-yellow-400',
  mal: 'bg-red-600 dark:bg-red-700',
  marca: 'bg-violet-600 dark:bg-violet-500',
  neutro: 'bg-gray-400 dark:bg-slate-500',
};

export const colorEstado = (estado) => COLORES[estado] || COLORES.neutro;

// Los mismos colores para los tramos del gráfico de dona (SVG)
const TRAZOS = {
  ok: 'stroke-emerald-600',
  alerta: 'stroke-yellow-500 dark:stroke-yellow-400',
  mal: 'stroke-red-600 dark:stroke-red-700',
  neutro: 'stroke-gray-400 dark:stroke-slate-500',
};

export const trazoEstado = (estado) => TRAZOS[estado] || TRAZOS.neutro;
