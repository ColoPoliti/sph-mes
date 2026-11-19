import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStamp } from '@fortawesome/free-solid-svg-icons';
import DataTable from '@/shared/components/DataTable';
import { ESTADOS_RECEPCION, cantidad } from '../lib/estados';
import { ChipRecepcion } from './Chips';
import Tooltip from '@/shared/components/Tooltip';

const fechaHora = (iso) =>
  iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/**
 * Ingresos de materia prima. La usan Compras (solo lectura) y Calidad (onDictaminar: botón de dictamen).
 * mp: índice por código; orden: índice por id.
 */
export default function TablaRecepciones({ filas, mp, orden, onDictaminar }) {
  const columnas = [
    { id: 'numero', titulo: 'Ingreso', valor: (r) => r.numero, clase: 'font-bold' },
    {
      id: 'orden',
      titulo: 'Orden',
      valor: (r) => orden[r.ordenId]?.numero,
      celda: (r) =>
        orden[r.ordenId] ? (
          <Tooltip texto={`Ver la orden de compra ${orden[r.ordenId].numero}`}><Link to={`/compras/ordenes/${r.ordenId}`} className="font-bold text-teal-600 underline dark:text-teal-400">
            {orden[r.ordenId].numero}
          </Link></Tooltip>
        ) : (
          '—'
        ),
    },
    {
      id: 'mp',
      titulo: 'Materia prima',
      valor: (r) => mp[r.codigo]?.nombre || r.codigo,
      texto: (r) => r.codigo,
      celda: (r) => (
        <>
          {mp[r.codigo]?.nombre || r.codigo}
          <br />
          <span className="codigo text-[14px] text-gray-600 dark:text-slate-300">{r.codigo}</span>
        </>
      ),
    },
    {
      id: 'cantidad',
      titulo: 'Cantidad',
      alinear: 'right',
      valor: (r) => Number(r.cantidad),
      celda: (r) => cantidad(r.cantidad, mp[r.codigo]?.unidad),
      clase: 'whitespace-nowrap tabular-nums',
    },
    {
      id: 'lote',
      titulo: 'Lote proveedor',
      valor: (r) => r.loteProveedor,
      clase: 'codigo font-bold tabular-nums text-violet-700 dark:text-violet-300',
    },
    {
      id: 'recibido',
      titulo: 'Recibido',
      valor: (r) => r.fecha,
      texto: (r) => fechaHora(r.fecha),
      celda: (r) => fechaHora(r.fecha),
      clase: 'whitespace-nowrap tabular-nums',
    },
    {
      id: 'dictamen',
      titulo: 'Dictamen',
      valor: (r) => r.calidad?.usuario,
      texto: (r) => r.calidad?.comentario,
      celda: (r) =>
        r.calidad ? (
          <>
            {r.calidad.usuario} · <span className="tabular-nums">{fechaHora(r.calidad.fecha)}</span>
            {r.calidad.comentario && (
              <span className="block text-[14px] text-red-600 dark:text-red-400">{r.calidad.comentario}</span>
            )}
          </>
        ) : (
          '—'
        ),
    },
    {
      id: 'estado',
      titulo: 'Estado',
      alinear: 'right',
      valor: (r) => ESTADOS_RECEPCION[r.estado]?.texto || r.estado,
      celda: (r) => <ChipRecepcion estado={r.estado} />,
      clase: 'whitespace-nowrap',
    },
    ...(onDictaminar
      ? [
          {
            id: 'accion',
            titulo: 'Acción',
            alinear: 'center',
            celda: (r) => (
              <Tooltip className="contents" texto="Aprobar o rechazar el ingreso">
                <button
                  type="button"
                  onClick={() => onDictaminar(r)}
                  aria-label={`Dictaminar el ingreso ${r.numero}`}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-lg text-sky-600 transition-colors hover:bg-gray-100 dark:text-sky-400 dark:hover:bg-slate-800"
                >
                  <FontAwesomeIcon icon={faStamp} aria-hidden="true" />
                </button>
              </Tooltip>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      titulo="Recepciones de materia prima"
      columnas={columnas}
      filas={filas}
      clave={(r) => r.id}
      minWidth={900}
      exportar="recepciones-materia-prima.csv"
    />
  );
}
