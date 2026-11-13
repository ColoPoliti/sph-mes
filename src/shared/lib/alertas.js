// SweetAlert2 con los estilos de la app (clases Tailwind; el "!" le gana al CSS de SweetAlert).
// Lo usan todos los módulos: confirmaciones, formularios cortos y toasts.
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const BOTON = 'mx-1 min-h-11 cursor-pointer rounded-lg px-5 py-1.5 text-[15px] font-bold transition-opacity hover:opacity-90';

export const CLASES = {
  popup: '!rounded-[14px] !bg-white !text-gray-900 dark:!bg-slate-900 dark:!text-white',
  title: '!text-xl !font-extrabold !text-gray-900 dark:!text-white',
  htmlContainer: '!text-[15px] !text-gray-600 dark:!text-slate-300',
  inputLabel: '!text-[13px] !font-bold !text-gray-600 dark:!text-slate-300',
  input:
    '!rounded-lg !border !border-gray-300 !bg-white !text-[15px] !text-gray-900 dark:!border-slate-700 dark:!bg-slate-950 dark:!text-white',
  actions: '!gap-y-2',
  confirmButton: `${BOTON} bg-sky-600 text-white dark:bg-sky-400 dark:text-gray-900`,
  denyButton: `${BOTON} bg-red-600 text-white dark:bg-red-400 dark:text-gray-900`,
  cancelButton: `${BOTON} border border-gray-300 bg-white text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white`,
  // "Quitar rechazo": ámbar suave, como los badges
  quitarButton: `${BOTON} border border-current bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300`,
  // Fondo más oscuro y desenfocado detrás de todos los modales
  container: '!bg-black/70 backdrop-blur-sm',
};

// Clase para inputs dentro del html de un modal
export const INPUT_MODAL =
  'mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[15px] text-gray-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export const alerta = Swal.mixin({ buttonsStyling: false, customClass: CLASES, reverseButtons: false });

export const esc = (t) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Confirmación simple. peligro: el botón de confirmar va en rojo. Devuelve true/false. */
export async function confirmar({ titulo, texto = '', confirmar: ok = 'Confirmar', peligro = false, icono = 'question' }) {
  const r = await alerta.fire({
    icon: icono,
    title: titulo,
    html: esc(texto),
    showCancelButton: true,
    confirmButtonText: ok,
    cancelButtonText: 'Cancelar',
    focusCancel: true,
    customClass: peligro ? { ...CLASES, confirmButton: CLASES.denyButton } : CLASES,
  });
  return r.isConfirmed;
}

// Toast arriba al centro, debajo del navbar (72px). tipo: 'aprobado' | 'rechazado' | 'neutro'
const TOAST_TIPO = {
  aprobado: { icon: 'success', borde: '!border-sky-500 dark:!border-sky-400' },
  rechazado: { icon: 'error', borde: '!border-red-500 dark:!border-red-400' },
  neutro: { icon: 'info', borde: '!border-gray-400 dark:!border-slate-500' },
};

export function toast(texto, tipo = 'neutro') {
  const t = TOAST_TIPO[tipo] || TOAST_TIPO.neutro;
  return Swal.fire({
    toast: true,
    position: 'top',
    icon: t.icon,
    // Aprobado: verde brillante (green-500) en el ícono; el resto, el color de SweetAlert
    ...(tipo === 'aprobado' ? { iconColor: '#22c55e' } : {}),
    title: texto,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    // Animación propia (tailwind.config.js): baja desde arriba y sube al irse
    showClass: { popup: 'animate-toast-in' },
    hideClass: { popup: 'animate-toast-out' },
    didOpen: (el) => {
      // Pausa el tiempo mientras el mouse está encima
      el.addEventListener('mouseenter', Swal.stopTimer);
      el.addEventListener('mouseleave', Swal.resumeTimer);
    },
    customClass: {
      container: '!top-[64px]',
      popup: `!rounded-[10px] !border !bg-white !text-gray-900 !shadow-lg dark:!bg-slate-800 dark:!text-white ${t.borde}`,
      title: '!text-[15px] !font-semibold !text-gray-900 dark:!text-white',
      timerProgressBar: tipo === 'rechazado' ? '!bg-red-500' : tipo === 'aprobado' ? '!bg-[#22c55e]' : '!bg-gray-400',
    },
  });
}
