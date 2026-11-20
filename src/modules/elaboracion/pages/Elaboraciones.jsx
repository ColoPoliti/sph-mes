import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Card, CardTitulo, Nota } from '@/shared/components/base';
import { BOTON } from '@/shared/components/clases';
import LotesTable from '@/shared/components/LotesTable';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { CONFIG, areaDe, roomKey } from '@/modules/monitoreo/config';
import { useMonitor } from '@/modules/monitoreo/context/MonitorContext';
import { getHistorial, getUltimas } from '@/modules/monitoreo/lib/api';
import { enEspera, enLinea, iconoArea, subSala } from '@/modules/monitoreo/lib/rooms';

// Cantidad de elaboraciones que se listan (por PLC o de todos juntos)
const LIMITE = 20;

// Color del cuadradito de estado: mismo criterio que el árbol de PLC del monitor
const colorEstado = (s, now) =>
  !enLinea(s, now) ? 'bg-red-500' : enEspera(s) ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-emerald-500';

/** Card chica de un PLC: área a la que pertenece, nombre y estado en vivo. Click = filtrar por ese PLC. */
function CardPlc({ area, plc, activa }) {
  const { rooms, now } = useMonitor();
  const s = rooms[roomKey(area.key, plc)];
  const estado = subSala(s, now);
  const producto = enLinea(s, now) && !enEspera(s) ? s?.receta?.producto?.nombre : '';

  return (
    <Link
      // Click en la card activa: vuelve a "todos los PLC"
      to={activa ? '/elaboracion' : `/elaboracion/${area.key}/${plc}`}
      aria-current={activa ? 'page' : undefined}
      aria-label={`PLC ${plc} · ${area.label} · ${estado}`}
      title={activa ? 'Ver todos los PLC' : `Ver las elaboraciones del PLC ${plc} de ${area.label}`}
      className={`flex min-w-0 flex-col gap-1.5 rounded-md border bg-white/70 px-3.5 py-3 shadow-md transition-transform hover:-translate-y-0.5 dark:bg-slate-900/60 dark:shadow-none ${
        activa
          ? 'border-teal-600 ring-1 ring-teal-600 dark:border-teal-400 dark:ring-teal-400'
          : 'border-transparent'
      }`}
    >
      <span className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[1px] text-gray-600 dark:text-slate-300">
        <FontAwesomeIcon icon={iconoArea(area.key)} className="w-3.5 flex-none" aria-hidden="true" />
        <span className="truncate">{area.label}</span>
      </span>
      <span className="text-lg font-extrabold leading-tight text-gray-900 dark:text-white">PLC {plc}</span>
      <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-gray-600 dark:text-slate-300">
        <span className={`h-2 w-2 flex-none rounded-[2px] ${colorEstado(s, now)}`} aria-hidden="true" />
        <span className="truncate">{estado}</span>
      </span>
      {producto && (
        <span className="truncate text-[13px] font-semibold text-violet-700 dark:text-violet-300">
          {String(producto).toUpperCase()}
        </span>
      )}
    </Link>
  );
}

/**
 * Elaboraciones de los PLC (antes en Monitoreo): cards de cada PLC arriba y debajo sus últimas
 * elaboraciones. Sin PLC elegido (/elaboracion) se listan las de todos; con /elaboracion/:area/:plc, las de ese.
 * Click en el Id de un lote abre su etiqueta digital (/elaboracion/lotes/:id).
 */
export default function Elaboraciones() {
  const { area: areaKey, plc } = useParams();
  const { lotesVersion } = useMonitor();
  const area = areaKey ? areaDe(areaKey) : null;
  const elegido = !!areaKey;
  const valido = !elegido || (area && area.plcs.includes(plc));

  const { datos: filas, cargando, error } = useConsulta(
    () => {
      if (!valido) return [];
      return elegido ? getUltimas({ area: areaKey, sala: plc, limit: LIMITE }) : getHistorial({ limit: LIMITE });
    },
    [areaKey, plc, lotesVersion],
    { inicial: [], intervaloMs: 60000 },
  );

  const titulo = elegido && area ? `${area.label} · PLC ${plc}` : 'Todos los PLC';

  let aviso = '';
  if (!valido) aviso = `No existe el PLC ${plc} en ${area?.label || areaKey}.`;
  else if (error) aviso = 'No se pudo consultar la base de datos (' + error.message + ').';
  else if (!cargando && filas.length === 0)
    aviso = elegido ? 'Todavía no hay elaboraciones registradas para este PLC.' : 'Todavía no hay elaboraciones registradas.';

  return (
    <div className="flex flex-col gap-6">
      {/* Cards de los PLC, agrupadas por área en el orden de CONFIG.AREAS */}
      <nav aria-label="PLC" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CONFIG.AREAS.flatMap((a) =>
          a.plcs.map((p) => (
            <CardPlc key={roomKey(a.key, p)} area={a} plc={p} activa={a.key === areaKey && p === plc} />
          )),
        )}
      </nav>

      <Card aria-label="Últimas elaboraciones" className="flex flex-col gap-2.5">
        <CardTitulo
          icono={faClockRotateLeft}
          extra={cargando && filas.length === 0 && valido ? 'Buscando…' : titulo}
          acciones={
            <Link to="/elaboracion/historial" className={BOTON.secundario}>
              Historial completo
            </Link>
          }
        >
          Últimas elaboraciones
        </CardTitulo>

        {filas.length > 0 && <LotesTable filas={filas} conSala={!elegido} minWidth={elegido ? 600 : 720} compacta />}

        {aviso && (
          <div
            className={`flex flex-col items-center justify-center gap-3 py-8 text-center text-[15px] font-medium ${
              error || !valido ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-slate-300'
            }`}
          >
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl" aria-hidden="true" />
            <span>{aviso}</span>
          </div>
        )}

        <Nota>
          {elegido ? `Se muestran las últimas ${LIMITE} de este PLC` : `Se muestran las últimas ${LIMITE} de todos los PLC`}
          {' · '}click en un lote para ver su etiqueta digital
        </Nota>
      </Card>
    </div>
  );
}
