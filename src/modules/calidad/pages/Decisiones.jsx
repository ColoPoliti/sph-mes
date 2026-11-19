import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faFileCsv } from '@fortawesome/free-solid-svg-icons';
import { Campo, Card, Encabezado, EstadoConsulta } from '@/shared/components/base';
import DataTable from '@/shared/components/DataTable';
import { BOTON, INPUT } from '@/shared/components/clases';
import { ChipEstado } from '@/shared/components/ui';
import { descargarCSV } from '@/shared/lib/csv';
import { fechaCorta } from '@/shared/lib/format';
import { areaDe } from '@/modules/monitoreo/config';
import { REVISADOS, useLotesCalidad } from '../lib/useLotesCalidad';
import FiltroPeriodo from '../components/FiltroPeriodo';
import Tooltip from '@/shared/components/Tooltip';

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

  const columnas = [
    {
      id: 'lote',
      titulo: 'Lote',
      valor: (l) => l.id,
      celda: (l) => <Tooltip texto={`Ver la etiqueta digital del lote #${l.id}`}><Link to={`/calidad/lotes/${l.id}`} className="font-bold text-teal-600 underline dark:text-teal-400">#{l.id}</Link></Tooltip>,
    },
    { id: 'producto', titulo: 'Producto', valor: (l) => l.nombre_producto },
    { id: 'sector', titulo: 'Sector / PLC', valor: (l) => `${areaDe(l.area)?.label || l.area} ${l.sala}` },
    {
      id: 'elaborado',
      titulo: 'Elaborado',
      valor: (l) => l.inicio,
      texto: (l) => fechaCorta(l.inicio),
      celda: (l) => fechaCorta(l.inicio),
      clase: 'whitespace-nowrap tabular-nums',
    },
    {
      id: 'reviso',
      titulo: 'Revisó',
      valor: (l) => l.calidad?.usuario,
      texto: (l) => fechaHora(l.calidad?.fecha),
      celda: (l) => (
        <>
          {l.calidad?.usuario || '—'}
          <br />
          <span className="text-[14px] tabular-nums text-gray-600 dark:text-slate-300">{fechaHora(l.calidad?.fecha)}</span>
        </>
      ),
    },
    { id: 'comentario', titulo: 'Comentario', valor: (l) => l.calidad?.comentario, clase: 'max-w-[280px] text-[14px]' },
    {
      id: 'decision',
      titulo: 'Decisión',
      alinear: 'right',
      valor: (l) => l.estado,
      celda: (l) => <ChipEstado estado={l.estado} />,
      clase: 'whitespace-nowrap',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
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
          <DataTable titulo="Decisiones de calidad" columnas={columnas} filas={revisados} clave={(l) => l.id} minWidth={900} />
        )}
      </Card>
    </div>
  );
}
