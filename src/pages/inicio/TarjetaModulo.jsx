import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faLock, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import AnimatedCounter from '@/shared/components/AnimatedCounter';
import { labelClass, subClass } from '@/shared/components/ui';
import { colorEstado } from './colores';
import Grafico from './Graficos';

/** Dato secundario al pie de la tarjeta. `aviso` agrega un punto de color junto al valor. */
function Dato({ etiqueta, valor, aviso }) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-0.5 text-center">
      <dt className="text-[13px] font-medium leading-tight text-gray-600 [overflow-wrap:anywhere] dark:text-slate-300">{etiqueta}</dt>
      <dd className="m-0 flex items-center justify-center gap-1.5 text-[15px] font-extrabold leading-tight tabular-nums text-gray-900 dark:text-white">
        {aviso && <span className={`h-2 w-2 flex-none rounded-full ${colorEstado(aviso)}`} aria-hidden="true" />}
        <span className="truncate">{valor}</span>
      </dd>
    </div>
  );
}

/** Contenido con indicadores: número principal, gráfico y datos secundarios. */
function Indicadores({ resumen }) {
  return (
    <>
      {/* Número centrado y su descripción en un badge con texto blanco: slate 600 en modo claro, slate 800 en oscuro */}
      {resumen.unidad && (
        <p className="m-0 flex flex-col items-center gap-2 text-center">
          <span className="text-5xl font-extrabold leading-none text-gray-900 dark:text-white">
            <AnimatedCounter value={resumen.valor} decimals={0} />
          </span>
          <span className="max-w-full rounded-md bg-slate-600 px-2 py-0.5 text-[12px] font-normal uppercase leading-tight text-white dark:bg-slate-800">
            {resumen.unidad}
          </span>
        </p>
      )}
      <Grafico {...resumen.grafico} />
      {/* Calidad y Compras no llevan datos secundarios */}
      {resumen.datos && (
        <dl className="m-0 grid grid-cols-3 gap-3 border-t border-gray-200 pt-3 dark:border-white/[.12]">
          {resumen.datos.map((d) => (
            <Dato key={d.etiqueta} {...d} />
          ))}
        </dl>
      )}
    </>
  );
}

/** Lugar reservado mientras llega la primera respuesta, para que la tarjeta no salte. */
function Cargando() {
  return (
    <div className="flex flex-1 animate-pulse flex-col gap-4 motion-reduce:animate-none" role="status">
      <span className="sr-only">Cargando indicadores…</span>
      <span className="block h-[74px] w-1/2 self-center bg-gray-200 dark:bg-slate-800" />
      <span className="block min-h-16 flex-1 bg-gray-200 dark:bg-slate-800" />
      <span className="block h-9 bg-gray-200 dark:bg-slate-800" />
    </div>
  );
}

/** Tarjeta de un módulo en la pantalla de inicio: acceso e indicadores principales. */
export default function TarjetaModulo({ modulo, resumen, cargando, bloqueado, conSesion }) {
  let cuerpo;
  if (bloqueado) {
    cuerpo = (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className={`m-0 ${subClass}`}>{modulo.descripcion}</p>
        <p className="m-0 text-[14px] font-medium text-gray-600 dark:text-slate-300">
          <FontAwesomeIcon icon={faLock} className="mr-2" aria-hidden="true" />
          {conSesion ? 'Tu perfil no tiene acceso a este módulo.' : 'Iniciá sesión para ver sus indicadores.'}
        </p>
      </div>
    );
  } else if (resumen) {
    cuerpo = <Indicadores resumen={resumen} />;
  } else if (cargando) {
    cuerpo = <Cargando />;
  } else {
    cuerpo = (
      <p className="m-0 flex flex-1 flex-col items-center justify-center gap-2 text-center text-[14px] font-medium text-gray-600 dark:text-slate-300">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-xl text-amber-600 dark:text-amber-400" aria-hidden="true" />
        No se pudieron consultar los indicadores.
      </p>
    );
  }

  return (
    <Link
      to={'/' + modulo.key}
      title={modulo.descripcion}
      // Estilo "Dashtreme": sin borde, sombra suave y encabezado y pie separados por una línea.
      // Al pasar el mouse la tarjeta se eleva y gana sombra.
      className="group flex min-h-[320px] flex-col rounded-md bg-white/70 shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.16)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:bg-slate-900/60 dark:hover:bg-slate-900 dark:hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
    >
      {/* Encabezado: ícono y título en blanco (en modo claro, gris oscuro) */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3.5 text-gray-600 dark:border-white/[.12] dark:text-slate-300">
        <FontAwesomeIcon icon={modulo.icono} className="w-5 flex-none text-lg" aria-hidden="true" />
        <h2 className="m-0 min-w-0 flex-1 truncate text-[17px] font-bold">{modulo.label}</h2>
        {bloqueado && <FontAwesomeIcon icon={faLock} className="text-sm opacity-60" aria-label="Requiere iniciar sesión" />}
      </div>

      {/* El contenido queda centrado en vertical, sea cual sea su alto */}
      <div className="flex flex-1 flex-col justify-center gap-4 px-5 py-4">{cuerpo}</div>

      {/* Pie separado con la misma línea del encabezado. "Entrar": blanco en modo oscuro y gris oscuro en modo claro */}
      <div
        className={`${labelClass} flex items-center justify-end gap-2 rounded-b-md border-t border-gray-200 px-5 py-3 transition-colors duration-200 group-hover:bg-slate-100 dark:border-white/[.12] dark:group-hover:bg-white/[.05]`}
      >
        <span className="text-gray-900 dark:text-white">Entrar</span>
        <FontAwesomeIcon
          icon={faArrowRight}
          className="text-gray-900 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none dark:text-white"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
