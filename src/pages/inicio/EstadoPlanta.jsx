import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNodes, faGears, faIndustry, faMicrochip } from '@fortawesome/free-solid-svg-icons';
import AnimatedCounter from '@/shared/components/AnimatedCounter';
import { ESTADOS_KPI } from '@/shared/components/clases';
import { ROLES } from '@/shared/lib/auth';

/**
 * Colores por estado (los mismos de antes y de los KPI): fondo tintado, anillo del ícono y tono del valor.
 * ok = verde, error = rojo, parcial = naranja, activo = violeta de la marca, inactivo = gris.
 * Fondo medio transparente (10 %) del color del estado.
 */
const PALETA = {
  ok: {
    fondo: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    anillo: 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400',
    valor: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    fondo: 'bg-red-500/10 dark:bg-red-400/10',
    anillo: 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400',
    valor: 'text-red-600 dark:text-red-400',
  },
  parcial: {
    fondo: 'bg-orange-500/10 dark:bg-orange-400/10',
    anillo: 'border-orange-500 text-orange-500 dark:border-orange-400 dark:text-orange-400',
    valor: 'text-orange-600 dark:text-orange-400',
  },
  activo: {
    fondo: 'bg-violet-500/10 dark:bg-violet-400/10',
    anillo: 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400',
    valor: 'text-violet-600 dark:text-violet-400',
  },
  inactivo: {
    fondo: 'bg-gray-500/10 dark:bg-slate-400/10',
    anillo: 'border-gray-400 text-gray-500 dark:border-slate-500 dark:text-slate-400',
    valor: 'text-gray-600 dark:text-slate-300',
  },
};

// En celular las tarjetas se estiran para llenar la card (todas las cards tienen el mismo alto)
const TARJETA = 'flex min-h-[64px] min-w-0 items-center gap-3 rounded-xl px-4 py-3 max-sm:flex-1';
const ICONO = 'flex h-10 w-10 flex-none items-center justify-center rounded-full border-2 text-[16px]';
const VALOR = 'text-[18px] font-bold leading-none tabular-nums';

/** Círculo de estado; late en los estados ok y activo, igual que en los KPI. */
function Punto({ estado }) {
  const { circulo } = ESTADOS_KPI[estado];
  return (
    <span className="relative flex h-3.5 w-3.5 flex-none self-center" aria-hidden="true">
      {(estado === 'ok' || estado === 'activo') && (
        <span className={`absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden ${circulo}`} />
      )}
      <span className={`relative h-3.5 w-3.5 rounded-full ${circulo}`} />
    </span>
  );
}

/** Tarjeta: ícono en círculo con anillo, etiqueta arriba y el valor (children) abajo. */
function Tarjeta({ estado, icono, etiqueta, title, children }) {
  const p = PALETA[estado];
  const clase = `${TARJETA} ${p.fondo}`;
  const contenido = (
    <>
      <span className={`${ICONO} bg-white dark:bg-slate-900 ${p.anillo}`} aria-hidden="true">
        <FontAwesomeIcon icon={icono} />
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-[13px] font-medium text-gray-700 dark:text-slate-300">{etiqueta}</span>
        <span className="flex min-w-0 items-baseline gap-2">{children}</span>
      </span>
    </>
  );
  return (
    <div className={clase} title={title}>
      {contenido}
    </div>
  );
}

/** Cantidad de PLC con su círculo. El texto va en el tooltip y para lectores de pantalla. */
function DatoPlc({ valor, texto, circulo, color }) {
  return (
    <span className="flex items-center gap-1.5" title={`${valor} ${texto}`}>
      <span className={`h-2.5 w-2.5 flex-none rounded-full ${circulo}`} aria-hidden="true" />
      <span className={`${VALOR} ${color}`}>
        <AnimatedCounter value={valor} decimals={0} />
      </span>
      <span className="sr-only">{texto}</span>
    </span>
  );
}

/**
 * Estado de planta: primera card de la grilla de inicio, con cuatro tarjetas (MES y sesión, broker, salas produciendo y PLC).
 * Las tarjetas van una debajo de otra; Produciendo es violeta con salas activas y gris sin producir.
 */
export default function EstadoPlanta({ usuario, rol, mqttOk, produciendo, enLinea, fueraDeLinea, className = '' }) {
  const broker = mqttOk ? 'ok' : 'error';
  const salas = produciendo > 0 ? 'activo' : 'inactivo';
  const plc = fueraDeLinea === 0 ? (enLinea > 0 ? 'ok' : 'inactivo') : enLinea > 0 ? 'parcial' : 'error';
  const sesion = usuario ? `${usuario} (${ROLES[rol] || rol})` : 'Sin sesión';

  return (
    <section
      aria-label="Estado de planta"
      className={`flex flex-col justify-between gap-3 rounded-md bg-white/70 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.1)] dark:bg-slate-900/60 ${className}`}
    >
      {/* Primera tarjeta: MES con el degradé de marca y la sesión. El texto completo va en el tooltip */}
      <div
        className={`${TARJETA} bg-gradient-to-r from-teal-600 to-violet-600 text-white`}
        title={`Manufacturing Execution System · ${
          usuario ? `Sesión iniciada como ${sesion}` : 'Monitoreo es de libre consulta. Para el resto de los módulos iniciá sesión.'
        }`}
      >
        <span className={`${ICONO} border-white bg-white/15 text-white`} aria-hidden="true">
          <FontAwesomeIcon icon={faIndustry} />
        </span>
        <span className="flex min-w-0 flex-col gap-1.5">
          <h1 className="m-0 text-[18px] font-extrabold leading-none">
            <span aria-hidden="true">MES</span>
            <span className="sr-only">Manufacturing Execution System</span>
          </h1>
          <span className="truncate text-[13px] font-semibold text-white/90">
            {usuario && <span className="sr-only">Sesión iniciada como </span>}
            {sesion}
          </span>
        </span>
      </div>

      <Tarjeta estado={broker} icono={faCircleNodes} etiqueta="Broker">
        <Punto estado={broker} />
        <span className={`${VALOR} truncate ${PALETA[broker].valor}`}>{mqttOk ? 'Conectado' : 'Sin conexión'}</span>
      </Tarjeta>

      <Tarjeta estado={salas} icono={faGears} etiqueta="Produciendo">
        <Punto estado={salas} />
        <span className={`${VALOR} ${PALETA[salas].valor}`}>
          <AnimatedCounter value={produciendo} decimals={0} />
        </span>
        <span className="text-[13px] font-bold text-gray-600 dark:text-slate-300">{produciendo === 1 ? 'sala' : 'salas'}</span>
      </Tarjeta>

      <Tarjeta estado={plc} icono={faMicrochip} etiqueta="PLC" title={`${enLinea} en línea · ${fueraDeLinea} fuera de línea`}>
        <span className="flex items-center gap-4">
          <DatoPlc valor={enLinea} texto="en línea" circulo="bg-emerald-500 dark:bg-emerald-400" color="text-emerald-600 dark:text-emerald-400" />
          <DatoPlc
            valor={fueraDeLinea}
            texto="fuera de línea"
            circulo={fueraDeLinea ? 'bg-red-500 dark:bg-red-400' : 'bg-gray-300 dark:bg-slate-600'}
            color={fueraDeLinea ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-slate-200'}
          />
        </span>
      </Tarjeta>
    </section>
  );
}
