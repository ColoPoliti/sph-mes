import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNodes, faGears, faMicrochip } from '@fortawesome/free-solid-svg-icons';
import AnimatedCounter from '@/shared/components/AnimatedCounter';
import { CARD, ESTADOS_KPI } from '@/shared/components/clases';
import { labelClass } from '@/shared/components/ui';
import { ROLES } from '@/shared/lib/auth';

const TONOS = {
  ok: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  activo: 'text-violet-600 dark:text-violet-400',
  inactivo: 'text-gray-500 dark:text-slate-400',
};

const VALOR = 'text-[18px] font-extrabold leading-none';

/** Círculo de estado; late en los estados ok y activo, igual que en los KPI. */
function Punto({ estado }) {
  const { circulo } = ESTADOS_KPI[estado];
  return (
    <span className="relative flex h-3.5 w-3.5 flex-none" aria-hidden="true">
      {(estado === 'ok' || estado === 'activo') && (
        <span className={`absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden ${circulo}`} />
      )}
      <span className={`relative h-3.5 w-3.5 rounded-full ${circulo}`} />
    </span>
  );
}

/** Una de las cuatro secciones de la card: etiqueta a la izquierda y valor a la derecha. */
function Celda({ etiqueta, icono, to, className = '', children }) {
  const clase = `flex min-h-[60px] min-w-0 items-center justify-between gap-3 border-gray-200 px-5 py-3 dark:border-white/[.12] xl:px-4 ${className}`;
  const contenido = (
    <>
      <span className={`${labelClass} flex min-w-0 items-center gap-2`} title={etiqueta}>
        <FontAwesomeIcon icon={icono} className="flex-none text-gray-400 dark:text-slate-500" aria-hidden="true" />
        <span className="truncate">{etiqueta}</span>
      </span>
      <span className="flex flex-none items-center gap-2">{children}</span>
    </>
  );
  return to ? (
    <Link to={to} className={`${clase} transition-colors hover:bg-gray-100 dark:hover:bg-slate-800/50`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

/** Cantidad de PLC con su círculo. El texto va en el tooltip y para lectores de pantalla. */
function DatoPlc({ valor, texto, circulo, color }) {
  return (
    <span className="flex items-center gap-1.5" title={`${valor} ${texto}`}>
      <span className={`h-2.5 w-2.5 flex-none rounded-full ${circulo}`} aria-hidden="true" />
      <span className={`${VALOR} tabular-nums ${color}`}>
        <AnimatedCounter value={valor} decimals={0} />
      </span>
      <span className="sr-only">{texto}</span>
    </span>
  );
}

/**
 * Card única con el estado de planta: MES y sesión, broker, salas produciendo y PLC.
 * Cuatro secciones en fila (de a dos en tablet, una debajo de otra en celular), separadas por una línea sutil.
 */
export default function EstadoPlanta({ usuario, rol, mqttOk, produciendo, enLinea, fueraDeLinea }) {
  const broker = mqttOk ? 'ok' : 'error';
  const salas = produciendo > 0 ? 'activo' : 'inactivo';
  const sesion = usuario ? `${usuario} (${ROLES[rol] || rol})` : 'Sin sesión';

  return (
    <section aria-label="Estado de planta" className={`${CARD} grid grid-cols-1 overflow-hidden !p-0 sm:grid-cols-2 xl:grid-cols-[repeat(4,auto)]`}>
      {/* "MES · usuario (rol)" en una línea. El nombre completo y el texto de la sesión van en el tooltip */}
      <div
        className="flex min-h-[60px] min-w-0 items-center gap-2 px-5 py-3 xl:px-4"
        title={`Manufacturing Execution System · ${
          usuario ? `Sesión iniciada como ${sesion}` : 'Monitoreo es de libre consulta. Para el resto de los módulos iniciá sesión.'
        }`}
      >
        <h1 className="m-0 flex-none text-lg font-extrabold leading-none">
          <span
            className="bg-gradient-to-r from-teal-600 to-violet-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-violet-400"
            aria-hidden="true"
          >
            MES
          </span>
          <span className="sr-only">Manufacturing Execution System</span>
        </h1>
        <span className="text-gray-400 dark:text-slate-500" aria-hidden="true">·</span>
        <span className="min-w-0 truncate text-[13px] font-medium text-gray-500 dark:text-slate-400">
          {usuario && <span className="sr-only">Sesión iniciada como </span>}
          {sesion}
        </span>
      </div>

      <Celda etiqueta="Broker" icono={faCircleNodes} className="border-t sm:border-l sm:border-t-0">
        <Punto estado={broker} />
        <span className={`${VALOR} ${TONOS[broker]}`}>{mqttOk ? 'Conectado' : 'Sin conexión'}</span>
      </Celda>

      <Celda etiqueta="Produciendo" icono={faGears} to="/monitoreo" className="border-t xl:border-l xl:border-t-0">
        <Punto estado={salas} />
        <span className={`${VALOR} ${TONOS[salas]}`}>
          <AnimatedCounter value={produciendo} decimals={0} />
        </span>
        <span className="text-[13px] font-bold text-gray-500 dark:text-slate-400">{produciendo === 1 ? 'sala' : 'salas'}</span>
      </Celda>

      <Celda etiqueta="PLC" icono={faMicrochip} className="border-t sm:border-l xl:border-t-0">
        <span className="flex items-center gap-4">
          <DatoPlc valor={enLinea} texto="en línea" circulo="bg-emerald-500 dark:bg-emerald-400" color={TONOS.ok} />
          <DatoPlc
            valor={fueraDeLinea}
            texto="fuera de línea"
            circulo={fueraDeLinea ? 'bg-red-500 dark:bg-red-400' : 'bg-gray-300 dark:bg-slate-600'}
            color={fueraDeLinea ? TONOS.error : 'text-gray-700 dark:text-slate-200'}
          />
        </span>
      </Celda>
    </section>
  );
}
