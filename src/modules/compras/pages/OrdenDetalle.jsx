import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faBan,
  faClockRotateLeft,
  faFileInvoiceDollar,
  faListUl,
  faPaperPlane,
  faPen,
  faReply,
  faStamp,
  faTruckRampBox,
} from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitulo, EstadoConsulta } from '@/shared/components/base';
import { BOTON, TD, TH } from '@/shared/components/clases';
import { labelClass, subClass } from '@/shared/components/ui';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { CLASES, INPUT_MODAL, alerta, confirmar, esc, toast } from '@/shared/lib/alertas';
import { useSesion } from '@/shared/lib/auth';
import { TRANSICIONES, cambiarEstadoOrden, getMateriasPrimas, getOrden, getProveedor, getRecepciones, totalOrden } from '../lib/api';
import { cantidad, fechaAR, pesos } from '../lib/estados';
import { ChipOC, ChipRecepcion } from '../components/Chips';

// Acción -> botón, permiso necesario y confirmación
const ACCIONES = {
  enviar: { texto: 'Enviar a aprobación', icono: faPaperPlane, permiso: 'compras.editar', clase: BOTON.marca },
  aprobar: { texto: 'Aprobar', icono: faStamp, permiso: 'compras.aprobar', clase: BOTON.exito },
  rechazar: { texto: 'Devolver a borrador', icono: faReply, permiso: 'compras.aprobar', clase: BOTON.secundario, pideComentario: true },
  recibir: { texto: 'Registrar recepción', icono: faTruckRampBox, permiso: 'compras.editar', clase: BOTON.marca },
  cancelar: { texto: 'Cancelar orden', icono: faBan, permiso: 'compras.editar', clase: BOTON.peligro, peligro: true },
};

/** Modal de recepción: pide el lote del proveedor de cada ítem (trazabilidad para Calidad) */
async function pedirLotes(orden, mp) {
  const filas = orden.items
    .map(
      (it, i) => `<label class="mt-3 block text-left">
        <span class="text-[13px] font-bold uppercase tracking-[0.6px] text-gray-500 dark:text-slate-400">
          ${esc(it.codigo)} · ${esc(mp[it.codigo]?.nombre || '')} (${esc(cantidad(it.cantidad, mp[it.codigo]?.unidad))})
        </span>
        <input id="lote-${i}" class="${INPUT_MODAL}" placeholder="Lote del proveedor" />
      </label>`,
    )
    .join('');
  const r = await alerta.fire({
    icon: 'info',
    title: `Recepción de ${orden.numero}`,
    html: `<p class="m-0">Cada ítem queda <b>en inspección</b> hasta que Calidad lo libere.</p>${filas}`,
    showCancelButton: true,
    confirmButtonText: 'Registrar',
    cancelButtonText: 'Cancelar',
    customClass: CLASES,
    preConfirm: () =>
      Object.fromEntries(orden.items.map((it, i) => [it.codigo, document.getElementById(`lote-${i}`).value.trim()])),
  });
  return r.isConfirmed ? r.value : null;
}

async function pedirComentario(titulo) {
  const r = await alerta.fire({
    icon: 'warning',
    title: titulo,
    input: 'textarea',
    inputLabel: 'Motivo (opcional)',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
  });
  return r.isConfirmed ? { comentario: r.value || '' } : null;
}

export default function OrdenDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, puede } = useSesion();

  const { datos, cargando, error, recargar } = useConsulta(async () => {
    const orden = await getOrden(id);
    const [prov, materias, recepciones] = await Promise.all([
      getProveedor(orden.proveedorId).catch(() => null),
      getMateriasPrimas(),
      getRecepciones((r) => String(r.ordenId) === String(id)),
    ]);
    return { orden, prov, mp: Object.fromEntries(materias.map((m) => [m.codigo, m])), recepciones };
  }, [id]);

  if (!datos) return <EstadoConsulta cargando={cargando} error={error} />;
  const { orden, prov, mp, recepciones } = datos;

  const ejecutar = async (accion) => {
    const a = ACCIONES[accion];
    let extra = {};
    if (accion === 'recibir') {
      const lotes = await pedirLotes(orden, mp);
      if (!lotes) return;
      extra = { lotes };
    } else if (a.pideComentario) {
      const c = await pedirComentario(`${a.texto} ${orden.numero}`);
      if (!c) return;
      extra = c;
    } else if (!(await confirmar({ titulo: `¿${a.texto} ${orden.numero}?`, confirmar: a.texto, peligro: a.peligro }))) {
      return;
    }
    try {
      await cambiarEstadoOrden(orden.id, accion, usuario, extra);
      toast(`${orden.numero}: ${a.texto.toLowerCase()} ✓`, a.peligro ? 'rechazado' : 'aprobado');
      recargar();
    } catch (e) {
      toast(e.message, 'rechazado');
    }
  };

  const acciones = Object.keys(TRANSICIONES[orden.estado] || {}).filter((k) => puede(ACCIONES[k].permiso));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button type="button" onClick={() => navigate('/compras/ordenes')} className={BOTON.secundario}>
          <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
          Órdenes
        </button>
        <h1 className="m-0 text-2xl font-extrabold">{orden.numero}</h1>
        <ChipOC estado={orden.estado} />
        <div className="ml-auto flex flex-wrap gap-2.5">
          {orden.estado === 'borrador' && puede('compras.editar') && (
            <Link to={`/compras/ordenes/${orden.id}/editar`} className={BOTON.secundario}>
              <FontAwesomeIcon icon={faPen} aria-hidden="true" />
              Editar
            </Link>
          )}
          {acciones.map((k) => (
            <button key={k} type="button" className={ACCIONES[k].clase} onClick={() => ejecutar(k)}>
              <FontAwesomeIcon icon={ACCIONES[k].icono} aria-hidden="true" />
              {ACCIONES[k].texto}
            </button>
          ))}
        </div>
      </div>

      <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Proveedor', prov?.razonSocial || '—', prov ? `CUIT ${prov.cuit}` : ''],
          ['Emitida', fechaAR(orden.fecha), `por ${orden.creadoPor || '—'}`],
          ['Entrega pactada', fechaAR(orden.fechaEntrega), ''],
          ['Total', pesos(totalOrden(orden)), `${orden.items.length} ítems`],
        ].map(([k, v, s]) => (
          <div key={k} className="flex flex-col gap-1">
            <span className={labelClass}>{k}</span>
            <span className="text-[20px] font-extrabold">{v}</span>
            {s && <span className="text-[13px] text-gray-500 dark:text-slate-400">{s}</span>}
          </div>
        ))}
        {orden.observaciones && <p className={`m-0 sm:col-span-2 xl:col-span-4 ${subClass}`}>{orden.observaciones}</p>}
      </Card>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
        <Card className="flex flex-col gap-2.5 2xl:col-span-2">
          <CardTitulo icono={faListUl}>Ítems</CardTitulo>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  <th scope="col" className={`${TH} text-left`}>Materia prima</th>
                  <th scope="col" className={`${TH} text-right`}>Cantidad</th>
                  <th scope="col" className={`${TH} text-right`}>Precio unit.</th>
                  <th scope="col" className={`${TH} text-right`}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orden.items.map((it) => (
                  <tr key={it.codigo} className="border-t border-gray-200 dark:border-slate-800">
                    <td className={TD}>
                      {mp[it.codigo]?.nombre || it.codigo}
                      <br />
                      <span className="text-[13px] text-gray-500 dark:text-slate-400">{it.codigo}</span>
                    </td>
                    <td className={`${TD} text-right tabular-nums`}>{cantidad(it.cantidad, mp[it.codigo]?.unidad)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{pesos(it.precio)}</td>
                    <td className={`${TD} text-right font-bold tabular-nums`}>{pesos(it.cantidad * it.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recepciones.length > 0 && (
            <>
              <CardTitulo icono={faTruckRampBox}>Recepciones</CardTitulo>
              <ul className="m-0 flex list-none flex-col p-0">
                {recepciones.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-200 py-2 dark:border-slate-800">
                    <span className="font-bold">{r.numero}</span>
                    <span className="flex-1 text-[15px]">
                      {r.codigo} · lote {r.loteProveedor || 's/d'}
                    </span>
                    <ChipRecepcion estado={r.estado} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card className="flex flex-col gap-2.5">
          <CardTitulo icono={faClockRotateLeft}>Historial</CardTitulo>
          <ol className="m-0 flex list-none flex-col gap-3 border-l-2 border-teal-600 p-0 pl-4 dark:border-teal-400">
            {[...(orden.historial || [])].reverse().map((h, i) => (
              <li key={i} className="flex flex-col">
                <span className="text-[15px] font-bold">{h.accion}</span>
                <span className="text-[13px] text-gray-500 dark:text-slate-400">
                  {new Date(h.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: h.fecha.length > 10 ? 'short' : undefined })} · {h.usuario}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {acciones.length === 0 && orden.estado !== 'recibida' && orden.estado !== 'cancelada' && (
        <p className={`m-0 ${subClass}`}>
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2" aria-hidden="true" />
          Tu perfil no tiene acciones disponibles para esta orden.
        </p>
      )}
    </div>
  );
}
