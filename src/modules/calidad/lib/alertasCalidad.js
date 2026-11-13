// Ventanas de SweetAlert2 para la aprobación de lotes por Calidad.
// Estilos y toast compartidos en shared/lib/alertas.js.
import { areaDe } from '@/modules/monitoreo/config';
import { icon } from '@fortawesome/fontawesome-svg-core';
import { CHIP_BASE, CHIP_ESTADO, CHIP_VARIANTS, estadoChip } from '@/shared/lib/estados';
import { fechaCorta, mmss } from '@/shared/lib/format';
import { CLASES, alerta, esc, toast } from '@/shared/lib/alertas';

export const toastCalidad = toast;

// Segunda línea de las ventanas: solo el producto (el número de lote va en el título)
const nombreLote = (f) => esc(f.nombre_producto);

// Cómo se nombra el registro en los títulos ("lote #1052"); otros módulos pasan fila.ref (ej.: "ingreso REC-0003")
const ref = (f) => f.ref || `lote #${f.id}`;

/**
 * Pregunta qué hacer con el lote: Aprobar / Rechazar / Cancelar.
 * Si rechaza, pide un comentario opcional.
 * Devuelve { decision: 'aprobado' } | { decision: 'rechazado', comentario }
 * | { decision: 'quitar' } (lote ya rechazado: quitar el rechazo) | null (canceló).
 */
export async function preguntarDecision(fila) {
  // Un lote ya rechazado no se puede volver a rechazar: solo Aprobar o Cancelar,
  // y se muestra el motivo del rechazo anterior
  const yaRechazado = fila.estado === 'rechazado';
  const motivo = fila.calidad?.comentario;
  const avisoRechazo = yaRechazado
    ? `<div class="mt-3 rounded-md border border-current bg-red-500/15 px-3 py-2 text-left text-red-700 dark:bg-red-400/15 dark:text-red-300">
        <div class="text-[13px] font-bold uppercase tracking-[0.6px]">Rechazado por calidad</div>
        ${motivo ? `<div class="whitespace-pre-wrap">${esc(motivo)}</div>` : ''}
      </div>`
    : '';

  const r = await alerta.fire({
    icon: 'question',
    title: `¿Desea aprobar el ${ref(fila)}?`,
    html: nombreLote(fila) + avisoRechazo,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Aprobar',
    // Ya rechazado: en lugar de "Rechazar" ofrece "Quitar rechazo" (vuelve a quedar sin revisar)
    denyButtonText: yaRechazado ? 'Quitar rechazo' : 'Rechazar',
    cancelButtonText: 'Cancelar',
    focusCancel: true,
    customClass: yaRechazado ? { ...CLASES, denyButton: CLASES.quitarButton } : CLASES,
  });

  if (r.isConfirmed) return { decision: 'aprobado' };
  if (!r.isDenied) return null;
  if (yaRechazado) return { decision: 'quitar' };

  const c = await alerta.fire({
    icon: 'warning',
    title: `Rechazar ${ref(fila)}`,
    html: nombreLote(fila),
    input: 'textarea',
    inputLabel: 'Comentario (opcional)',
    inputPlaceholder: 'Motivo del rechazo…',
    showCancelButton: true,
    confirmButtonText: 'Rechazar',
    cancelButtonText: 'Cancelar',
    customClass: { ...CLASES, confirmButton: CLASES.denyButton },
  });

  return c.isConfirmed ? { decision: 'rechazado', comentario: c.value || '' } : null;
}

// Al apagar el switch de un lote aprobado
export async function confirmarQuitarAprobacion(fila) {
  const r = await alerta.fire({
    icon: 'warning',
    title: `¿Quitar la aprobación del ${ref(fila)}?`,
    html: nombreLote(fila),
    showCancelButton: true,
    confirmButtonText: 'Quitar aprobación',
    cancelButtonText: 'Cancelar',
    focusCancel: true,
  });
  return r.isConfirmed;
}

// Modal con los datos del lote y la decisión de Calidad
export function mostrarInfoLote(fila) {
  const area = areaDe(fila.area);
  const cal = fila.calidad;
  // Estado como chip, con los mismos colores que en la tabla
  const { tipo, texto, icono } = estadoChip(fila.estado);
  const iconoSvg = icon(icono, { classes: ['mr-1.5'] }).html.join('');
  const estadoHtml = `<span class="${CHIP_BASE} ${CHIP_VARIANTS[tipo]} ${CHIP_ESTADO}">${iconoSvg}${esc(texto)}</span>`;

  const filas = [
    ['Producto', fila.nombre_producto],
    ['Lote', `#${fila.id}`],
    ['Código de barras', fila.codigo_barra],
    ['Sector / PLC', `${area ? area.label : fila.area} ${fila.sala}`],
    ['Inicio', fila.inicio ? fechaCorta(fila.inicio) : '—'],
    ['Fin', fila.fin ? fechaCorta(fila.fin) : '—'],
    ['Tiempo total', mmss(fila.tiempo_total_s)],
    ['Estado', { html: estadoHtml }],
  ];
  if (cal) {
    filas.push(['Revisó', cal.usuario || '—']);
    filas.push(['Fecha de revisión', cal.fecha ? new Date(cal.fecha).toLocaleString('es-AR') : '—']);
  }

  const tabla = filas
    .map(
      ([k, v]) =>
        `<tr class="border-t border-gray-200 dark:border-slate-800">
          <th class="py-2 pr-3 text-left align-top text-[13px] font-bold uppercase tracking-[0.6px] text-gray-500 dark:text-slate-400">${esc(k)}</th>
          <td class="py-2 text-left font-semibold text-gray-900 dark:text-white">${v && v.html ? v.html : esc(v)}</td>
        </tr>`,
    )
    .join('');

  const comentario = cal?.comentario
    ? `<div class="mt-3 rounded-md border border-current bg-red-500/15 px-3 py-2 text-left text-[16px] text-red-700 dark:bg-red-400/15 dark:text-red-300">
        <div class="text-[13px] font-bold uppercase tracking-[0.6px]">Comentario</div>
        <div class="whitespace-pre-wrap">${esc(cal.comentario)}</div>
      </div>`
    : '';

  return alerta.fire({
    title: 'Información del lote',
    html: `<table class="w-full text-[16px]"><tbody>${tabla}</tbody></table>${comentario}`,
    confirmButtonText: 'Cerrar',
    customClass: {
      ...CLASES,
      confirmButton: CLASES.cancelButton,
      // X para cerrar arriba a la derecha
      closeButton:
        '!text-4xl !text-gray-500 hover:!text-gray-900 focus:!shadow-none dark:!text-slate-400 dark:hover:!text-white',
    },
    width: 520,
    showCloseButton: true,
    closeButtonHtml: '&times;',
  });
}
