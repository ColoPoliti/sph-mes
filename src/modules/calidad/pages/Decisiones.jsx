import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import { Campo, Card, Encabezado, EstadoConsulta } from '@/shared/components/base';
import { BOTON, INPUT, TD, TH } from '@/shared/components/clases';
import { ChipEstado } from '@/shared/components/ui';
import { descargarCSV } from '@/shared/lib/csv';
import { fechaCorta } from '@/shared/lib/format';
import { areaDe } from '@/modules/monitoreo/config';
import { REVISADOS, useLotesCalidad } from '../lib/useLotesCalidad';
import FiltroPeriodo from '../components/FiltroPeriodo';

const fechaHora = (iso) => (iso ? new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

/** Registro de decisiones de Calidad sobre lotes de producción (trazabilidad / auditoría). */
export default function Decisiones() {
  const { filas, cargando, error, periodo, setPeriodo } = useLotesCalidad(29);
  const [decision, setDecision] = useState('todas');

  const revisados = useMemo(
    () =>
      filas
        .filter((l) => REVISADOS.includes(l.estado) && (decision === 'todas' || l.estado === decision))
        .sort((a, b) => String(b.calidad?.fecha).localeCompare(String(a.calidad?.fecha))),
    [filas, decision],
  );

  const exportar = () =>
    descargarCSV('decisiones-calidad.csv', revisados, [
      { titulo: 'Lote', valor: (l) => l.id },
      { titulo: 'Producto', valor: (l) => l.nombre_producto },
      { titulo: 'Código de barras', valor: (l) => l.codigo_barra },
      { titulo: 'Sector', valor: (l) => areaDe(l.area)?.label || l.area },
      { titulo: 'PLC', valor: (l) => l.sala },
      { titulo: 'Decisión', valor: (l) => l.estado },
      { titulo: 'Revisó', valor: (l) => l.calidad?.usuario },
      { titulo: 'Fecha revisión', valor: (l) => l.calidad?.fecha },
      { titulo: 'Comentario', valor: (l) => l.calidad?.comentario },
    ]);

  return (
    <div className="flex flex-col gap-4">
      <Encabezado
        titulo="Registro de decisiones"
        descripcion="Quién aprobó o rechazó cada lote, cuándo y por qué."
        icono={faClockRotateLeft}
        acciones={
          <button type="button" className={BOTON.secundario} onClick={exportar} disabled={!revisados.length}>
            <FontAwesomeIcon icon={faFileCsv} aria-hidden="true" />
            Exportar
          </button>
        }
      />

      <FiltroPeriodo periodo={periodo} setPeriodo={setPeriodo}>
        <Campo etiqueta="Decisión">
          <select className={INPUT} value={decision} onChange={(e) => setDecision(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </Campo>
      </FiltroPeriodo>

      <Card className="flex flex-col gap-2.5">
        <EstadoConsulta cargando={cargando && !filas.length} error={error} vacio={!cargando && !revisados.length} textoVacio="No hay decisiones en el período." />
        {revisados.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <caption className="sr-only">Decisiones de calidad</caption>
              <thead>
                <tr>
                  <th scope="col" className={`${TH} text-left`}>Lote</th>
                  <th scope="col" className={`${TH} text-left`}>Producto</th>
                  <th scope="col" className={`${TH} text-left`}>Sector / PLC</th>
                  <th scope="col" className={`${TH} text-left`}>Elaborado</th>
                  <th scope="col" className={`${TH} text-left`}>Revisó</th>
                  <th scope="col" className={`${TH} text-left`}>Comentario</th>
                  <th scope="col" className={`${TH} text-right`}>Decisión</th>
                </tr>
              </thead>
              <tbody>
                {revisados.map((l) => (
                  <tr key={l.id} className="border-t border-gray-200 dark:border-slate-800">
                    <td className={TD}>
                      <Link to={`/calidad/lotes/${l.id}`} className="font-bold text-teal-600 underline dark:text-teal-400">#{l.id}</Link>
                    </td>
                    <td className={TD}>{l.nombre_producto}</td>
                    <td className={TD}>{areaDe(l.area)?.label || l.area} {l.sala}</td>
                    <td className={`${TD} whitespace-nowrap tabular-nums`}>{fechaCorta(l.inicio)}</td>
                    <td className={TD}>
                      {l.calidad?.usuario || '—'}
                      <br />
                      <span className="text-[13px] tabular-nums text-gray-500 dark:text-slate-400">{fechaHora(l.calidad?.fecha)}</span>
                    </td>
                    <td className={`${TD} max-w-[280px] text-[14px]`}>{l.calidad?.comentario || '—'}</td>
                    <td className={`${TD} whitespace-nowrap text-right`}><ChipEstado estado={l.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
