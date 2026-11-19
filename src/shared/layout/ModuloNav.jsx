import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronLeft, faChevronRight, faLock, faXmark } from '@fortawesome/free-solid-svg-icons';
import { MODULOS, MODULO_INICIO, moduloDeRuta } from '@/app/modulos';
import { useSesion } from '@/shared/lib/auth';

/**
 * Módulos con su estado de permiso: primero los habilitados, al final los bloqueados
 * (se muestran con candado; al entrar, la ruta ofrece iniciar sesión).
 */
function useModulos() {
  const { puede } = useSesion();
  const lista = MODULOS.map((m) => ({ ...m, bloqueado: Boolean(m.permiso && !puede(m.permiso)) }));
  return [INICIO, ...lista.filter((m) => !m.bloqueado), ...lista.filter((m) => m.bloqueado)];
}

// Acceso a la pantalla inicial, siempre primero
const INICIO = {
  key: MODULO_INICIO.key,
  label: MODULO_INICIO.label,
  icono: MODULO_INICIO.icono,
  to: '/',
  end: true,
  bloqueado: false,
};

const titulo = (m) => (m.bloqueado ? `${m.label} · requiere permiso` : m.label);

/* ------------------------------------------------------------------ */
/* Escritorio (≥ lg): barra de solapas debajo del TopBar               */
/* ------------------------------------------------------------------ */

/**
 * Solapas de módulos, centradas. Si no entran, se desplazan en horizontal
 * (rueda del mouse, arrastre táctil o flechas) y la activa se trae sola a la vista.
 * El centrado usa márgenes automáticos en la primera y la última (no justify-center),
 * así cuando desbordan no se cortan las del principio.
 */
export function ModuloTabs({ className = '' }) {
  const modulos = useModulos();
  const { pathname } = useLocation();
  const scrollRef = useRef(null);
  const [bordes, setBordes] = useState({ izq: false, der: false });

  const medir = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setBordes({
      izq: el.scrollLeft > 1,
      der: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  }, []);

  // Recalcular las flechas al cambiar el tamaño (ventana, menú lateral, fuente)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [medir]);

  // Traer la solapa activa a la vista al navegar
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const activa = el?.querySelector('[aria-current="page"]');
    if (!el || !activa) return;
    const izq = activa.offsetLeft - 32;
    const der = activa.offsetLeft + activa.offsetWidth + 32 - el.clientWidth;
    if (el.scrollLeft > izq) el.scrollLeft = izq;
    else if (el.scrollLeft < der) el.scrollLeft = der;
    medir();
  }, [pathname, medir]);

  // Rueda vertical del mouse → scroll horizontal
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const desplazar = (dir) => {
    const el = scrollRef.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: 'smooth' });
  };

  const flecha =
    'absolute top-0 z-10 flex h-full w-10 cursor-pointer items-center text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white';

  return (
    <div
      className={`${className} textura-fondo relative flex-none border-b border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950`}
    >
      {bordes.izq && (
        <button
          type="button"
          onClick={() => desplazar(-1)}
          aria-label="Ver módulos anteriores"
          tabIndex={-1}
          className={`${flecha} left-0 justify-start bg-gradient-to-r from-white from-50% to-transparent pl-2 dark:from-slate-950`}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" aria-hidden="true" />
        </button>
      )}

      <nav
        ref={scrollRef}
        onScroll={medir}
        aria-label="Módulos"
        className="sin-scrollbar flex h-11 items-stretch gap-1 overflow-x-auto px-4 sm:px-6"
      >
        {modulos.map((m) => (
          <NavLink
            key={m.key}
            to={m.to ?? '/' + m.key}
            end={m.end}
            title={titulo(m)}
            className={({ isActive }) =>
              `relative flex flex-none items-center gap-2 whitespace-nowrap px-3 first:ml-auto last:mr-auto text-sm font-bold transition-colors focus-visible:outline-offset-[-3px] ${
                isActive
                  ? 'text-gray-900 after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-teal-600 dark:text-white dark:after:bg-teal-400'
                  : m.bloqueado
                    ? 'text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FontAwesomeIcon
                  icon={m.icono}
                  className={`w-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`}
                  aria-hidden="true"
                />
                <span>{m.label}</span>
                {m.bloqueado && (
                  <FontAwesomeIcon icon={faLock} className="text-[10px] opacity-60" aria-label="(requiere permiso)" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {bordes.der && (
        <button
          type="button"
          onClick={() => desplazar(1)}
          aria-label="Ver más módulos"
          tabIndex={-1}
          className={`${flecha} right-0 justify-end bg-gradient-to-l from-white from-50% to-transparent pr-2 dark:from-slate-950`}
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Celular / tablet (< lg): botón "módulo actual ▾" + grilla de módulos */
/* ------------------------------------------------------------------ */

export function ModuloSelector({ className = '' }) {
  const modulos = useModulos();
  const { pathname } = useLocation();
  const actual = moduloDeRuta(pathname);
  const [abierto, setAbierto] = useState(false);
  const botonRef = useRef(null);
  const panelRef = useRef(null);

  const cerrar = useCallback(() => {
    setAbierto(false);
    botonRef.current?.focus();
  }, []);

  // Escape, foco inicial y bloqueo del scroll de fondo
  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        cerrar();
      }
    };
    document.addEventListener('keydown', onKey);
    const panel = panelRef.current;
    (panel?.querySelector('[aria-current="page"]') || panel?.querySelector('a'))?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [abierto, cerrar]);

  const enInicio = actual.key === 'inicio';

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className={`${className} min-h-11 max-w-full flex-none cursor-pointer items-center gap-2 rounded-[10px] border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 shadow-sm transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:shadow-none dark:hover:bg-slate-700`}
      >
        <FontAwesomeIcon icon={actual.icono} className="w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
        <span className="truncate">{enInicio ? 'Módulos' : actual.label}</span>
        <FontAwesomeIcon icon={faChevronDown} className="text-[10px] opacity-60" aria-hidden="true" />
      </button>

      {abierto &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
            <button
              type="button"
              aria-label="Cerrar"
              tabIndex={-1}
              onClick={cerrar}
              className="absolute inset-0 cursor-default bg-black/50"
            />
            {/* Celular: ocupa toda la pantalla. Desde tablet: ventana centrada */}
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modulos-titulo"
              className="relative h-[100dvh] w-full overflow-y-auto rounded-none bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-xl dark:bg-slate-900 sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-2xl sm:p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2
                  id="modulos-titulo"
                  className="text-[12px] font-extrabold uppercase tracking-[1.6px] text-gray-600 dark:text-slate-300"
                >
                  Módulos
                </h2>
                <button
                  type="button"
                  onClick={cerrar}
                  aria-label="Cerrar"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-lg" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Módulos" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {modulos.map((m) => (
                  <NavLink
                    key={m.key}
                    to={m.to ?? '/' + m.key}
                    end={m.end}
                    title={titulo(m)}
                    onClick={() => setAbierto(false)}
                    className={({ isActive }) =>
                      `relative flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center text-sm font-bold transition-colors ${
                        isActive
                          ? 'border-teal-600 bg-teal-50 text-gray-900 dark:border-teal-400 dark:bg-teal-950/40 dark:text-white'
                          : m.bloqueado
                            ? 'border-gray-200 text-gray-400 hover:bg-gray-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <FontAwesomeIcon
                      icon={m.icono}
                      className={`text-xl ${m.bloqueado ? '' : 'text-teal-600 dark:text-teal-400'}`}
                      aria-hidden="true"
                    />
                    <span className="leading-tight">{m.label}</span>
                    {m.bloqueado && (
                      <FontAwesomeIcon
                        icon={faLock}
                        className="absolute right-2.5 top-2.5 text-[10px] opacity-60"
                        aria-label="(requiere permiso)"
                      />
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
