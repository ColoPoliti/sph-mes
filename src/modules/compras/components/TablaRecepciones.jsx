import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStamp } from '@fortawesome/free-solid-svg-icons';
import { TD, TH } from '@/shared/components/clases';
import { cantidad } from '../lib/estados';
import { ChipRecepcion } from './Chips';

const fechaHora = (iso) =>
  iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/**
 * Ingresos de materia prima. La usan Compras (solo lectura) y Calidad (onDictaminar: botón de dictamen).
 * mp: índice por código; orden: índice por id.
 */
export default function TablaRecepciones({ filas, mp, orden, onDictaminar }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <caption className="sr-only">Recepciones de materia prima</caption>
        <thead>
          <tr>
            <th scope="col" className={`${TH} text-left`}>Ingreso</th>
            <th scope="col" className={`${TH} text-left`}>Orden</th>
            <th scope="col" className={`${TH} text-left`}>Materia prima</th>
            <th scope="col" className={`${TH} text-right`}>Cantidad</th>
            <th scope="col" className={`${TH} text-left`}>Lote proveedor</th>
            <th scope="col" className={`${TH} text-left`}>Recibido</th>
            <th scope="col" className={`${TH} text-left`}>Dictamen</th>
            <th scope="col" className={`${TH} text-right`}>Estado</th>
            {onDictaminar && <th scope="col" className={`${TH} text-center`}>Acción</th>}
          </tr>
        </thead>
        <tbody>
          {filas.map((r) => (
            <tr key={r.id} className="border-t border-gray-200 dark:border-slate-800">
              <td className={`${TD} font-bold`}>{r.numero}</td>
              <td className={TD}>
                {orden[r.ordenId] ? (
                  <Link to={`/compras/ordenes/${r.ordenId}`} className="font-bold text-teal-600 underline dark:text-teal-400">
                    {orden[r.ordenId].numero}
                  </Link>
                ) : '—'}
              </td>
              <td className={TD}>
                {mp[r.codigo]?.nombre || r.codigo}
                <br />
                <span className="text-[13px] text-gray-500 dark:text-slate-400">{r.codigo}</span>
              </td>
              <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>{cantidad(r.cantidad, mp[r.codigo]?.unidad)}</td>
              <td className={`${TD} font-bold tabular-nums text-violet-700 dark:text-violet-300`}>{r.loteProveedor || '—'}</td>
              <td className={`${TD} whitespace-nowrap tabular-nums`}>{fechaHora(r.fecha)}</td>
              <td className={TD}>
                {r.calidad ? (
                  <>
                    {r.calidad.usuario} · <span className="tabular-nums">{fechaHora(r.calidad.fecha)}</span>
                    {r.calidad.comentario && (
                      <span className="block text-[13px] text-red-600 dark:text-red-400">{r.calidad.comentario}</span>
                    )}
                  </>
                ) : '—'}
              </td>
              <td className={`${TD} whitespace-nowrap text-right`}><ChipRecepcion estado={r.estado} /></td>
              {onDictaminar && (
                <td className={`${TD} text-center`}>
                  <button
                    type="button"
                    onClick={() => onDictaminar(r)}
                    aria-label={`Dictaminar el ingreso ${r.numero}`}
                    title="Aprobar / rechazar"
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-lg text-sky-600 transition-colors hover:bg-gray-100 dark:text-sky-400 dark:hover:bg-slate-800"
                  >
                    <FontAwesomeIcon icon={faStamp} aria-hidden="true" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
