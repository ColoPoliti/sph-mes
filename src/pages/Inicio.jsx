import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleNodes, faLock, faMicrochip, faGears } from '@fortawesome/free-solid-svg-icons';
import AnimatedCounter from '@/shared/components/AnimatedCounter';
import { MODULOS } from '@/app/modulos';
import { GrillaKpi, Kpi } from '@/shared/components/base';
import { CARD_RELLENO, ESTADOS_KPI } from '@/shared/components/clases';
import { labelClass, subClass } from '@/shared/components/ui';
import { useMonitor } from '@/modules/monitoreo/context/MonitorContext';
import { enEspera, enLinea } from '@/modules/monitoreo/lib/rooms';
import { ROLES, useSesion } from '@/shared/lib/auth';

/**
 * PLC en línea y fuera de línea juntos, en una card informativa (sin link), todo en una sola línea:
 * "PLC  ● 8  ● 2". El texto "en línea" / "fuera de línea" va en el tooltip y para lectores de pantalla.
 * Borde (y fondo sutil en modo claro) según el estado, igual que los KPI:
 * todos en línea = ok (verde), algunos fuera = parcial (naranja), ninguno en línea = error (rojo).
 */
function EstadoPlc({ enLinea: enLineaN, fueraDeLinea }) {
  const estilo = ESTADOS_KPI[enLineaN === 0 ? 'error' : fueraDeLinea > 0 ? 'parcial' : 'ok'];

  const dato = (valor, texto, circulo, color) => (
    <span className="flex items-center gap-1.5" title={`${valor} ${texto}`}>
      <span className={`h-2.5 w-2.5 flex-none rounded-full ${circulo}`} aria-hidden="true" />
      <span className={`text-[18px] font-extrabold leading-none tabular-nums ${color}`}>
        <AnimatedCounter value={valor} decimals={0} />
      </span>
      <span className="sr-only">{texto}</span>
    </span>
  );

  return (
    <div
      className={`rounded-none ${estilo.fondo} dark:bg-slate-900/60 ${CARD_RELLENO} ${estilo.borde} flex items-center justify-between gap-3 sm:col-span-2 xl:col-span-1`}
    >
      <span className={`${labelClass} flex items-center gap-2`}>
        <FontAwesomeIcon icon={faMicrochip} className="text-gray-400 dark:text-slate-500" aria-hidden="true" />
        PLC
      </span>
      <div className="flex flex-none items-center gap-4">
        {dato(enLineaN, 'en línea', 'bg-emerald-500 dark:bg-emerald-400', 'text-emerald-600 dark:text-emerald-400')}
        {dato(
          fueraDeLinea,
          'fuera de línea',
          fueraDeLinea ? 'bg-red-500 dark:bg-red-400' : 'bg-gray-300 dark:bg-slate-600',
          fueraDeLinea ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-slate-200',
        )}
      </div>
    </div>
  );
}

/** Pantalla de inicio: estado de planta en vivo y acceso a cada módulo. */
export default function Inicio() {
  const { rooms, now, mqttOk } = useMonitor();
  const { usuario, rol, puede } = useSesion();

  const salas = Object.values(rooms);
  const enLineaN = salas.filter((s) => enLinea(s, now)).length;
  const produciendo = salas.filter((s) => enLinea(s, now) && !enEspera(s)).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Título, Broker, Produciendo y PLC en una sola fila (escritorio); de a dos en tablet */}
      <GrillaKpi columnas={4}>
        {/* Card de título con el degradé de la marca (teal → violeta, como "Entrar"); texto en blanco */}
        {/* En una sola línea: "MES · usuario (rol)". El nombre completo y el texto de la sesión van en el tooltip */}
        <div
          className={`${CARD_RELLENO} flex min-w-0 items-center gap-2 rounded-none bg-gradient-to-r from-teal-600 to-violet-600 text-white sm:col-span-2 xl:col-span-1`}
          title={`Manufacturing Execution System · ${
            usuario
              ? `Sesión iniciada como ${usuario} (${ROLES[rol] || rol})`
              : 'Monitoreo es de libre consulta. Para el resto de los módulos iniciá sesión.'
          }`}
        >
          <h1 className="m-0 flex-none text-lg font-extrabold leading-none">
            <span aria-hidden="true">MES</span>
            <span className="sr-only">Manufacturing Execution System</span>
          </h1>
          <span className="text-white/60" aria-hidden="true">·</span>
          <span className="min-w-0 truncate text-[13px] font-medium text-white/85">
            {usuario ? (
              <>
                <span className="sr-only">Sesión iniciada como </span>
                {usuario} ({ROLES[rol] || rol})
              </>
            ) : (
              'Sin sesión'
            )}
          </span>
        </div>
        <Kpi
          titulo="Broker MQTT"
          valor={mqttOk ? 'Conectado' : 'Sin conexión'}
          estado={mqttOk ? 'ok' : 'error'}
          icono={faCircleNodes}
          compacto
        />
        <Kpi
          compacto
          titulo="Produciendo"
          valor={produciendo}
          sufijo="salas"
          // Con salas produciendo: violeta de la marca; sin salas produciendo: gris
          estado={produciendo > 0 ? 'activo' : 'inactivo'}
          icono={faGears}
          to="/monitoreo"
        />
        <EstadoPlc enLinea={enLineaN} fueraDeLinea={salas.length - enLineaN} />
      </GrillaKpi>

      {/* Cards de módulos: separadas de la fila de título y KPI con más aire (24 px del gap + 64 px de margen) */}
      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {MODULOS.map((m) => {
          const bloqueado = m.permiso && !puede(m.permiso);
          return (
            <Link
              key={m.key}
              to={'/' + m.key}
              // Estilo "Dashtreme": puntas rectas, sin borde, sombra suave y encabezado separado por una línea
              className="group flex flex-col rounded-none bg-white/70 shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-0.5 dark:bg-slate-900/60"
            >
              {/* Encabezado: ícono y título en blanco (en modo claro, gris oscuro) */}
              <div className="relative flex items-center gap-3 border-b border-gray-200 px-5 py-3.5 text-gray-900 dark:border-white/[.12] dark:text-white">
                {/* Borde izquierdo de 5 px, solo en el encabezado, con el degradé de la marca (teal → violeta) */}
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 w-[5px] bg-gradient-to-b from-teal-600 to-violet-600"
                  aria-hidden="true"
                />
                <FontAwesomeIcon icon={m.icono} className="w-5 flex-none text-lg" aria-hidden="true" />
                <h2 className="m-0 min-w-0 flex-1 truncate text-[17px] font-bold">{m.label}</h2>
                {bloqueado && (
                  <FontAwesomeIcon icon={faLock} className="text-sm opacity-60" aria-label="Requiere iniciar sesión" />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-4 px-5 py-4">
                <p className={`m-0 flex-1 ${subClass}`}>{m.descripcion}</p>
                {/* "Entrar", alineado a la derecha, con el degradé de la marca (en oscuro, tonos 400 para que se lea).
                    La flecha es un SVG: no toma el degradé de texto, va en el color final (violeta). */}
                <span className={`${labelClass} flex items-center justify-end gap-2`}>
                  <span className="bg-gradient-to-r from-teal-600 to-violet-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-violet-400">
                    Entrar
                  </span>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-violet-600 transition-transform group-hover:translate-x-1 dark:text-violet-400"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
