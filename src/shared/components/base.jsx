// Piezas de UI comunes a todos los módulos, con los estilos del monitor original.
// Las clases sueltas (CARD, INPUT, BOTON...) se exportan para casos que no encajan en un componente.
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faInbox } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import AnimatedCounter from './AnimatedCounter';
import { labelClass, subClass } from './ui';

import { CARD, CAMPO } from './clases';

// ---------- Componentes ----------

/** Card estándar. `as` permite usar section/form/article. */
export function Card({ as: Tag = 'section', className = '', children, ...props }) {
  return (
    <Tag className={`${CARD} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

/** Título de card: etiqueta en mayúsculas con ícono y, opcional, acciones a la derecha. */
export function CardTitulo({ icono, children, extra, acciones }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className={`${labelClass} flex items-center gap-2`}>
        {icono && <FontAwesomeIcon icon={icono} aria-hidden="true" />}
        {children}
      </span>
      {extra && <span className={subClass}>{extra}</span>}
      {acciones && <div className="ml-auto flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

/** Encabezado de página: título, descripción y acciones (botones). */
export function Encabezado({ titulo, descripcion, icono, acciones }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-center gap-3">
        {icono && (
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-violet-600 text-white shadow-sm">
            <FontAwesomeIcon icon={icono} className="text-lg" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="m-0 truncate text-xl font-extrabold sm:text-2xl">{titulo}</h1>
          {descripcion && <p className={`m-0 ${subClass}`}>{descripcion}</p>}
        </div>
      </div>
      {acciones && <div className="ml-auto flex flex-wrap items-center gap-2.5">{acciones}</div>}
    </div>
  );
}

const TONOS_KPI = {
  teal: 'text-teal-600 dark:text-teal-400',
  violeta: 'text-violet-600 dark:text-violet-400',
  ambar: 'text-amber-600 dark:text-amber-400',
  rojo: 'text-red-600 dark:text-red-400',
  cielo: 'text-sky-600 dark:text-sky-400',
  verde: 'text-emerald-600 dark:text-emerald-400',
};

/** Indicador numérico. `to` lo convierte en link (ej.: a la lista filtrada). */
export function Kpi({ titulo, valor, decimales = 0, sufijo, detalle, icono, tono = 'teal', to }) {
  const contenido = (
    <>
      <span className={`${labelClass} flex items-center gap-2`}>
        {icono && <FontAwesomeIcon icon={icono} className={TONOS_KPI[tono]} aria-hidden="true" />}
        {titulo}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className={`text-[34px] font-extrabold leading-none tabular-nums ${TONOS_KPI[tono]}`}>
          {typeof valor === 'number' ? <AnimatedCounter value={valor} decimals={decimales} /> : valor}
        </span>
        {sufijo && <span className="text-[15px] font-bold text-gray-500 dark:text-slate-400">{sufijo}</span>}
      </span>
      {detalle && <span className="text-[13px] font-medium text-gray-500 dark:text-slate-400">{detalle}</span>}
    </>
  );
  const clase = `${CARD} flex flex-col gap-2`;
  return to ? (
    <Link to={to} className={`${clase} transition-transform hover:-translate-y-0.5`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

/** Grilla de KPIs responsive */
export function GrillaKpi({ children }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

/** Mensaje de estado de una consulta: cargando, error o vacío. Devuelve null si no hay nada que decir. */
export function EstadoConsulta({ cargando, error, vacio, textoVacio = 'No hay datos para mostrar.' }) {
  if (error) {
    return (
      <p role="alert" className="m-0 text-sm font-medium text-red-600 dark:text-red-400">
        No se pudo consultar ({error.message}).
      </p>
    );
  }
  if (cargando) return <p className={`m-0 ${subClass}`}>Cargando…</p>;
  if (vacio) {
    return (
      <p className="m-0 flex items-center gap-2 py-4 text-[15px] font-medium text-gray-500 dark:text-slate-400">
        <FontAwesomeIcon icon={faInbox} aria-hidden="true" />
        {textoVacio}
      </p>
    );
  }
  return null;
}

/** Nota informativa (mismo estilo que las notas del historial / etiqueta digital) */
export function Nota({ children }) {
  return (
    <p className="m-0 flex items-start gap-2 text-[15px] font-light text-gray-500 dark:text-slate-400">
      <FontAwesomeIcon icon={faCircleInfo} className="mt-[3px] flex-none text-violet-600 dark:text-violet-400" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Campo de formulario con etiqueta */
export function Campo({ etiqueta, children, className = CAMPO }) {
  return (
    <label className={className}>
      <span className={labelClass}>{etiqueta}</span>
      {children}
    </label>
  );
}
